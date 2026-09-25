import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { notifyCms } from "@/lib/cms";
import {
  saveMenu,
  type MenuCategory,
  type MenuDish,
  type SiteMenu,
} from "@/lib/site-menu";

const inputClass =
  "w-full border border-line bg-bg px-3 py-3 text-fg outline-none focus:border-primary";

function uid() {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDish(): MenuDish {
  return { id: uid(), name: "", price: "", note: "" };
}

function emptyCategory(): MenuCategory {
  return { id: uid(), title: "New section", items: [emptyDish()] };
}

export function MenuEditor({
  pin,
  menu,
  onSaved,
}: {
  pin: string;
  menu: SiteMenu;
  onSaved: (menu: SiteMenu) => void;
}) {
  const save = useServerFn(saveMenu);
  const [draft, setDraft] = useState<SiteMenu>(menu);
  const [saved, setSaved] = useState<SiteMenu>(menu);
  const [side, setSide] = useState<"food" | "drinks">("food");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const skipAutosave = useRef(false);

  useEffect(() => {
    skipAutosave.current = true;
    setDraft(menu);
    setSaved(menu);
  }, [menu]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const categories = draft[side];

  async function persist(reason: "manual" | "auto" = "manual") {
    if (!draft.food.length || !draft.drinks.length) {
      setMsg("Keep at least one food section and one drink section.");
      return;
    }
    setBusy(true);
    skipAutosave.current = true;
    setMsg("Saving…");
    try {
      const res = await save({ data: { pin, ...draft } });
      onSaved(res.menu);
      setDraft(res.menu);
      setSaved(res.menu);
      notifyCms({ menu: res.menu });
      setMsg(reason === "auto" ? "Saved." : "Menu is live on the site.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (!dirty || busy) return;
    const handle = window.setTimeout(() => {
      void persist("auto");
    }, 1400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, busy]);

  function patchSide(next: MenuCategory[]) {
    setDraft((prev) => ({ ...prev, [side]: next }));
  }

  function patchCategory(index: number, patch: Partial<MenuCategory>) {
    patchSide(categories.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function patchDish(catIndex: number, dishIndex: number, patch: Partial<MenuDish>) {
    const next = categories.map((row, i) => {
      if (i !== catIndex) return row;
      return {
        ...row,
        items: row.items.map((dish, j) => (j === dishIndex ? { ...dish, ...patch } : dish)),
      };
    });
    patchSide(next);
  }

  return (
    <div className="space-y-6">
      <div className="desk-save flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void persist("manual")}
          disabled={busy || !dirty}
          className="btn btn-fill disabled:opacity-60"
        >
          {busy ? "Saving…" : dirty ? "Save menu" : "Saved"}
        </button>
        {dirty ? (
          <button type="button" onClick={() => setDraft(saved)} className="btn btn-line">
            Discard
          </button>
        ) : null}
        <p className="min-h-6 text-sm text-primary">
          {msg || (dirty ? "Unsaved dishes — they go live when this saves." : "This list is what guests see.")}
        </p>
      </div>

      <label className="block text-sm text-muted">
        Taco note
        <input
          className={`${inputClass} mt-1`}
          value={draft.tacoNote}
          onChange={(e) => setDraft((p) => ({ ...p, tacoNote: e.target.value }))}
          maxLength={120}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-muted">
          Food menu PDF
          <input
            className={`${inputClass} mt-1`}
            value={draft.foodPdf}
            onChange={(e) => setDraft((p) => ({ ...p, foodPdf: e.target.value }))}
            maxLength={300}
          />
        </label>
        <label className="block text-sm text-muted">
          Drink menu PDF
          <input
            className={`${inputClass} mt-1`}
            value={draft.drinksPdf}
            onChange={(e) => setDraft((p) => ({ ...p, drinksPdf: e.target.value }))}
            maxLength={300}
          />
        </label>
      </div>

      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["food", `Food (${draft.food.reduce((n, c) => n + c.items.length, 0)})`],
            ["drinks", `Drinks (${draft.drinks.reduce((n, c) => n + c.items.length, 0)})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`desk-tab ${side === id ? "is-on" : ""}`}
            onClick={() => setSide(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="space-y-8">
        {categories.map((category, catIndex) => (
          <article key={category.id} className="border border-line bg-surface p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 text-sm text-muted">
                Section
                <input
                  className={`${inputClass} mt-1`}
                  value={category.title}
                  onChange={(e) => patchCategory(catIndex, { title: e.target.value })}
                  maxLength={40}
                />
              </label>
              <button
                type="button"
                className="btn btn-line"
                disabled={categories.length < 2}
                onClick={() => patchSide(categories.filter((_, i) => i !== catIndex))}
              >
                <Trash2 className="size-4" />
                Remove section
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {category.items.map((dish, dishIndex) => (
                <li key={dish.id} className="border border-line bg-bg p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_7rem_1fr_auto] sm:items-end">
                    <label className="text-sm text-muted">
                      Dish
                      <input
                        className={`${inputClass} mt-1`}
                        value={dish.name}
                        onChange={(e) =>
                          patchDish(catIndex, dishIndex, { name: e.target.value })
                        }
                        maxLength={80}
                      />
                    </label>
                    <label className="text-sm text-muted">
                      Price
                      <input
                        className={`${inputClass} mt-1`}
                        value={dish.price}
                        onChange={(e) =>
                          patchDish(catIndex, dishIndex, { price: e.target.value })
                        }
                        maxLength={24}
                      />
                    </label>
                    <label className="text-sm text-muted">
                      Note
                      <input
                        className={`${inputClass} mt-1`}
                        value={dish.note}
                        onChange={(e) =>
                          patchDish(catIndex, dishIndex, { note: e.target.value })
                        }
                        maxLength={80}
                      />
                    </label>
                    <button
                      type="button"
                      className="inline-flex size-11 items-center justify-center text-muted hover:text-primary"
                      aria-label={`Remove ${dish.name || "dish"}`}
                      onClick={() =>
                        patchCategory(catIndex, {
                          items: category.items.filter((_, i) => i !== dishIndex),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="btn btn-line mt-4"
              disabled={category.items.length >= 40}
              onClick={() =>
                patchCategory(catIndex, { items: [...category.items, emptyDish()] })
              }
            >
              <Plus className="size-4" />
              Add dish
            </button>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-line"
        disabled={categories.length >= 12}
        onClick={() => patchSide([...categories, emptyCategory()])}
      >
        <Plus className="size-4" />
        Add section
      </button>
    </div>
  );
}
