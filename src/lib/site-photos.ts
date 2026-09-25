import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { photos as galleryDefaults } from "@/lib/restaurant";
import { pinOk } from "@/lib/staff-pin";

export type SitePhoto = {
  src: string;
  alt: string;
  caption: string;
};

export type PhotoSlot = {
  id: string;
  label: string;
  group: "Brand" | "Pages" | "Kitchen" | "Specials" | "Gallery";
  defaultSrc: string;
  alt: string;
  caption: string;
};

export const photoSlots: PhotoSlot[] = [
  {
    id: "logo",
    label: "Logo",
    group: "Brand",
    defaultSrc: "/logo.png",
    alt: "La Mesa Tequila & Taco Bar",
    caption: "Logo",
  },
  {
    id: "hero",
    label: "Hero background",
    group: "Brand",
    defaultSrc: "/photos/bar-room.jpg",
    alt: "The bar and dining room at La Mesa",
    caption: "",
  },
  {
    id: "about",
    label: "About photo",
    group: "Pages",
    defaultSrc: "/photos/the-room.jpg",
    alt: "Dining room at La Mesa with the Familia mural",
    caption: "",
  },
  {
    id: "visit",
    label: "Visit photo",
    group: "Pages",
    defaultSrc: "/photos/the-room.jpg",
    alt: "Dining room at La Mesa with mural, booths, and the bar",
    caption: "",
  },
  {
    id: "banquets",
    label: "Banquets photo",
    group: "Pages",
    defaultSrc: "/photos/bar-room.jpg",
    alt: "Dining room and bar at La Mesa for private events",
    caption: "",
  },
  {
    id: "order",
    label: "Order photo",
    group: "Pages",
    defaultSrc: "/photos/birria.jpg",
    alt: "Birria tacos from La Mesa",
    caption: "",
  },
  {
    id: "contact",
    label: "OpenTable photo",
    group: "Pages",
    defaultSrc: "/photos/the-room.jpg",
    alt: "Dining room at La Mesa",
    caption: "",
  },
  {
    id: "menu-1",
    label: "Menu photo 1",
    group: "Kitchen",
    defaultSrc: "/photos/birria.jpg",
    alt: "Birria tacos with consommé",
    caption: "",
  },
  {
    id: "menu-2",
    label: "Menu photo 2",
    group: "Kitchen",
    defaultSrc: "/photos/filet-tacos.jpg",
    alt: "Filet mignon tacos",
    caption: "",
  },
  {
    id: "menu-3",
    label: "Menu photo 3",
    group: "Kitchen",
    defaultSrc: "/photos/elote.jpg",
    alt: "Street corn and guacamole",
    caption: "",
  },
  {
    id: "drinks-1",
    label: "Drinks photo 1",
    group: "Kitchen",
    defaultSrc: "/photos/margaritas.jpg",
    alt: "House margaritas on the bar",
    caption: "",
  },
  {
    id: "drinks-2",
    label: "Drinks photo 2",
    group: "Kitchen",
    defaultSrc: "/photos/tequila-wall.jpg",
    alt: "Tequila bottle wall",
    caption: "",
  },
  {
    id: "special-happy-hour",
    label: "Happy Hour card",
    group: "Specials",
    defaultSrc: "/photos/margaritas.jpg",
    alt: "Happy Hour",
    caption: "",
  },
  {
    id: "special-tequila-sundays",
    label: "Tequila Sundays card",
    group: "Specials",
    defaultSrc: "/photos/tequila-wall.jpg",
    alt: "Tequila Sundays",
    caption: "",
  },
  {
    id: "special-smoke-show",
    label: "Smoke Show card",
    group: "Specials",
    defaultSrc: "/photos/smoke-show.jpg",
    alt: "Smoke Show",
    caption: "",
  },
  ...galleryDefaults.map((photo, index) => ({
    id: `gallery-${index + 1}`,
    label: photo.caption,
    group: "Gallery" as const,
    defaultSrc: photo.src,
    alt: photo.alt,
    caption: photo.caption,
  })),
];

