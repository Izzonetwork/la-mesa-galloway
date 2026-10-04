/**
 * Send the bare domain to www so search engines see one host.
 * Preview hosts, localhost, and www are left alone. vercel.json does the
 * same redirect at the edge; this covers the app server if the edge rule
 * is not applied.
 */
interface CanonicalEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

function hostnameOf(event: CanonicalEvent): string {
  const raw =
    event.req.headers.get("x-forwarded-host") ??
    event.req.headers.get("host") ??
    event.url.host;
  return raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

export default function canonicalHost(
  event: CanonicalEvent,
  next: () => unknown,
): unknown {
  if (hostnameOf(event) !== "lamesagalloway.com") return next();
  const dest = `https://www.lamesagalloway.com${event.url.pathname}${event.url.search}`;
  return new Response(null, {
    status: 301,
    headers: {
      location: dest,
      "cache-control": "public, max-age=86400",
    },
  });
}
