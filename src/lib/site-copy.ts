import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { restaurant, specials as defaultSpecials, houseHours, formatHourLabel, type HoursRow } from "@/lib/restaurant";
import { pinOk } from "@/lib/staff-pin";

export type SiteCopy = {
  heroKicker: string;
  heroHeadline: string;
  heroBody: string;
  aboutHeadline: string;
  about: [string, string, string];
  specials: [
    { title: string; detail: string },
    { title: string; detail: string },
    { title: string; detail: string },
  ];
  orderHeadline: string;
  orderBody: string;
  banquetHeadline: string;
  banquetBody: string;
  visitHeadline: string;
  happyHour: string;
  hours: HoursRow[];
};

export const defaultCopy: SiteCopy = {
  heroKicker: "Galloway, New Jersey",
  heroHeadline: "Tequila and taco bar in Galloway",
  heroBody:
    "Family recipes, tableside Smoke Show cocktails, and an extensive tequila list.",
  aboutHeadline: "Treat every guest like family.",
  about: [restaurant.about[0], restaurant.about[1], restaurant.about[2]],
  specials: [
    { title: defaultSpecials[0].title, detail: defaultSpecials[0].detail },
    { title: defaultSpecials[1].title, detail: defaultSpecials[1].detail },
    { title: defaultSpecials[2].title, detail: defaultSpecials[2].detail },
  ],
  orderHeadline: "Tacos to the door.",
  orderBody:
    "Same kitchen as the dining room. Order through DoorDash, Uber Eats, or Grubhub.",
  banquetHeadline: "Banquets, private parties, and catering.",
  banquetBody:
    "Birthdays, office dinners, catering, and private events in the dining room. Groups of up to 30. Reserve tables on OpenTable, or call us for a larger buyout.",
  visitHeadline: "Find the table.",
  happyHour: "Happy Hour daily · Open until 7pm · Bar & high-tops",
  hours: houseHours(),
} satisfies SiteCopy;

function asHHMM(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return fallback;
  const hour = Number(match[1]);
  if (hour > 23) return fallback;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function mergeHours(raw: unknown): HoursRow[] {
  const house = houseHours();
  if (!Array.isArray(raw) || raw.length !== 7) return house;
  return house.map((day, index) => {
    const item = raw[index] as Partial<HoursRow> | undefined;
    const open = asHHMM(item?.open, day.open);
    const close = asHHMM(item?.close, day.close);
    const label =
      typeof item?.label === "string" && item.label.trim()
        ? item.label.trim().slice(0, 40)
        : formatHourLabel(open, close);
    return { day: day.day, open, close, label };
  });
}

function mergeCopy(raw: unknown): SiteCopy {
  const row = raw && typeof raw === "object" ? (raw as Partial<SiteCopy>) : {};
  return {
    ...defaultCopy,
    ...row,
    about: [
      row.about?.[0] || defaultCopy.about[0],
      row.about?.[1] || defaultCopy.about[1],
      row.about?.[2] || defaultCopy.about[2],
    ],
    specials: [
      {
        title: row.specials?.[0]?.title || defaultCopy.specials[0].title,
        detail: row.specials?.[0]?.detail || defaultCopy.specials[0].detail,
      },
      {
        title: row.specials?.[1]?.title || defaultCopy.specials[1].title,
        detail: row.specials?.[1]?.detail || defaultCopy.specials[1].detail,
      },
      {
        title: row.specials?.[2]?.title || defaultCopy.specials[2].title,
        detail: row.specials?.[2]?.detail || defaultCopy.specials[2].detail,
      },
    ],
    hours: mergeHours(row.hours),
  };
}

async function readCopy(): Promise<SiteCopy> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ payload: unknown }>`
    select payload from site_copy where id = 1 limit 1
  `;
  return mergeCopy(rows[0]?.payload);
}

function parseSave(data: unknown) {
  const result = saveSchema.safeParse(data);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join(". ");
  throw new Error(msg || "Could not save copy");
}

export const getPublicCopy = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      return await readCopy();
    } catch (err) {
      console.error("[cms] copy", err);
      return defaultCopy;
    }
  },
);

export const getStaffCopy = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ pin: z.string().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    return readCopy();
  });

const specialRow = z.object({
  title: z.string().trim().max(40),
  detail: z.string().trim().max(160),
});

const hoursRow = z.object({
  day: z.string().trim().min(1).max(16),
  open: z.string().trim().min(4).max(8),
  close: z.string().trim().min(4).max(8),
  label: z.string().trim().max(40),
});

const saveSchema = z.object({
  pin: z.string().min(1).max(40),
  heroKicker: z.string().trim().max(60),
  heroHeadline: z.string().trim().min(1).max(80),
  heroBody: z.string().trim().max(240),
  aboutHeadline: z.string().trim().min(1).max(80),
  about: z.array(z.string().trim().max(400)).length(3),
  specials: z.array(specialRow).length(3),
  orderHeadline: z.string().trim().max(80),
  orderBody: z.string().trim().max(240),
  banquetHeadline: z.string().trim().max(80),
  banquetBody: z.string().trim().max(320),
  visitHeadline: z.string().trim().max(80),
  happyHour: z.string().trim().max(80),
  hours: z.array(hoursRow).length(7),
});

export const saveCopy = createServerFn({ method: "POST" })
  .validator((data: unknown) => parseSave(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const { pin: _pin, ...rest } = data;
    const payload = { ...rest, hours: mergeHours(rest.hours) };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into site_copy (id, payload, updated_at)
       values (1, $1::jsonb, now())
       on conflict (id) do update set
         payload = excluded.payload,
         updated_at = now()`,
      [JSON.stringify(payload)],
    );
    const copy = await readCopy();
    return { ok: true as const, copy };
  });
