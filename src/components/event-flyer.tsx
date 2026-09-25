import { CalendarDays } from "lucide-react";
import { restaurant } from "@/lib/restaurant";
import { handleHashClick } from "@/lib/scroll-to";
import { useFlyer } from "@/components/site-photos";
import { SiteImg } from "@/components/site-photos";
import type { Flyer } from "@/lib/flyer";

export function EventFlyerSection() {
  const flyer = useFlyer();
  if (!flyer) return null;
  return <EventFlyer flyer={flyer} />;
}

export function EventBanner() {
  const flyer = useFlyer();
  if (!flyer) return null;
  return (
    <a
      href="#events"
      className="mt-8 hidden w-full max-w-lg items-stretch border border-line bg-surface text-left md:flex"
      onClick={(event) => handleHashClick(event, "#events")}
    >
      <span className="spine stamp flex w-8 shrink-0 items-center justify-center bg-primary text-bg">
        Event
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-3 px-4 py-3">
        <span className="font-display text-xl leading-none">{flyer.title}</span>
        {flyer.whenLabel ? (
          <span className="truncate text-sm text-muted">{flyer.whenLabel}</span>
        ) : null}
      </span>
    </a>
  );
}

export function EventFlyer({
  flyer,
  preview = false,
}: {
  flyer: Flyer;
  preview?: boolean;
}) {
  if (!preview && !flyer.published) return null;
  const href = flyer.ctaHref.trim() || restaurant.reserveUrl;
  const external = href.startsWith("http");

  return (
    <section id={preview ? undefined : "events"} className={preview ? "" : "snap band"}>
      <div className={preview ? "" : "wrap"}>
        {preview ? null : (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <p className="display-sm">Special Event</p>
            {flyer.whenLabel ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="size-4 shrink-0 text-accent" />
                {flyer.whenLabel}
              </p>
            ) : null}
          </div>
        )}

        <article className="overflow-hidden bg-fg text-bg md:grid md:grid-cols-12 md:items-stretch">
          <div className="relative bg-fg md:col-span-5">
            <img
              src={flyer.imageSrc}
              alt={flyer.title}
              className="photo poster-photo"
              loading={preview ? "eager" : "lazy"}
              decoding="async"
            />
            <span className="event-badge stamp">Special Event</span>
          </div>

          <div className="flex flex-col justify-center p-5 md:col-span-7 md:p-12">
            <SiteImg
              slot="logo"
              className="hidden h-14 w-auto self-start object-contain md:block"
            />
            {preview && !flyer.published ? (
              <p className="eyebrow mt-4">Hidden on the site</p>
            ) : null}
            <p className="eyebrow mt-0 md:mt-6">{flyer.kicker}</p>
            <h2 className="display mt-2">{flyer.title}</h2>
            {flyer.whenLabel ? (
              <p className="mt-3 flex items-center gap-2 text-accent">
                <CalendarDays className="size-4 shrink-0" />
                {flyer.whenLabel}
              </p>
            ) : null}
            <p className="mt-4 max-w-lg text-bg/70">{flyer.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="btn btn-sage btn-pill w-full sm:w-auto"
              >
                {flyer.ctaLabel}
              </a>
              <a
                href={`tel:${restaurant.phoneTel}`}
                className="btn btn-ghost btn-pill hidden sm:inline-flex"
              >
                Call {restaurant.phone}
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
