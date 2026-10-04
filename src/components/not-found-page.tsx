import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { restaurant } from "@/lib/restaurant";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <title>{`Page not found · ${restaurant.name}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <SiteHeader />
      <main id="main" className="wrap py-16">
        <p className="eyebrow">404</p>
        <h1 className="display mt-2">Page not found</h1>
        <p className="mt-4 max-w-xl text-muted">
          That address is not on this site. The menu, hours, and reservations are
          on the home page.
        </p>
        <p className="mt-3 text-muted">
          <a className="tap" href={`tel:${restaurant.phoneTel}`}>
            {restaurant.phone}
          </a>
          <span className="mx-2">·</span>
          {restaurant.address}
        </p>
        <Link to="/" className="btn btn-fill mt-8">
          Back to La Mesa
        </Link>
      </main>
    </div>
  );
}
