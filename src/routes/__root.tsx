import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SitePhotosProvider } from "@/components/site-photos";
import { restaurant } from "@/lib/restaurant";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: restaurant.seoTitle },
      {
        name: "description",
        content: restaurant.seoDescription,
      },
      { name: "theme-color", content: "#1c110c" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1",
      },
      { name: "geo.region", content: "US-NJ" },
      { name: "geo.placename", content: "Galloway" },
      {
        name: "geo.position",
        content: `${restaurant.geo.latitude};${restaurant.geo.longitude}`,
      },
      {
        name: "ICBM",
        content: `${restaurant.geo.latitude}, ${restaurant.geo.longitude}`,
      },
    ],
    links: [
      { rel: "canonical", href: restaurant.website },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <SitePhotosProvider>
            <Outlet />
          </SitePhotosProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
