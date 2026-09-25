import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { PhotoSlotGrid, usePhotoDesk } from "@/components/photo-editor";
import { MenuEditor } from "@/components/menu-editor";
import { notifyCms } from "@/lib/cms";
import { photoSlots } from "@/lib/site-photos";
import { saveCopy, type SiteCopy } from "@/lib/site-copy";
import type { SitePhoto } from "@/lib/site-photos";
import type { SiteMenu } from "@/lib/site-menu";
import { formatHourLabel, type HoursRow } from "@/lib/restaurant";

const inputClass =
  "w-full border border-line bg-bg px-3 py-3 text-fg outline-none focus:border-primary";

const nav = [
  { href: "#desk-hero", label: "Hero" },
  { href: "#desk-about", label: "About" },
  { href: "#flyer-desk", label: "Special Event", event: true },
  { href: "#desk-specials", label: "Specials" },
  { href: "#desk-kitchen", label: "Kitchen" },
  { href: "#desk-menu", label: "Menu" },
  { href: "#desk-order", label: "Order" },
  { href: "#desk-banquets", label: "Banquets" },
  { href: "#desk-visit", label: "Visit" },
  { href: "#desk-gallery", label: "Gallery" },
];

export function SiteDesk({
  pin,
  photos,
  copy,
  menu,
  onPhotos,
  onCopy,
  onMenu,
  eventEditor,
  onOpenEvent,
}: {
  pin: string;
  photos: Record<string, SitePhoto>;
  copy: SiteCopy;
  menu: SiteMenu;
  onPhotos: (photos: Record<string, SitePhoto>) => void;
  onCopy: (copy: SiteCopy) => void;
  onMenu: (menu: SiteMenu) => void;
  eventEditor?: ReactNode;
  onOpenEvent?: () => void;
}) {
  const desk = usePhotoDesk({ pin, photos, onSaved: onPhotos });
  const save = useServerFn(saveCopy);
  const [draft, setDraft] = useState<SiteCopy>(copy);
  const [saved, setSaved] = useState<SiteCopy>(copy);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const skipAutosave = useRef(false);

  useEffect(() => {
    skipAutosave.current = true;
    setDraft(copy);
    setSaved(copy);
  }, [copy]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  async function saveText(reason: "manual" | "auto" = "manual") {
    if (!draft.heroHeadline.trim() || !draft.aboutHeadline.trim()) {
      setMsg("Headline can’t be blank.");
      return;
    }
    setBusy(true);
    skipAutosave.current = true;
    setMsg(reason === "auto" ? "Saving…" : "Saving…");
    try {
      const res = await save({ data: { pin, ...draft } });
      onCopy(res.copy);
      setDraft(res.copy);
      setSaved(res.copy);
      notifyCms({ copy: res.copy });
      setMsg(reason === "auto" ? "Saved." : "Text is live on the site.");
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
      void saveText("auto");
    }, 1400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, busy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !busy) void saveText("manual");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, busy, draft]);

  useEffect(() => {
    function onBefore(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const saveBar = (
    <div className="desk-save flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void saveText("manual")}
        disabled={busy || !dirty}
        className="btn btn-fill disabled:opacity-60"
      >
        {busy ? "Saving…" : dirty ? "Save text" : "Saved"}
      </button>
      {dirty ? (
        <button
          type="button"
          onClick={() => setDraft(saved)}
          className="btn btn-line"
        >
          Discard
        </button>
      ) : null}
      <p className="min-h-6 text-sm text-primary">
        {msg ||
          (dirty
            ? "Unsaved words — photos already go live when you replace them."
            : "Photos save the moment you change them.")}
      </p>
    </div>
  );

  const galleryIds = photoSlots
    .filter((slot) => slot.group === "Gallery")
    .map((slot) => slot.id);

  return (
    <div className="desk-pad space-y-16">
      <div>
        <h2 className="font-display text-3xl text-primary">Site desk</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Each block is the picture and the words that sit with it. Change a
          photo and it is live. Words save as you pause, or hit Save text.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2 text-sm">
          {nav.map((item) =>
            item.event && onOpenEvent ? (
              <button
                key={item.href}
                type="button"
                onClick={onOpenEvent}
                className="border border-line px-4 py-2"
              >
                {item.label}
              </button>
            ) : (
              <a key={item.href} href={item.href} className="border border-line px-4 py-2">
                {item.label}
              </a>
            ),
          )}
        </nav>
        <div className="mt-6">{saveBar}</div>
      </div>

      <Section
        id="desk-hero"
        title="Hero"
        hint="Top of the homepage — logo, background, and opening lines."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <PhotoSlotGrid ids={["logo"]} desk={desk} />
            <PhotoSlotGrid ids={["hero"]} desk={desk} large />
          </div>
          <div className="space-y-4">
            <Field label="Kicker" value={draft.heroKicker} max={60}>
              <input
                className={inputClass}
                value={draft.heroKicker}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, heroKicker: e.target.value }))
                }
                maxLength={60}
              />
            </Field>
            <Field label="Headline" value={draft.heroHeadline} max={80}>
              <input
                className={inputClass}
                value={draft.heroHeadline}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, heroHeadline: e.target.value }))
                }
                required
                maxLength={80}
              />
            </Field>
            <Field label="Intro" value={draft.heroBody} max={240}>
              <textarea
                className={inputClass}
                value={draft.heroBody}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, heroBody: e.target.value }))
                }
                rows={3}
                maxLength={240}
              />
            </Field>
            <Field label="Happy hour line" value={draft.happyHour} max={80}>
              <input
                className={inputClass}
                value={draft.happyHour}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, happyHour: e.target.value }))
                }
                maxLength={80}
              />
            </Field>
            <Preview>
              <p className="eyebrow">{draft.heroKicker || "Kicker"}</p>
              <p className="display-sm mt-2">{draft.heroHeadline}</p>
              <p className="mt-3 text-sm text-muted">{draft.heroBody}</p>
            </Preview>
          </div>
        </div>
      </Section>

      <Section
        id="desk-about"
        title="About"
        hint="The family story and the dining-room photo beside it."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PhotoSlotGrid ids={["about"]} desk={desk} large />
          <div className="space-y-4">
            <Field label="Headline" value={draft.aboutHeadline} max={80}>
              <input
                className={inputClass}
                value={draft.aboutHeadline}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, aboutHeadline: e.target.value }))
                }
                maxLength={80}
              />
            </Field>
            {draft.about.map((paragraph, index) => (
              <Field
                key={index}
                label={`Paragraph ${index + 1}`}
                value={paragraph}
                max={400}
              >
                <textarea
                  className={inputClass}
                  value={paragraph}
                  onChange={(e) => {
                    const next = [...draft.about] as SiteCopy["about"];
                    next[index] = e.target.value;
                    setDraft((p) => ({ ...p, about: next }));
                  }}
                  rows={3}
                  maxLength={400}
                />
              </Field>
            ))}
          </div>
        </div>
      </Section>

      {eventEditor}

      <Section
        id="desk-specials"
        title="This week"
        hint="Three specials — photo, title, and detail together. The third card is the large feature on the site."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {draft.specials.map((item, index) => {
            const slotId = [
              "special-happy-hour",
              "special-tequila-sundays",
              "special-smoke-show",
            ][index];
            return (
              <div key={slotId} className="space-y-3 border border-line p-3">
                <p className="stamp text-primary">
                  {index === 2 ? "Featured" : `Card ${index + 1}`}
                </p>
                <PhotoSlotGrid ids={[slotId]} desk={desk} />
                <Field label="Title" value={item.title} max={40}>
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(e) => {
                      const next = [...draft.specials] as SiteCopy["specials"];
                      next[index] = { ...next[index], title: e.target.value };
                      setDraft((p) => ({ ...p, specials: next }));
                    }}
                    maxLength={40}
                  />
                </Field>
                <Field label="Detail" value={item.detail} max={160}>
                  <input
                    className={inputClass}
                    value={item.detail}
                    onChange={(e) => {
                      const next = [...draft.specials] as SiteCopy["specials"];
                      next[index] = { ...next[index], detail: e.target.value };
                      setDraft((p) => ({ ...p, specials: next }));
                    }}
                    maxLength={160}
                  />
                </Field>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="desk-kitchen"
        title="Kitchen & bar"
        hint="Menu collage (three plates) and the two drink photos."
      >
        <p className="text-sm text-muted">Food photos</p>
        <PhotoSlotGrid ids={["menu-1", "menu-2", "menu-3"]} desk={desk} />
        <p className="pt-4 text-sm text-muted">Drink photos</p>
        <PhotoSlotGrid ids={["drinks-1", "drinks-2"]} desk={desk} />
      </Section>

      <Section
        id="desk-menu"
        title="Menus"
        hint="Add sections and dishes. Prices and notes go live when this saves."
      >
        <MenuEditor pin={pin} menu={menu} onSaved={onMenu} />
      </Section>

      <Section
        id="desk-order"
        title="Order"
        hint="Takeout photo and the delivery lines."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PhotoSlotGrid ids={["order"]} desk={desk} large />
          <div className="space-y-4">
            <Field label="Headline" value={draft.orderHeadline} max={80}>
              <input
                className={inputClass}
                value={draft.orderHeadline}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, orderHeadline: e.target.value }))
                }
                maxLength={80}
              />
            </Field>
            <Field label="Body" value={draft.orderBody} max={240}>
              <textarea
                className={inputClass}
                value={draft.orderBody}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, orderBody: e.target.value }))
                }
                rows={3}
                maxLength={240}
              />
            </Field>
            <Preview>
              <p className="eyebrow">Takeout & delivery</p>
              <p className="display-sm mt-2">{draft.orderHeadline}</p>
              <p className="mt-3 text-sm text-muted">{draft.orderBody}</p>
            </Preview>
          </div>
        </div>
      </Section>

      <Section
        id="desk-banquets"
        title="Banquets"
        hint="Private parties photo and copy."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PhotoSlotGrid ids={["banquets"]} desk={desk} large />
          <div className="space-y-4">
            <Field label="Headline" value={draft.banquetHeadline} max={80}>
              <input
                className={inputClass}
                value={draft.banquetHeadline}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, banquetHeadline: e.target.value }))
                }
                maxLength={80}
              />
            </Field>
            <Field label="Body" value={draft.banquetBody} max={320}>
              <textarea
                className={inputClass}
                value={draft.banquetBody}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, banquetBody: e.target.value }))
                }
                rows={4}
                maxLength={320}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        id="desk-visit"
        title="Visit"
        hint="Find-us photo, hours, and the OpenTable photo."
      >
        <PhotoSlotGrid ids={["visit", "contact"]} desk={desk} />
        <Field label="Headline" value={draft.visitHeadline} max={80}>
          <input
            className={inputClass}
            value={draft.visitHeadline}
            onChange={(e) =>
              setDraft((p) => ({ ...p, visitHeadline: e.target.value }))
            }
            maxLength={80}
          />
        </Field>
        <div>
          <p className="mb-3 text-sm text-muted">Hours</p>
          <ul className="divide-y divide-line border border-line bg-surface">
            {draft.hours.map((row, index) => (
              <li
                key={row.day}
                className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:items-center"
              >
                <p className="font-medium">{row.day}</p>
                <label className="text-xs text-muted">
                  Opens
                  <input
                    className={`${inputClass} mt-1`}
                    type="time"
                    value={row.open}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hours: patchHours(p.hours, index, {
                          open: e.target.value,
                        }),
                      }))
                    }
                  />
                </label>
                <label className="text-xs text-muted">
                  Closes
                  <input
                    className={`${inputClass} mt-1`}
                    type="time"
                    value={row.close}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hours: patchHours(p.hours, index, {
                          close: e.target.value,
                        }),
                      }))
                    }
                  />
                </label>
                <p className="text-sm text-primary">{row.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        id="desk-gallery"
        title="Gallery"
        hint="Guest photos and captions. Captions save when you leave the field."
      >
        <PhotoSlotGrid ids={galleryIds} desk={desk} captions />
      </Section>
    </div>
  );
}

function patchHours(
  hours: HoursRow[],
  index: number,
  patch: Partial<Pick<HoursRow, "open" | "close">>,
): HoursRow[] {
  return hours.map((row, i) => {
    if (i !== index) return row;
    const open = patch.open ?? row.open;
    const close = patch.close ?? row.close;
    return {
      ...row,
      open,
      close,
      label: formatHourLabel(open, close),
    };
  });
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-6">
      <div>
        <h3 className="font-display text-3xl text-fg">{title}</h3>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  max,
  children,
}: {
  label: string;
  value?: string;
  max?: number;
  children: ReactNode;
}) {
  return (
    <label className="block max-w-2xl text-sm text-muted">
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        {max != null && value != null ? (
          <span className="count">
            {value.length}/{max}
          </span>
        ) : null}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Preview({ children }: { children: ReactNode }) {
  return (
    <aside className="border border-line bg-bg p-5">
      <p className="stamp mb-3 text-muted">On the site</p>
      {children}
    </aside>
  );
}
