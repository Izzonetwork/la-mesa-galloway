import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { pinOk } from "@/lib/staff-pin";
import { materializeUpload } from "@/lib/site-photos";

export const flyerImageChoices = [
  { src: "/photos/live-music.jpg", label: "Live music flyer" },
  { src: "/photos/bar-room.jpg", label: "The bar" },
  { src: "/photos/tequila-wall.jpg", label: "Tequila wall" },
  { src: "/photos/margaritas.jpg", label: "Margaritas" },
  { src: "/photos/smoke-show.jpg", label: "Smoke Show" },
  { src: "/photos/birria.jpg", label: "Birria tacos" },
  { src: "/photos/the-room.jpg", label: "Dining room" },
  { src: "/photos/familia.jpg", label: "Familia mural" },
  { src: "/photos/elote.jpg", label: "Elote" },
  { src: "/photos/filet-tacos.jpg", label: "Filet tacos" },
  { src: "/photos/hero.jpg", label: "Hero table" },
] as const;

export type Flyer = {
  kicker: string;
  title: string;
  whenLabel: string;
  body: string;
  imageSrc: string;
  ctaLabel: string;
  ctaHref: string;
  published: boolean;
};

export const emptyFlyer: Flyer = {
  kicker: "This month",
  title: "Live Music",
  whenLabel: "Thu 5–8pm · Fri & Sat 6–9pm",
  body: "Melissa Marshall, Billy November, Trish Cleveland, Jade Alexis, Beth Tinnon, and Ellieanna. Live Thursday, Friday, and Saturday.",
  imageSrc: "/photos/live-music.jpg",
  ctaLabel: "Reserve a Table",
  ctaHref: "",
  published: true,
};

type FlyerRow = {
  kicker: string;
  title: string;
  when_label: string;
  body: string;
  image_src: string;
  cta_label: string;
  cta_href: string;
  published: boolean;
};

function toFlyer(row: FlyerRow): Flyer {
  return {
    kicker: row.kicker,
    title: row.title,
    whenLabel: row.when_label,
    body: row.body,
    imageSrc: row.image_src,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    published: row.published,
  };
}

async function readFlyer(): Promise<Flyer> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<FlyerRow>`
    select kicker, title, when_label, body, image_src, cta_label, cta_href, published
    from event_flyer
    where id = 1
    limit 1
  `;
  return rows[0] ? toFlyer(rows[0]) : emptyFlyer;
}

export const getPublicFlyer = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const flyer = await readFlyer();
      return flyer.published ? flyer : null;
    } catch (err) {
      console.error("[cms] flyer", err);
      return emptyFlyer;
    }
  },
);

export const getStaffFlyer = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ pin: z.string().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    return readFlyer();
  });

const saveSchema = z.object({
  pin: z.string().min(1).max(40),
  kicker: z.string().trim().max(40),
  title: z.string().trim().min(1).max(80),
  whenLabel: z.string().trim().max(80),
  body: z.string().trim().max(400),
  imageSrc: z
    .string()
    .trim()
    .min(1)
    .max(2_500_000)
    .refine(
      (value) =>
        value.startsWith("/photos/") ||
        value.startsWith("/uploads/") ||
        value.startsWith("/logo") ||
        value.startsWith("https://") ||
        value.startsWith("data:image/"),
      "Use a restaurant photo, a https link, or an uploaded image",
    ),
  ctaLabel: z.string().trim().max(40),
  ctaHref: z.string().trim().max(300),
  published: z.boolean(),
});

export const saveFlyer = createServerFn({ method: "POST" })
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const imageSrc = await materializeUpload("event-flyer", data.imageSrc);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into event_flyer (
        id, kicker, title, when_label, body, image_src, cta_label, cta_href, published, updated_at
      ) values (
        1, ${data.kicker}, ${data.title}, ${data.whenLabel}, ${data.body},
        ${imageSrc}, ${data.ctaLabel}, ${data.ctaHref}, ${data.published}, now()
      )
      on conflict (id) do update set
        kicker = excluded.kicker,
        title = excluded.title,
        when_label = excluded.when_label,
        body = excluded.body,
        image_src = excluded.image_src,
        cta_label = excluded.cta_label,
        cta_href = excluded.cta_href,
        published = excluded.published,
        updated_at = now()
    `;
    return { ok: true as const, flyer: await readFlyer() };
  });
