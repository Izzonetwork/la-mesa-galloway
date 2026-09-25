import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { pinOk } from "@/lib/staff-pin";
import { TERMS_VERSION } from "@/lib/terms";

const emailField = z.string().trim().max(120).pipe(z.email());

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

const phoneField = z
  .string()
  .trim()
  .min(7, "Add a phone number")
  .max(24)
  .refine((value) => {
    const digits = normalizePhone(value);
    return digits.length === 10;
  }, "Use a 10-digit U.S. mobile number");

const subscribeSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: emailField,
  phone: phoneField,
  consent: z.literal(true, {
    error: "Agree to the guest list terms to join",
  }),
});

export type SubscriberRow = {
  id: number;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  consented_at: string | null;
  terms_version: string | null;
};

async function upsertSubscriber(data: {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}): Promise<{ id: number; created: boolean }> {
  const email = data.email.toLowerCase();
  const phone = normalizePhone(data.phone);
  const sql = await getSql();
  const existing = await sql<{ id: number }>`
    select id from subscribers where email = ${email} limit 1
  `;
  if (existing[0]) {
    await sql`
      update subscribers
      set
        name = case when ${data.name} = '' then name else ${data.name} end,
        phone = ${phone},
        consented_at = case when ${data.consent} then now() else consented_at end,
        terms_version = case
          when ${data.consent} then ${TERMS_VERSION}
          else terms_version
        end
      where id = ${existing[0].id}
    `;
    return { id: existing[0].id, created: false };
  }
  const rows = await sql<{ id: number }>`
    insert into subscribers (email, name, phone, consented_at, terms_version)
    values (${email}, ${data.name}, ${phone}, now(), ${TERMS_VERSION})
    returning id
  `;
  return { id: rows[0].id, created: true };
}

async function readList(): Promise<SubscriberRow[]> {
  const sql = await getSql();
  return sql<SubscriberRow>`
    select
      id,
      email,
      name,
      phone,
      created_at::text as created_at,
      consented_at::text as consented_at,
      terms_version
    from subscribers
    order by created_at desc
    limit 500
  `;
}

export const createSubscriber = createServerFn({ method: "POST" })
  .validator((data: unknown) => subscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const result = await upsertSubscriber({ ...data, consent: true });
    return {
      ok: true as const,
      id: result.id,
      message: result.created
        ? "You're on the list."
        : "You're already on the list. We saved the number.",
    };
  });

export function formatPhoneDisplay(digits: string) {
  const clean = digits.replace(/\D/g, "");
  const phone =
    clean.length === 11 && clean.startsWith("1") ? clean.slice(1) : clean;
  if (phone.length !== 10) return digits;
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}

export const listInbox = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ pin: z.string().min(1).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    return { subscribers: await readList() };
  });

const staffAddSchema = z.object({
  pin: z.string().min(1).max(40),
  name: z.string().trim().max(80).optional().default(""),
  email: emailField,
  phone: phoneField,
  consent: z.boolean(),
});

export const addStaffSubscriber = createServerFn({ method: "POST" })
  .validator((data: unknown) => staffAddSchema.parse(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    if (!data.consent) {
      throw new Error("Guest has to agree before you add the number.");
    }
    const result = await upsertSubscriber({
      name: data.name,
      email: data.email,
      phone: data.phone,
      consent: true,
    });
    return {
      ok: true as const,
      subscribers: await readList(),
      message: result.created
        ? "Added to the collection."
        : "Already on the list — name and number updated.",
    };
  });

const staffUpdateSchema = z.object({
  pin: z.string().min(1).max(40),
  id: z.number().int().positive(),
  name: z.string().trim().max(80).optional().default(""),
  email: emailField,
  phone: phoneField,
});

export const updateStaffSubscriber = createServerFn({ method: "POST" })
  .validator((data: unknown) => staffUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const email = data.email.toLowerCase();
    const phone = normalizePhone(data.phone);
    const sql = await getSql();
    const clash = await sql<{ id: number }>`
      select id from subscribers where email = ${email} and id <> ${data.id} limit 1
    `;
    if (clash[0]) throw new Error("That email is already on the list.");
    const updated = await sql<{ id: number }>`
      update subscribers
      set name = ${data.name}, email = ${email}, phone = ${phone}
      where id = ${data.id}
      returning id
    `;
    if (!updated[0]) throw new Error("Guest not found.");
    return { ok: true as const, subscribers: await readList() };
  });

export const deleteStaffSubscriber = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        pin: z.string().min(1).max(40),
        id: z.number().int().positive(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!pinOk(data.pin)) throw new Error("unauthorized");
    const sql = await getSql();
    await sql`delete from subscribers where id = ${data.id}`;
    return { ok: true as const, subscribers: await readList() };
  });
