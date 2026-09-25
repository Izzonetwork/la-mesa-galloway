import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { restaurant } from "@/lib/restaurant";
import { termsIntro, termsSections, termsTitle } from "@/lib/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `${termsTitle} · ${restaurant.name}` },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="eyebrow">Legal</p>
        <h1 className="display mt-2">{termsTitle}</h1>
        <p className="mt-4 text-muted">{termsIntro}</p>
        {termsSections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-display text-2xl text-primary">
              {section.heading}
            </h2>
            <p className="mt-3 text-muted">{section.body}</p>
          </section>
        ))}
        <p className="mt-12 text-sm text-muted">
          Questions:{" "}
          <a href={`tel:${restaurant.phoneTel}`}>{restaurant.phone}</a>
          {" · "}
          {restaurant.address}
        </p>
        <p className="mt-8 text-sm">
          <Link to="/" className="text-primary">
            Back to the site
          </Link>
        </p>
      </main>
    </div>
  );
}
