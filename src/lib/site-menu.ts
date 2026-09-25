import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { menu as houseMenu, restaurant, type MenuItem } from "@/lib/restaurant";
import { pinOk } from "@/lib/staff-pin";

export type MenuDish = {
  id: string;
  name: string;
  price: string;
  note: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuDish[];
};

export type SiteMenu = {
  tacoNote: string;
  foodPdf: string;
  drinksPdf: string;
  food: MenuCategory[];
  drinks: MenuCategory[];
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28);
}

function prettyTitle(key: string) {
  return key.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fromRecord(record: Record<string, MenuItem[]>, prefix: string): MenuCategory[] {
  return Object.entries(record).map(([key, items]) => ({
    id: `${prefix}-${slug(key)}`,
    title: prettyTitle(key),
    items: items.map((item, index) => ({
      id: `${prefix}-${slug(key)}-${index}`,
      name: item.name,
      price: item.price,
      note: item.note ?? "",
    })),
  }));
}

export const defaultMenu: SiteMenu = {
  tacoNote: houseMenu.tacoNote,
  foodPdf: restaurant.menus.food,
  drinksPdf: restaurant.menus.drinks,
  food: fromRecord(houseMenu.food, "food"),
  drinks: fromRecord(houseMenu.drinks, "drink"),
};

function asDish(raw: unknown, fallbackId: string): MenuDish | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MenuDish>;
  const name = typeof row.name === "string" ? row.name.trim().slice(0, 80) : "";
  const price = typeof row.price === "string" ? row.price.trim().slice(0, 24) : "";
  const note = typeof row.note === "string" ? row.note.trim().slice(0, 80) : "";
  const id =
    typeof row.id === "string" && row.id.trim()
      ? row.id.trim().slice(0, 40)
      : fallbackId;
  return { id, name, price, note };
}

function asCategory(raw: unknown, fallbackId: string): MenuCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MenuCategory>;
  const title = typeof row.title === "string" ? row.title.trim().slice(0, 40) : "";
  const id =
    typeof row.id === "string" && row.id.trim()
      ? row.id.trim().slice(0, 40)
      : fallbackId;
  const items = Array.isArray(row.items)
    ? row.items
        .slice(0, 40)
        .map((item, index) => asDish(item, `${id}-${index}`))
        .filter((item): item is MenuDish => Boolean(item))
    : [];
  return { id, title, items };
}

function asList(raw: unknown, fallback: MenuCategory[]): MenuCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  const list = raw
    .slice(0, 12)
    .map((row, index) => asCategory(row, `cat-${index}`))
    .filter((row): row is MenuCategory => Boolean(row));
  return list.length ? list : fallback;
}

export function mergeMenu(raw: unknown): SiteMenu {
  const row = raw && typeof raw === "object" ? (raw as Partial<SiteMenu>) : {};
  return {
    tacoNote:
      typeof row.tacoNote === "string" && row.tacoNote.trim()
        ? row.tacoNote.trim().slice(0, 120)
        : defaultMenu.tacoNote,
    foodPdf:
      typeof row.foodPdf === "string" ? row.foodPdf.trim().slice(0, 300) : defaultMenu.foodPdf,
    drinksPdf:
      typeof row.drinksPdf === "string"
        ? row.drinksPdf.trim().slice(0, 300)
        : defaultMenu.drinksPdf,
    food: asList(row.food, defaultMenu.food),
    drinks: asList(row.drinks, defaultMenu.drinks),
  };
}

export function liveMenu(menu: SiteMenu): SiteMenu {
  const trim = (list: MenuCategory[]) =>
    list
      .map((category) => ({
        ...category,
        title: category.title.trim(),
        items: category.items.filter((item) => item.name.trim()),
      }))
      .filter((category) => category.title);
  const food = trim(menu.food);
  const drinks = trim(menu.drinks);
  return {
    ...menu,
    food: food.length ? food : defaultMenu.food,
    drinks: drinks.length ? drinks : defaultMenu.drinks,
  };
}

async function readMenu(): Promise<SiteMenu> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ payload: unknown }>`
    select payload from site_menu where id = 1 limit 1
  `;
  return mergeMenu(rows[0]?.payload);
}

const dishSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().max(80),
  price: z.string().trim().max(24),
  note: z.string().trim().max(80),
});

const categorySchema = z.object({
  id: z.string().trim().min(1).max(40),
  title: z.string().trim().max(40),
  items: z.array(dishSchema).max(40),
});

const saveSchema = z.object({
  pin: z.string().min(1).max(40),
  tacoNote: z.string().trim().max(120),
  foodPdf: z.string().trim().max(300),
  drinksPdf: z.string().trim().max(300),
  food: z.array(categorySchema).min(1).max(12),
  drinks: z.array(categorySchema).min(1).max(12),
});

function parseSave(data: unknown) {
  const result = saveSchema.safeParse(data);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join(". ");
  throw new Error(msg || "Could not save menu");
}

export const getPublicMenu = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      return liveMenu(await readMenu());
    } catch (err) {
      console.error("[cms] menu", err);
      return defaultMenu;
    }
  },
);

export const getStaffMenu = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ pin: z.string().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    return readMenu();
  });

export const saveMenu = createServerFn({ method: "POST" })
  .validator((data: unknown) => parseSave(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const { pin: _pin, ...rest } = data;
    const payload = mergeMenu(rest);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into site_menu (id, payload, updated_at)
       values (1, $1::jsonb, now())
       on conflict (id) do update set
         payload = excluded.payload,
         updated_at = now()`,
      [JSON.stringify(payload)],
    );
    const menu = mergeMenu(payload);
    return { ok: true as const, menu };
  });
