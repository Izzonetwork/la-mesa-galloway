import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImageIcon, Megaphone, Type } from "lucide-react";
import { EventFlyer } from "@/components/event-flyer";
import { SiteDesk } from "@/components/site-desk";
import { GuestCollection } from "@/components/guest-collection";
import { listInbox, type SubscriberRow } from "@/lib/bookings";
import { notifyCms } from "@/lib/cms";
import {
  flyerImageChoices,
  getStaffFlyer,
  saveFlyer,
  type Flyer,
} from "@/lib/flyer";
import { getStaffPhotos, type SitePhoto } from "@/lib/site-photos";
import { getStaffCopy, type SiteCopy } from "@/lib/site-copy";
import { getStaffMenu, type SiteMenu } from "@/lib/site-menu";
import { readPhotoFile } from "@/lib/read-photo-file";
import { SiteImg } from "@/components/site-photos";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff · La Mesa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Inbox = {
  subscribers: SubscriberRow[];
};

type Tab = "site" | "event" | "list";

const inputClass =
  "w-full border border-line bg-bg px-3 py-3 text-fg outline-none focus:border-primary";

function AdminPage() {
  const loadInbox = useServerFn(listInbox);
  const loadFlyer = useServerFn(getStaffFlyer);
  const loadPhotos = useServerFn(getStaffPhotos);
  const loadCopy = useServerFn(getStaffCopy);
  const loadMenu = useServerFn(getStaffMenu);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Inbox | null>(null);
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [photos, setPhotos] = useState<Record<string, SitePhoto> | null>(null);
  const [copy, setCopy] = useState<SiteCopy | null>(null);
  const [menu, setMenu] = useState<SiteMenu | null>(null);
  const [tab, setTab] = useState<Tab>("site");

  const open = Boolean(data && photos && copy && flyer && menu);

  async function unlock(nextPin: string) {
    setError("");
    setBusy(true);
    try {
      const [inbox, nextFlyer, nextPhotos, nextCopy, nextMenu] = await Promise.all([
        loadInbox({ data: { pin: nextPin } }),
        loadFlyer({ data: { pin: nextPin } }),
        loadPhotos({ data: { pin: nextPin } }),
        loadCopy({ data: { pin: nextPin } }),
        loadMenu({ data: { pin: nextPin } }),
      ]);
      setData(inbox);
      setFlyer(nextFlyer);
      setPhotos(nextPhotos);
      setCopy(nextCopy);
      setMenu(nextMenu);
      sessionStorage.setItem("lamesa-staff-pin", nextPin);
    } catch (err) {
      sessionStorage.removeItem("lamesa-staff-pin");
      setError(
        err instanceof Error && /unauthor/i.test(err.message)
          ? "Wrong PIN"
          : "Could not load",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("lamesa-staff-pin");
    if (!saved) return;
    setPin(saved);
    void unlock(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await unlock(pin);
  }

  function lock() {
    sessionStorage.removeItem("lamesa-staff-pin");
    setData(null);
    setFlyer(null);
    setPhotos(null);
    setCopy(null);
    setMenu(null);
    setPin("");
    setError("");
    setTab("site");
  }

  async function refreshList() {
    if (!pin) return;
    try {
      const inbox = await loadInbox({ data: { pin } });
      setData(inbox);
    } catch {
      setError("Could not refresh the list");
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 bg-fg text-bg">
        <div className="chile-bar" />
        <div className="wrap flex items-center justify-between py-3">
          <Link to="/admin" className="flex items-center gap-3">
            <SiteImg slot="logo" className="h-9 w-auto object-contain" />
            <span className="stamp">Kitchen office</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn btn-line">
              View site
            </Link>
            {open ? (
              <button type="button" onClick={lock} className="btn btn-fill">
                Lock
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="wrap py-10">
        <p className="eyebrow">Staff</p>
        <h1 className="display mt-2">Kitchen office</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Change photos, words, hours, and the special event from one desk.
          Guest names land in the list with the number they gave you.
        </p>

        {open ? (
          <p className="mt-6 text-sm text-muted">Office is open. Edits go live on the site.</p>
        ) : busy ? (
          <p className="mt-8 text-sm text-muted">Opening the office…</p>
        ) : (
          <form
            className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={onSubmit}
          >
            <input
              className="min-h-11 flex-1 border border-line bg-surface px-3 py-3 text-fg"
              type="password"
              name="pin"
              autoComplete="current-password"
              placeholder="Staff PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="btn btn-fill disabled:opacity-60"
            >
              Open office
            </button>
          </form>
        )}
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}

        {!open ? (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <PipeCard
              icon={<ImageIcon className="size-5 text-primary" />}
              title="Page blocks"
              body="Photo and words for each section, side by side. Photos save when you drop them."
            />
            <PipeCard
              icon={<Type className="size-5 text-primary" />}
              title="Menus"
              body="Add sections and dishes. Prices and notes save as you pause."
            />
            <PipeCard
              icon={<Megaphone className="size-5 text-primary" />}
              title="Event & list"
              body="Special Event poster, then the guest list collection from Subscribe."
            />
          </div>
        ) : (
          <div className="mt-10">
            <nav className="flex flex-wrap gap-2">
              {(
                [
                  ["site", "Site"],
                  ["event", "Special Event"],
                  ["list", `Collection (${data?.subscribers.length ?? 0})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`desk-tab ${tab === id ? "is-on" : ""}`}
                  onClick={() => {
                    setTab(id);
                    if (id === "list") void refreshList();
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-10">
              {tab === "site" && photos && copy && menu ? (
                <SiteDesk
                  pin={pin}
                  photos={photos}
                  copy={copy}
                  menu={menu}
                  onPhotos={setPhotos}
                  onCopy={setCopy}
                  onMenu={setMenu}
                  onOpenEvent={() => setTab("event")}
                />
              ) : null}
              {tab === "event" && flyer ? (
                <FlyerEditor pin={pin} flyer={flyer} onSaved={setFlyer} />
              ) : null}
              {tab === "list" && data ? (
                <GuestCollection
                  pin={pin}
                  rows={data.subscribers}
                  onChange={(subscribers) => setData({ subscribers })}
                  onRefresh={() => void refreshList()}
                />
              ) : null}
            </div>
          </div>
        )}

        <p className="mt-16 text-sm text-muted">
          <Link to="/" className="text-primary">
            Back to the site
          </Link>
        </p>
      </main>
    </div>
  );
}

function FlyerEditor({
  pin,
  flyer,
  onSaved,
}: {
  pin: string;
  flyer: Flyer;
  onSaved: (flyer: Flyer) => void;
}) {
  const save = useServerFn(saveFlyer);
  const [draft, setDraft] = useState<Flyer>(flyer);
  const [savedFlyer, setSavedFlyer] = useState<Flyer>(flyer);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const skip = useRef(false);

  useEffect(() => {
    skip.current = true;
    setDraft(flyer);
    setSavedFlyer(flyer);
  }, [flyer]);

  function patch(partial: Partial<Flyer>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  async function persist(next: Flyer, reason: "manual" | "auto" | "toggle") {
    if (!next.title.trim()) {
      setMsg("Add a title.");
      return;
    }
    setBusy(true);
    skip.current = true;
    setMsg("Saving…");
    try {
      const res = await save({
        data: {
          pin,
          kicker: next.kicker,
          title: next.title,
          whenLabel: next.whenLabel,
          body: next.body,
          imageSrc: next.imageSrc,
          ctaLabel: next.ctaLabel,
          ctaHref: next.ctaHref,
          published: next.published,
        },
      });
      onSaved(res.flyer);
      setDraft(res.flyer);
      setSavedFlyer(res.flyer);
      skip.current = true;
      notifyCms({ flyer: res.flyer.published ? res.flyer : null });
      setMsg(
        reason === "toggle"
          ? next.published
            ? "Event is on the site."
            : "Event is hidden."
          : "Special event is live.",
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(savedFlyer);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (!dirty || busy) return;
    const handle = window.setTimeout(() => {
      void persist(draft, "auto");
    }, 1400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, busy]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await persist(draft, "manual");
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg("Reading photo…");
    try {
      const imageSrc = await readPhotoFile(file);
      const next = { ...draft, imageSrc };
      setDraft(next);
      await persist(next, "manual");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not read photo");
      setBusy(false);
    }
  }

  async function onPick(imageSrc: string) {
    const next = { ...draft, imageSrc };
    setDraft(next);
    await persist(next, "manual");
  }

  return (
    <section id="flyer-desk">
      <h2 className="font-display text-3xl text-primary">Special event</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        This poster is the Special Event on the site. Hide it when the night is
        over. Words save as you pause.
      </p>

      <form
        onSubmit={onSave}
        className="mt-6 grid items-start gap-8 lg:grid-cols-2"
      >
        <div>
          <label className="mb-4 flex min-h-11 items-center gap-3 border border-line bg-surface px-4 text-sm">
            <input
              type="checkbox"
              className="size-4 min-h-0 accent-primary"
              checked={draft.published}
              onChange={(e) => {
                const next = { ...draft, published: e.target.checked };
                setDraft(next);
                void persist(next, "toggle");
              }}
            />
            Show on the site
          </label>
          <Field label="Kicker" value={draft.kicker} max={40}>
            <input
              className={inputClass}
              value={draft.kicker}
              onChange={(e) => patch({ kicker: e.target.value })}
              maxLength={40}
            />
          </Field>
          <Field label="Title" value={draft.title} max={80}>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
              maxLength={80}
            />
          </Field>
          <Field label="When" value={draft.whenLabel} max={80}>
            <input
              className={inputClass}
              value={draft.whenLabel}
              onChange={(e) => patch({ whenLabel: e.target.value })}
              maxLength={80}
              placeholder="Saturday, Sept 6 · 7pm"
            />
          </Field>
          <Field label="Details" value={draft.body} max={400}>
            <textarea
              className={inputClass}
              value={draft.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={4}
              maxLength={400}
            />
          </Field>
          <Field label="Button label" value={draft.ctaLabel} max={40}>
            <input
              className={inputClass}
              value={draft.ctaLabel}
              onChange={(e) => patch({ ctaLabel: e.target.value })}
              maxLength={40}
            />
          </Field>
          <Field label="Button link" value={draft.ctaHref} max={300}>
            <input
              className={inputClass}
              value={draft.ctaHref}
              onChange={(e) => patch({ ctaHref: e.target.value })}
              maxLength={300}
              placeholder="Blank = OpenTable"
            />
          </Field>

          <p className="mb-2 mt-6 text-sm text-muted">Photo</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {flyerImageChoices.map((choice) => (
              <button
                key={choice.src}
                type="button"
                onClick={() => void onPick(choice.src)}
                className={`overflow-hidden border ${
                  draft.imageSrc.split("?")[0] === choice.src
                    ? "border-primary"
                    : "border-line"
                }`}
              >
                <img
                  src={choice.src}
                  alt={choice.label}
                  className="h-16 w-full object-cover"
                />
              </button>
            ))}
          </div>
          <label className="btn btn-fill mt-4 cursor-pointer">
            Upload a photo
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void onUpload(file);
              }}
            />
          </label>

          <button
            type="submit"
            disabled={busy || !dirty}
            className="btn btn-fill mt-6 disabled:opacity-60"
          >
            {busy ? "Saving…" : dirty ? "Save event" : "Saved"}
          </button>
          <p className="mt-3 min-h-6 text-sm text-primary">{msg}</p>
        </div>

        <div>
          <p className="eyebrow mb-3">Preview</p>
          <EventFlyer flyer={draft} preview />
        </div>
      </form>
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
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm text-muted">
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

function PipeCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="border border-line bg-surface p-5">
      <div className="mb-4">{icon}</div>
      <h2 className="font-display text-2xl text-fg">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </article>
  );
}
