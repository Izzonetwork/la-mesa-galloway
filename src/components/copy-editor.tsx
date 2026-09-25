import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { notifyCms } from "@/lib/cms";
import { saveCopy, type SiteCopy } from "@/lib/site-copy";

const inputClass =
  "w-full rounded-lg border border-line bg-bg px-3 py-3 text-fg outline-none focus:border-accent";

export function CopyEditor({
  pin,
  copy,
  onSaved,
}: {
  pin: string;
  copy: SiteCopy;
  onSaved: (copy: SiteCopy) => void;
}) {
  const save = useServerFn(saveCopy);
  const [draft, setDraft] = useState<SiteCopy>(copy);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(copy);
  }, [copy]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("Saving…");
    try {
      const res = await save({ data: { pin, ...draft } });
      onSaved(res.copy);
      setDraft(res.copy);
      notifyCms({ copy: res.copy });
      setMsg("Copy is live on the site.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const saveBar = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={busy}
        className="btn btn-fill disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save copy"}
      </button>
      <p className="min-h-6 text-sm text-accent">{msg}</p>
    </div>
  );

  return (
    <section id="copy-desk">
      <h2 className="font-display text-3xl text-accent">Headlines & text</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Edit any line, then save. The public site updates as soon as this
        succeeds.
      </p>
      <form onSubmit={onSave} className="mt-8 max-w-2xl space-y-8">
        <div className="sticky top-16 z-20 rounded-xl border border-line bg-bg/95 p-3 backdrop-blur">
          {saveBar}
        </div>

        <fieldset>
          <legend className="font-display text-2xl text-fg">Hero</legend>
          <label className="mt-3 block text-sm text-muted">
            Kicker
            <input
              className={`${inputClass} mt-1`}
              value={draft.heroKicker}
              onChange={(e) =>
                setDraft((p) => ({ ...p, heroKicker: e.target.value }))
              }
              maxLength={60}
            />
          </label>
          <label className="mt-3 block text-sm text-muted">
            Headline
            <input
              className={`${inputClass} mt-1`}
              value={draft.heroHeadline}
              onChange={(e) =>
                setDraft((p) => ({ ...p, heroHeadline: e.target.value }))
              }
              required
              maxLength={80}
            />
          </label>
          <label className="mt-3 block text-sm text-muted">
            Intro
            <textarea
              className={`${inputClass} mt-1`}
              value={draft.heroBody}
              onChange={(e) =>
                setDraft((p) => ({ ...p, heroBody: e.target.value }))
              }
              rows={3}
              maxLength={240}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-fg">About</legend>
          <label className="mt-3 block text-sm text-muted">
            Headline
            <input
              className={`${inputClass} mt-1`}
              value={draft.aboutHeadline}
              onChange={(e) =>
                setDraft((p) => ({ ...p, aboutHeadline: e.target.value }))
              }
              maxLength={80}
            />
          </label>
          {draft.about.map((paragraph, index) => (
            <label key={index} className="mt-3 block text-sm text-muted">
              Paragraph {index + 1}
              <textarea
                className={`${inputClass} mt-1`}
                value={paragraph}
                onChange={(e) => {
                  const next = [...draft.about] as SiteCopy["about"];
                  next[index] = e.target.value;
                  setDraft((p) => ({ ...p, about: next }));
                }}
                rows={3}
                maxLength={400}
              />
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-fg">Specials</legend>
          {draft.specials.map((item, index) => (
            <div key={index} className="mt-4">
              <label className="block text-sm text-muted">
                Title {index + 1}
                <input
                  className={`${inputClass} mt-1`}
                  value={item.title}
                  onChange={(e) => {
                    const next = [...draft.specials] as SiteCopy["specials"];
                    next[index] = { ...next[index], title: e.target.value };
                    setDraft((p) => ({ ...p, specials: next }));
                  }}
                  maxLength={40}
                />
              </label>
              <label className="mt-2 block text-sm text-muted">
                Detail
                <input
                  className={`${inputClass} mt-1`}
                  value={item.detail}
                  onChange={(e) => {
                    const next = [...draft.specials] as SiteCopy["specials"];
                    next[index] = { ...next[index], detail: e.target.value };
                    setDraft((p) => ({ ...p, specials: next }));
                  }}
                  maxLength={160}
                />
              </label>
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-fg">Order</legend>
          <label className="mt-3 block text-sm text-muted">
            Headline
            <input
              className={`${inputClass} mt-1`}
              value={draft.orderHeadline}
              onChange={(e) =>
                setDraft((p) => ({ ...p, orderHeadline: e.target.value }))
              }
              maxLength={80}
            />
          </label>
          <label className="mt-3 block text-sm text-muted">
            Body
            <textarea
              className={`${inputClass} mt-1`}
              value={draft.orderBody}
              onChange={(e) =>
                setDraft((p) => ({ ...p, orderBody: e.target.value }))
              }
              rows={3}
              maxLength={240}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-fg">Banquets</legend>
          <label className="mt-3 block text-sm text-muted">
            Headline
            <input
              className={`${inputClass} mt-1`}
              value={draft.banquetHeadline}
              onChange={(e) =>
                setDraft((p) => ({ ...p, banquetHeadline: e.target.value }))
              }
              maxLength={80}
            />
          </label>
          <label className="mt-3 block text-sm text-muted">
            Body
            <textarea
              className={`${inputClass} mt-1`}
              value={draft.banquetBody}
              onChange={(e) =>
                setDraft((p) => ({ ...p, banquetBody: e.target.value }))
              }
              rows={4}
              maxLength={320}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-fg">Visit</legend>
          <label className="mt-3 block text-sm text-muted">
            Headline
            <input
              className={`${inputClass} mt-1`}
              value={draft.visitHeadline}
              onChange={(e) =>
                setDraft((p) => ({ ...p, visitHeadline: e.target.value }))
              }
              maxLength={80}
            />
          </label>
          <label className="mt-3 block text-sm text-muted">
            Happy hour bar
            <input
              className={`${inputClass} mt-1`}
              value={draft.happyHour}
              onChange={(e) =>
                setDraft((p) => ({ ...p, happyHour: e.target.value }))
              }
              maxLength={80}
            />
          </label>
        </fieldset>

        {saveBar}
      </form>
    </section>
  );
}
