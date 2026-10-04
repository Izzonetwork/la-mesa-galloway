import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, ExternalLink, Phone } from "lucide-react";
import { createSubscriber } from "@/lib/bookings";
import { restaurant, todayHours } from "@/lib/restaurant";
import { SiteImg, useHours } from "@/components/site-photos";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm text-muted">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-fg outline-none focus:border-primary";

export function BookForms() {
  const subscribeFn = useServerFn(createSubscriber);
  const [subMsg, setSubMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const hours = todayHours(useHours());

  async function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setSubMsg("Saving…");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await subscribeFn({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          consent: fd.get("consent") === "on",
        },
      });
      setSubMsg(res.message);
      form.reset();
    } catch (err) {
      setSubMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <aside className="overflow-hidden bg-fg text-bg md:grid md:grid-cols-2 md:items-stretch">
        <SiteImg
          slot="contact"
          className="photo h-40 w-full object-cover md:h-full"
        />
        <div className="flex flex-col justify-center p-5 md:p-8">
          <p className="eyebrow">OpenTable</p>
          <h3 className="mt-2 font-display text-3xl">
            Every table books here
          </h3>
          <p className="mt-3 text-sm text-bg/70">
            All reservations go through OpenTable — the same listing as the
            restaurant's website. No tables are held on this page.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-bg/70">
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-accent" />
              Today · {hours.label}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-accent" />
              <a className="tap" href={`tel:${restaurant.phoneTel}`}>
                {restaurant.phone}
              </a>
            </li>
          </ul>
          <div className="mt-6">
            <a
              href={restaurant.reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-fill w-full sm:w-auto"
            >
              Reserve on OpenTable
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </aside>

      <form
        onSubmit={onSubscribe}
        className="flex max-w-xl overflow-hidden border border-line bg-surface"
      >
        <span className="spine stamp hidden w-8 shrink-0 items-center justify-center bg-primary text-bg sm:flex">
          List
        </span>
        <div className="min-w-0 flex-1 p-5 sm:p-6">
        <h3 className="font-display text-2xl">Subscribe</h3>
        <p className="mb-4 mt-1 text-sm text-muted">
          Specials and live music nights by email or text.
        </p>
        <Field label="Name">
          <input
            className={inputClass}
            id="subscribe-name"
            name="name"
            autoComplete="name"
            maxLength={80}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            id="subscribe-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Mobile phone">
          <input
            className={inputClass}
            id="subscribe-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(609) 555-0100"
            required
          />
        </Field>
        <label className="mb-5 flex items-start gap-3 text-sm text-muted">
          <input
            className="mt-1 size-4 shrink-0 accent-primary"
            type="checkbox"
            name="consent"
            required
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="text-primary underline-offset-2 hover:underline">
              guest list terms
            </Link>{" "}
            and I want La Mesa to email or text this number about specials and
            events. Msg & data rates may apply. Consent is not required to dine
            or reserve.
          </span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn btn-fill disabled:opacity-60"
        >
          {busy ? "Saving…" : "Join list"}
        </button>
        <p className="mt-3 min-h-6 text-sm text-primary">{subMsg}</p>
        </div>
      </form>
    </div>
  );
}
