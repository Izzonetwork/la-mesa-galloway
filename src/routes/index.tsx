import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookForms } from "@/components/book-forms";
import { EventFlyerSection } from "@/components/event-flyer";
import { MobileDock } from "@/components/mobile-dock";
import { OrderLinks } from "@/components/order-links";
import { PhotoGallery } from "@/components/photo-gallery";
import { SiteHeader } from "@/components/site-header";
import { SiteImg, useCopy, useFlyer, useHours, useMenu } from "@/components/site-photos";
import { scrollToId, handleHashClick, handleHomeClick } from "@/lib/scroll-to";
import {
  openStatus,
  restaurant,
  specials,
  todayHours,
  type MenuItem,
} from "@/lib/restaurant";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: restaurant.seoTitle },
      {
        name: "description",
        content: restaurant.seoDescription,
      },
    ],
    links: [
      { rel: "canonical", href: restaurant.website },
      { rel: "preload", href: "/photos/bar-room.jpg", as: "image" },
    ],
  }),
});

function MenuColumn({
  title,
  items,
  invert = false,
}: {
  title: string;
  items: MenuItem[];
  invert?: boolean;
}) {
  return (
    <article>
      <h3
        className={`mb-4 font-display text-2xl capitalize ${invert ? "text-accent" : "text-primary"}`}
      >
        {title}
      </h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="py-2 text-sm">
            <span className="rule">
              <span>{item.name}</span>
              <span className={`rule-fill ${invert ? "border-bg/25" : ""}`} />
              <em
                className={`shrink-0 not-italic ${invert ? "text-accent" : "text-primary"}`}
              >
                {item.price}
              </em>
            </span>
            {item.note ? (
              <span
                className={`mt-0.5 block text-xs ${invert ? "text-bg/55" : "text-muted"}`}
              >
                {item.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Home() {
  const copy = useCopy();
  const hoursList = useHours();
  const hours = todayHours(hoursList);
  const status = openStatus(hoursList);
  const featured = specials[2];
  const restSpecials = specials.slice(0, 2);
  const flyer = useFlyer();
  const menu = useMenu();

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const timer = window.setTimeout(() => scrollToId(id), 50);
    return () => window.clearTimeout(timer);
  }, []);
  const faqs = [
    {
      q: "Where is La Mesa in Galloway?",
      a: `${restaurant.address}. Call ${restaurant.phone}.`,
    },
    {
      q: "How do I reserve a table?",
      a: "Reserve on OpenTable. Call the restaurant for catering or a larger party.",
    },
    {
      q: "What time does La Mesa open?",
      a: `${hoursList.map((row) => `${row.day} ${row.label}`).join(". ")}.`,
    },
    {
      q: "Do you deliver?",
      a: "Yes. Order on DoorDash, Uber Eats, or Grubhub.",
    },
    {
      q: "When is live music?",
      a: flyer?.whenLabel
        ? `${flyer.title}. ${flyer.whenLabel}.`
        : "See the special event on this page.",
    },
  ];

  const pageUrl = restaurant.website;
  const restaurantId = `${pageUrl}#restaurant`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        url: pageUrl,
        name: restaurant.name,
        description: restaurant.seoDescription,
        publisher: { "@id": restaurantId },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: restaurant.seoTitle,
        description: restaurant.seoDescription,
        isPartOf: { "@id": `${pageUrl}#website` },
        about: { "@id": restaurantId },
        primaryImageOfPage: `${pageUrl}photos/bar-room.jpg`,
        inLanguage: "en-US",
      },
      {
        "@type": ["Restaurant", "BarOrPub"],
        "@id": restaurantId,
        name: restaurant.name,
        image: [
          `${pageUrl}photos/bar-room.jpg`,
          `${pageUrl}photos/the-room.jpg`,
          `${pageUrl}photos/birria.jpg`,
          `${pageUrl}logo.png`,
        ],
        telephone: restaurant.phoneTel,
        servesCuisine: ["Mexican", "Tacos", "Tequila"],
        priceRange: restaurant.priceRange,
        currenciesAccepted: "USD",
        foundingDate: String(restaurant.established),
        alternateName: ["La Mesa Galloway", "La Mesa Tequila and Taco Bar"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "325 E Jimmie Leeds Rd",
          addressLocality: "Galloway",
          addressRegion: "NJ",
          postalCode: "08205",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: restaurant.geo.latitude,
          longitude: restaurant.geo.longitude,
        },
        url: pageUrl,
        hasMap: restaurant.mapsUrl,
        menu: `${pageUrl}#menu`,
        hasMenu: {
          "@type": "Menu",
          name: "Food and drinks",
          url: `${pageUrl}#menu`,
        },
        sameAs: [restaurant.instagram, restaurant.reserveUrl],
        areaServed: [
          { "@type": "City", name: "Galloway" },
          { "@type": "City", name: "Egg Harbor Township" },
          { "@type": "City", name: "Absecon" },
          { "@type": "City", name: "Pomona" },
          { "@type": "AdministrativeArea", name: "Atlantic County" },
        ],
        acceptsReservations: true,
        openingHoursSpecification: hoursList.map((row) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${row.day}`,
          opens: row.open,
          closes: row.close,
        })),
        potentialAction: [
          {
            "@type": "ReserveAction",
            target: restaurant.reserveUrl,
            name: "Reserve a table",
          },
          ...restaurant.order.map((service) => ({
            "@type": "OrderAction",
            target: service.href,
            name: `Order on ${service.name}`,
          })),
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a href="#main" className="skip">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">

      <section id="top" className="snap hero-cinema">
        <SiteImg
          slot="hero"
          className="photo hero-cinema-img"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          width={1800}
          height={771}
          sizes="100vw"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="stamp text-accent">{copy.heroKicker}</p>
          <SiteImg
            slot="logo"
            loading="eager"
            width={480}
            height={359}
            sizes="(min-width: 768px) 280px, 180px"
            className="hero-logo"
          />
          <h1 className="display mt-3 text-bg md:mt-6">{copy.heroHeadline}</h1>
          <p className="hero-lede mt-4 max-w-xl text-pretty text-bg/85">{copy.heroBody}</p>
          <div className="hero-ctas mt-5 w-full max-w-lg sm:mt-8 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <a
              href={restaurant.reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sage btn-pill"
            >
              Reserve a Table
            </a>
            <a
              href="#menu"
              className="btn btn-ghost btn-pill"
              onClick={(event) => handleHashClick(event, "#menu")}
            >
              See the menu
            </a>
            <a
              href="#order"
              className="btn btn-ghost btn-pill hidden sm:inline-flex"
              onClick={(event) => handleHashClick(event, "#order")}
            >
              Order online
            </a>
          </div>
        </div>
      </section>

      <section className="snap border-y border-line bg-surface px-5 py-4">
        <div className="dateline mx-auto max-w-6xl">
          <p>
            Open today
            <span>{hours.label}</span>
          </p>
          <p>
            Happy hour
            <span>{copy.happyHour}</span>
          </p>
          <p>
            <a
              href="#events"
              className="text-primary"
              onClick={(event) => handleHashClick(event, "#events")}
            >
              Special Event
            </a>
            <span>{flyer?.title ?? "See what’s on"}</span>
          </p>
          <p>
            <a href={`tel:${restaurant.phoneTel}`}>Call</a>
            <span>{restaurant.phone}</span>
          </p>
        </div>
      </section>

      <EventFlyerSection />

      <section className="snap band wrap grid gap-8 md:grid-cols-2 md:items-stretch">
        <div>
          <p className="eyebrow">Est. {restaurant.established}</p>
          <h2 className="display mt-2">{copy.aboutHeadline}</h2>
          {copy.about.map((p, index) => (
            <p
              key={p.slice(0, 24)}
              className={
                index === 0 ? "pull mt-6" : "mt-4 text-muted"
              }
            >
              {p}
            </p>
          ))}
          <ul className="mt-10 grid grid-cols-3 gap-3 border-t border-line pt-6">
            <li>
              <strong className="block font-display text-3xl sm:text-4xl">4.3</strong>
              <span className="stamp mt-1 block text-muted">Google</span>
            </li>
            <li>
              <strong className="block font-display text-3xl sm:text-4xl">
                {restaurant.established}
              </strong>
              <span className="stamp mt-1 block text-muted">Family owned</span>
            </li>
            <li>
              <strong className="block font-display text-3xl sm:text-4xl">
                {restaurant.banquetCapacity}
              </strong>
              <span className="stamp mt-1 block text-muted">Banquet seats</span>
            </li>
          </ul>
        </div>
        <div className="photo-zoom h-full">
          <SiteImg
            slot="about"
            className="photo about-photo"
          />
        </div>
      </section>

      <section className="snap band bg-surface">
        <div className="wrap">
          <p className="eyebrow">Specials</p>
          <h2 className="display mt-2">This week</h2>

          <article className="mt-10 grid gap-6 md:grid-cols-12 md:items-stretch">
            <div className="photo-zoom md:col-span-7">
              <SiteImg
                slot={featured.slot}
                className="photo feature-photo"
                sizes="(min-width: 768px) 58vw, 100vw"
              />
            </div>
            <div className="flex flex-col justify-center border-t-2 border-primary pt-5 md:col-span-5 md:border-t-0 md:border-l-2 md:pl-8 md:pt-0">
              <p className="eyebrow">House favorite</p>
              <h3 className="display-sm mt-2">
                {copy.specials[2]?.title ?? featured.title}
              </h3>
              <p className="mt-3 max-w-md text-muted">
                {copy.specials[2]?.detail ?? featured.detail}
              </p>
            </div>
          </article>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {restSpecials.map((s, index) => {
              return (
                <article
                  key={s.id}
                  className="grid grid-cols-5 gap-4 border-t border-line pt-5"
                >
                  <div className="photo-zoom col-span-2">
                    <SiteImg
                      slot={s.slot}
                      className="photo special-thumb"
                      sizes="(min-width: 768px) 20vw, 40vw"
                    />
                  </div>
                  <div className="col-span-3 flex flex-col justify-center">
                    <h3 className="font-display text-2xl">
                      {copy.specials[index]?.title ?? s.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {copy.specials[index]?.detail ?? s.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="menu" className="snap band wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Kitchen</p>
            <h2 className="display mt-2">Tacos & more</h2>
            <p className="mt-3 text-sm text-muted">{menu.tacoNote}</p>
          </div>
          {menu.foodPdf ? (
            <a
              href={menu.foodPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-line"
            >
              Full food menu
            </a>
          ) : null}
        </div>
        <div className="collage mt-8">
          <div className="photo-zoom h-full">
            <SiteImg
              slot="menu-1"
              className="photo size-full object-cover"
            />
          </div>
          <div className="photo-zoom h-full">
            <SiteImg
              slot="menu-2"
              className="photo size-full object-cover"
            />
          </div>
          <div className="photo-zoom h-full">
            <SiteImg
              slot="menu-3"
              className="photo size-full object-cover"
            />
          </div>
        </div>
        <div className="sheet mt-12 grid gap-12 md:grid-cols-2 xl:grid-cols-4">
          {menu.food.map((cat) => (
            <MenuColumn key={cat.id} title={cat.title} items={cat.items} />
          ))}
        </div>
      </section>

      <section id="drinks" className="snap band bg-fg text-bg">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Bar</p>
              <h2 className="display mt-2">Margaritas & more</h2>
            </div>
            {menu.drinksPdf ? (
              <a
                href={menu.drinksPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-line"
              >
                Full drink menu
              </a>
            ) : null}
          </div>
          <div className="mt-8 grid gap-2 md:grid-cols-3">
            <div className="photo-zoom md:col-span-2">
              <SiteImg slot="drinks-1" className="photo cinema" />
            </div>
            <div className="photo-zoom">
              <SiteImg slot="drinks-2" className="photo cinema object-lower" />
            </div>
          </div>
          <div className="mt-12 grid gap-12 md:grid-cols-2 xl:grid-cols-4">
            {menu.drinks.map((cat) => (
              <MenuColumn key={cat.id} title={cat.title} items={cat.items} invert />
            ))}
          </div>
        </div>
      </section>

      <section id="order" className="snap band">
        <aside className="wrap overflow-hidden bg-fg text-bg md:grid md:grid-cols-2 md:items-stretch">
          <div className="photo-zoom">
            <SiteImg
              slot="order"
              className="photo h-48 w-full object-cover md:h-full"
            />
          </div>
          <div className="flex flex-col justify-center p-5 md:p-12">
            <p className="eyebrow">Takeout & delivery</p>
            <h2 className="display mt-2">{copy.orderHeadline}</h2>
            <p className="mt-4 max-w-md text-bg/70">{copy.orderBody}</p>
            <ul className="mt-5 space-y-1 text-sm text-bg/70">
              {restaurant.order.map((service) => (
                <li key={service.name}>
                  {service.name} · {service.detail}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <OrderLinks />
            </div>
          </div>
        </aside>
      </section>

      <section
        id="visit"
        className="snap band wrap grid gap-8 md:grid-cols-2"
      >
        <div>
          <p className="eyebrow">Business info</p>
          <h2 className="display mt-2">{copy.visitHeadline}</h2>
          <address className="mt-4 whitespace-pre-line text-muted not-italic">
            {restaurant.address}
          </address>
          <p className="mt-2">
            <a href={`tel:${restaurant.phoneTel}`}>{restaurant.phone}</a>
          </p>
          <p className="mt-1">
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </p>
          <p className="mt-1">
            <a
              href={restaurant.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              @lamesagalloway
            </a>
          </p>
          <a
            href={restaurant.reserveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-fill mt-8 w-full sm:w-auto"
          >
            Reserve a table
          </a>
          <p className="mt-6 hidden text-sm text-muted md:block">Or order for delivery:</p>
          <div className="mt-3 hidden md:block">
            <OrderLinks variant="ghost" />
          </div>
        </div>
        <div>
          <h3 className="font-display text-2xl">Hours</h3>
          <ul className="mt-3">
            {hoursList.map((h) => (
              <li
                key={h.day}
                className={`rule py-2.5 ${h.day === hours.day ? "hours-now" : ""}`}
                aria-current={h.day === hours.day ? "date" : undefined}
              >
                <span>{h.day}</span>
                <span className="rule-fill" />
                <em className="not-italic">{h.label}</em>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">{copy.happyHour}</p>
          <div className="photo-zoom mt-6">
            <SiteImg
              slot="visit"
              className="photo aspect-video w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      <section id="banquets" className="snap band">
        <div className="wrap">
          <aside className="overlap overflow-hidden bg-fg">
            <div className="photo-zoom">
              <SiteImg slot="banquets" className="photo overlap-photo" />
            </div>
            <div className="overlap-card">
              <p className="eyebrow">Host at La Mesa</p>
              <h2 className="display mt-2">{copy.banquetHeadline}</h2>
              <p className="mt-4 max-w-md text-muted">{copy.banquetBody}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={restaurant.reserveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-fill w-full sm:w-auto"
                >
                  Reserve on OpenTable
                </a>
                <a href={`tel:${restaurant.phoneTel}`} className="btn btn-line w-full sm:w-auto">
                  Call {restaurant.phone}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <PhotoGallery />

      <section id="questions" className="snap band wrap">
        <p className="eyebrow">Questions</p>
        <h2 className="display mt-2">Before you come in</h2>
        <div className="faq mt-8 max-w-3xl">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="snap band wrap">
        <p className="eyebrow">Contact</p>
        <h2 className="display mt-2">Reserve a table.</h2>
        <p className="mb-10 mt-3 max-w-xl text-sm text-muted">
          Every reservation is made through OpenTable — the same listing as
          the restaurant's website. Join the list for specials.
        </p>
        <BookForms />
      </section>
      </main>

      <footer className="bg-fg py-12 pb-28 text-sm text-bg/70 md:pb-12">
        <div className="wrap grid gap-10 md:grid-cols-3">
          <div className="flex items-start gap-3 text-bg">
            <a
              href="/"
              aria-label="La Mesa home"
              onClick={(event) => handleHomeClick(event)}
            >
              <SiteImg slot="logo" className="h-12 w-auto object-contain" />
            </a>
            <span>
              <address className="not-italic">
                {restaurant.name}
                <br />
                {restaurant.address}
                <br />
                <a href={`tel:${restaurant.phoneTel}`}>{restaurant.phone}</a>
              </address>
            </span>
          </div>
          <div>
            <p className="stamp text-accent">Today</p>
            <p className="mt-2 text-bg">{status.label}</p>
            <p className="mt-1">{copy.happyHour}</p>
            <a
              href={restaurant.reserveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-fill mt-5"
            >
              Reserve
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Directions
            </a>
            <a
              href="#photos"
              onClick={(event) => handleHashClick(event, "#photos")}
            >
              Photos
            </a>
            <a
              href={restaurant.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <Link to="/terms">Guest list terms</Link>
            <Link to="/admin" className="text-accent">
              Staff
            </Link>
          </div>
        </div>
      </footer>
      <MobileDock />
    </div>
  );
}
