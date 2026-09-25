import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  Download,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  addStaffSubscriber,
  deleteStaffSubscriber,
  formatPhoneDisplay,
  updateStaffSubscriber,
  type SubscriberRow,
} from "@/lib/bookings";
import { restaurant } from "@/lib/restaurant";

const inputClass =
  "w-full border border-line bg-bg px-3 py-3 text-fg outline-none focus:border-primary";

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function joinedOn(value: string) {
  const day = value.slice(0, 10);
  if (!day) return "—";
  return day;
}

export function GuestCollection({
  pin,
  rows,
  onChange,
  onRefresh,
}: {
  pin: string;
  rows: SubscriberRow[];
  onChange: (rows: SubscriberRow[]) => void;
  onRefresh: () => void;
}) {
  const addFn = useServerFn(addStaffSubscriber);
  const saveFn = useServerFn(updateStaffSubscriber);
  const removeFn = useServerFn(deleteStaffSubscriber);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "" });
  const [add, setAdd] = useState({
    name: "",
    email: "",
    phone: "",
    consent: false,
  });

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      row.email.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.phone.includes(q.replace(/\D/g, "")) ||
      formatPhoneDisplay(row.phone).toLowerCase().includes(q)
    );
  });

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`Copied ${label}.`);
    } catch {
      setNote("Could not copy.");
    }
  }

  function downloadCsv() {
    const lines = [
      ["Name", "Email", "Phone", "Joined", "Consented", "Terms"].join(","),
      ...rows.map((row) =>
        [
          csv(row.name),
          csv(row.email),
          csv(formatPhoneDisplay(row.phone)),
          csv(joinedOn(row.created_at)),
          csv(row.consented_at ? joinedOn(row.consented_at) : ""),
          csv(row.terms_version ?? ""),
        ].join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "la-mesa-guest-list.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNote("Spreadsheet downloaded.");
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("Saving…");
    try {
      const res = await addFn({
        data: { pin, ...add },
      });
      onChange(res.subscribers);
      setAdd({ name: "", email: "", phone: "", consent: false });
      setNote(res.message);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not add");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(id: number) {
    setBusy(true);
    setNote("Saving…");
    try {
      const res = await saveFn({ data: { pin, id, ...draft } });
      onChange(res.subscribers);
      setEditing(null);
      setNote("Saved.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(row: SubscriberRow) {
    const label = row.name || row.email;
    if (!window.confirm(`Remove ${label} from the guest list?`)) return;
    setBusy(true);
    try {
      const res = await removeFn({ data: { pin, id: row.id } });
      onChange(res.subscribers);
      if (editing === row.id) setEditing(null);
      setNote("Removed.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  const emails = rows.map((row) => row.email).join(", ");
  const phones = rows.map((row) => formatPhoneDisplay(row.phone)).join("\n");

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            Collection
          </p>
          <h2 className="display-sm mt-2">
            {rows.length} on the guest list
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onRefresh} className="btn btn-line">
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void copyText("emails", emails)}
            disabled={!rows.length}
            className="btn btn-line disabled:opacity-60"
          >
            <Copy className="size-4" />
            Copy emails
          </button>
          <button
            type="button"
            onClick={() => void copyText("numbers", phones)}
            disabled={!rows.length}
            className="btn btn-line disabled:opacity-60"
          >
            <Copy className="size-4" />
            Copy phones
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!rows.length}
            className="btn btn-fill disabled:opacity-60"
          >
            <Download className="size-4" />
            Download CSV
          </button>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-muted">
        Everyone who joins on the site lands here. Add a name from the bar if
        they agree. Tables stay on{" "}
        <a
          href={restaurant.reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary"
        >
          OpenTable
        </a>
        .
      </p>

      <form
        onSubmit={onAdd}
        className="mt-8 border border-line bg-surface p-4 sm:p-5"
      >
        <p className="font-display text-2xl">Add to the list</p>
        <p className="mt-1 text-sm text-muted">
          Same fields as the Subscribe form on the site.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-muted">
            Name
            <input
              className={`${inputClass} mt-1`}
              value={add.name}
              onChange={(e) => setAdd((p) => ({ ...p, name: e.target.value }))}
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label className="text-sm text-muted">
            Email
            <input
              className={`${inputClass} mt-1`}
              type="email"
              required
              value={add.email}
              onChange={(e) => setAdd((p) => ({ ...p, email: e.target.value }))}
              maxLength={120}
              autoComplete="email"
            />
          </label>
          <label className="text-sm text-muted">
            Mobile phone
            <input
              className={`${inputClass} mt-1`}
              type="tel"
              required
              value={add.phone}
              onChange={(e) => setAdd((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(609) 555-0100"
              autoComplete="tel"
            />
          </label>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-muted">
          <input
            className="mt-1 size-4 shrink-0 accent-primary"
            type="checkbox"
            checked={add.consent}
            onChange={(e) => setAdd((p) => ({ ...p, consent: e.target.checked }))}
            required
          />
          <span>
            Guest agreed to email or text about specials and events, same as
            the site form.
          </span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn btn-fill mt-5 disabled:opacity-60"
        >
          <Plus className="size-4" />
          {busy ? "Saving…" : "Add guest"}
        </button>
      </form>

      <input
        className={`${inputClass} mt-6 max-w-md`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, email, or phone"
        type="search"
      />
      {note ? <p className="mt-3 text-sm text-primary">{note}</p> : null}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Collection is empty. New signups from the site appear here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No matches.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border border-line">
          {filtered.map((row) => {
            const isEdit = editing === row.id;
            return (
              <li key={row.id} className="bg-surface p-4">
                {isEdit ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      className={inputClass}
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Name"
                      maxLength={80}
                    />
                    <input
                      className={inputClass}
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="Email"
                    />
                    <input
                      className={inputClass}
                      type="tel"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="Phone"
                    />
                    <div className="flex flex-wrap gap-2 md:col-span-3">
                      <button
                        type="button"
                        className="btn btn-fill"
                        disabled={busy}
                        onClick={() => void onSaveEdit(row.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-line"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl">
                        {row.name || "No name"}
                      </p>
                      <p className="mt-1">
                        <a href={`mailto:${row.email}`}>{row.email}</a>
                      </p>
                      <p>
                        {row.phone ? (
                          <a href={`tel:+1${row.phone}`}>
                            {formatPhoneDisplay(row.phone)}
                          </a>
                        ) : (
                          "No phone"
                        )}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Joined {joinedOn(row.created_at)}
                        {row.consented_at
                          ? ` · Consent ${joinedOn(row.consented_at)}`
                          : " · No written consent"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-line"
                        onClick={() => {
                          setEditing(row.id);
                          setDraft({
                            name: row.name,
                            email: row.email,
                            phone: formatPhoneDisplay(row.phone),
                          });
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-line"
                        disabled={busy}
                        onClick={() => void onRemove(row)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