export const photoSlotIds = photoSlots.map((slot) => slot.id);

export const stockPhotos = [
  { src: "/logo.png", label: "Logo" },
  { src: "/photos/bar-room.jpg", label: "The bar" },
  { src: "/photos/the-room.jpg", label: "Dining room" },
  { src: "/photos/familia.jpg", label: "Familia mural" },
  { src: "/photos/tequila-wall.jpg", label: "Tequila wall" },
  { src: "/photos/margaritas.jpg", label: "Margaritas" },
  { src: "/photos/smoke-show.jpg", label: "Smoke Show" },
  { src: "/photos/birria.jpg", label: "Birria tacos" },
  { src: "/photos/filet-tacos.jpg", label: "Filet tacos" },
  { src: "/photos/elote.jpg", label: "Elote" },
  { src: "/photos/hero.jpg", label: "Hero table" },
  { src: "/photos/party.jpg", label: "Private dining" },
] as const;

export function defaultPhotoMap(): Record<string, SitePhoto> {
  return Object.fromEntries(
    photoSlots.map((slot) => [
      slot.id,
      { src: slot.defaultSrc, alt: slot.alt, caption: slot.caption },
    ]),
  );
}

type PhotoRow = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

function mergePhotos(rows: PhotoRow[]): Record<string, SitePhoto> {
  const map = defaultPhotoMap();
  for (const row of rows) {
    if (!map[row.id]) continue;
    map[row.id] = {
      src: row.src,
      alt: row.alt || map[row.id].alt,
      caption: row.caption,
    };
  }
  return map;
}

async function readPhotos(): Promise<Record<string, SitePhoto>> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<PhotoRow>`
    select id, src, alt, caption from site_photos
  `;
  return mergePhotos(rows);
}

function allowedSrc(value: string) {
  return (
    value.startsWith("/photos/") ||
    value.startsWith("/uploads/") ||
    value.startsWith("/logo") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  );
}

const srcField = z
  .string()
  .trim()
  .min(1)
  .max(2_500_000)
  .refine(allowedSrc, "Use a restaurant photo, a https link, or an uploaded image");

export async function materializeUpload(id: string, src: string): Promise<string> {
  if (!src.startsWith("data:image/")) return src;
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(src);
  if (!match) return src;
  const mime = match[1].toLowerCase();
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
      ? "webp"
      : "jpg";
  const safeId = id.replace(/[^a-z0-9-]/gi, "") || "photo";
  try {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "public", "uploads");
    mkdirSync(dir, { recursive: true });
    const file = `${safeId}.${ext}`;
    writeFileSync(join(dir, file), Buffer.from(match[2], "base64"));
    return `/uploads/${file}?v=${Date.now()}`;
  } catch (err) {
    console.error("[cms] could not write upload, keeping data URL", err);
    return src;
  }
}

export const getPublicPhotos = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      return await readPhotos();
    } catch (err) {
      console.error("[cms] photos", err);
      return defaultPhotoMap();
    }
  },
);

export const getStaffPhotos = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ pin: z.string().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    return readPhotos();
  });

const saveSchema = z.object({
  pin: z.string().min(1).max(40),
  id: z
    .string()
    .refine((id) => photoSlotIds.includes(id), "Unknown photo slot"),
  src: srcField,
  alt: z.string().trim().max(160),
  caption: z.string().trim().max(80),
});

export const savePhoto = createServerFn({ method: "POST" })
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const src = await materializeUpload(data.id, data.src);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into site_photos (id, src, alt, caption, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (id) do update set
         src = excluded.src,
         alt = excluded.alt,
         caption = excluded.caption,
         updated_at = now()`,
      [data.id, src, data.alt, data.caption],
    );
    return { ok: true as const, photos: await readPhotos() };
  });
