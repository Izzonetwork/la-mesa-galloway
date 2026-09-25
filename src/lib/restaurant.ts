export const restaurant = {
  name: "La Mesa Tequila & Taco Bar",
  address: "325 E Jimmie Leeds Rd, Galloway, NJ 08205",
  phone: "(609) 757-9977",
  phoneTel: "+16097579977",
  website: "https://www.lamesagalloway.com/",
  mapsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=325+E+Jimmie+Leeds+Rd,+Galloway,+NJ+08205",
  geo: { latitude: 39.4631957, longitude: -74.4938152 },
  seoTitle: "La Mesa Tequila & Taco Bar | Galloway, NJ",
  seoDescription:
    "Mexican restaurant and tequila bar in Galloway, NJ. Birria tacos, margaritas, happy hour, and live music. Reserve or call (609) 757-9977.",
  instagram: "https://www.instagram.com/lamesagalloway/",
  reserveUrl:
    "https://www.opentable.com/r/la-mesa-tequila-and-taco-bar-galloway",
  order: [
    {
      name: "DoorDash",
      href: "https://www.doordash.com/store/la-mesa-tequila-&-taco-bar-galloway-25026534/",
      detail: "Delivery & pickup",
    },
    {
      name: "Uber Eats",
      href: "https://www.ubereats.com/store/la-mesa-tequila-%26-taco-bar/fxopTZ5UXc-eSAzJL_ExzA",
      detail: "Delivery",
    },
    {
      name: "Grubhub",
      href: "https://www.grubhub.com/restaurant/la-mesa-325-e-jimmie-leeds-rd-galloway/4628496",
      detail: "Delivery",
    },
  ],
  chef: "Emiliano Fernandez",
  established: 2022,
  owners: "Vasilev family",
  banquetCapacity: 30,
  priceRange: "$31–$50",
  happyHour: "Every day, open until 7pm, bar and high-tops",
  hours: [
    { day: "Monday", open: "16:00", close: "21:00", label: "4:00pm – 9:00pm" },
    { day: "Tuesday", open: "16:00", close: "21:00", label: "4:00pm – 9:00pm" },
    { day: "Wednesday", open: "16:00", close: "21:00", label: "4:00pm – 9:00pm" },
    { day: "Thursday", open: "16:00", close: "21:00", label: "4:00pm – 9:00pm" },
    { day: "Friday", open: "16:00", close: "22:00", label: "4:00pm – 10:00pm" },
    { day: "Saturday", open: "15:00", close: "22:00", label: "3:00pm – 10:00pm" },
    { day: "Sunday", open: "15:00", close: "21:00", label: "3:00pm – 9:00pm" },
  ],
  menus: {
    food: "https://www.lamesagalloway.com/_files/ugd/c69378_14bfeac15cf54c079d1928e87d73eb05.pdf",
    drinks:
      "https://www.lamesagalloway.com/_files/ugd/c69378_3065d5928675459f9b27a8daf30e5824.pdf",
  },
  about: [
    "This upscale Mexican restaurant and bar was established in 2022 by the Vasilev family. They share authentic family recipes in a vibrant, family-oriented atmosphere.",
    "The owners treat every guest like family. They are often on the floor, greeting tables and asking how the meal was.",
    "The room is contemporary, with custom murals and upbeat music. All dishes are prepared daily in-house. Popular plates include birria tacos, filet mignon tacos, shrimp, and carne asada. House specialties are handcrafted margaritas, the tableside Smoke Show, and an extensive tequila list.",
  ],
} as const;

export type HoursRow = {
  day: string;
  open: string;
  close: string;
  label: string;
};

export function houseHours(): HoursRow[] {
  return restaurant.hours.map((row) => ({
    day: row.day,
    open: row.open,
    close: row.close,
    label: row.label,
  }));
}

export function resolveHours(rows?: HoursRow[] | null): HoursRow[] {
  return rows && rows.length === 7 ? rows : houseHours();
}

export function todayHours(rows?: HoursRow[] | null): HoursRow {
  const list = resolveHours(rows);
  const day = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/New_York",
  });
  return list.find((row) => row.day === day) ?? list[0];
}

function minutesNowNy(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function parseMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

function prettyTime(hhmm: string): string {
  const [hour, minute] = hhmm.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const clock = hour % 12 || 12;
  return minute ? `${clock}:${String(minute).padStart(2, "0")}${suffix}` : `${clock}${suffix}`;
}

export function formatHourLabel(open: string, close: string): string {
  return `${prettyTime(open)} – ${prettyTime(close)}`;
}

export function openStatus(rows?: HoursRow[] | null): {
  open: boolean;
  label: string;
} {
  const list = resolveHours(rows);
  const row = todayHours(list);
  const now = minutesNowNy();
  const opens = parseMinutes(row.open);
  const closes = parseMinutes(row.close);
  if (now >= opens && now < closes) {
    return { open: true, label: `Open now · until ${prettyTime(row.close)}` };
  }
  if (now < opens) {
    return { open: false, label: `Opens today at ${prettyTime(row.open)}` };
  }
  const index = list.findIndex((item) => item.day === row.day);
  const next = list[(index + 1) % list.length];
  return {
    open: false,
    label: `Closed · ${next.day} at ${prettyTime(next.open)}`,
  };
}

export const specials = [
  {
    id: "happy-hour",
    title: "Happy Hour",
    detail: "At the bar and high-tops. Every day, until 7pm.",
    slot: "special-happy-hour",
  },
  {
    id: "tequila-sundays",
    title: "Tequila Sundays",
    detail: "Sunday service built around the tequila list.",
    slot: "special-tequila-sundays",
  },
  {
    id: "smoke-show",
    title: "Smoke Show",
    detail: "Tableside smoked drinks — the house cocktail ritual.",
    slot: "special-smoke-show",
  },
] as const;

export const photos = [
  {
    src: "/photos/bar-room.jpg",
    alt: "The bar at La Mesa — red stools, tequila mural, and papel picado",
    caption: "The bar",
    span: "wide",
  },
  {
    src: "/photos/familia.jpg",
    alt: "Familia mural at La Mesa — magenta, yellow, and cyan graffiti",
    caption: "Familia mural",
    span: "wide",
  },
  {
    src: "/photos/the-room.jpg",
    alt: "Dining room at La Mesa with mural, booths, and the bar",
    caption: "The room",
    span: "wide",
  },
  {
    src: "/photos/birria.jpg",
    alt: "Birria tacos with consommé",
    caption: "Birria tacos",
    span: "normal",
  },
  {
    src: "/photos/smoke-show.jpg",
    alt: "Tableside smoked cocktail under a glass cloche",
    caption: "Smoke Show",
    span: "normal",
  },
  {
    src: "/photos/margaritas.jpg",
    alt: "Four house margaritas on the bar",
    caption: "House margaritas",
    span: "normal",
  },
  {
    src: "/photos/elote.jpg",
    alt: "Street corn, guacamole, and chips",
    caption: "Elote & guacamole",
    span: "normal",
  },
  {
    src: "/photos/filet-tacos.jpg",
    alt: "Filet mignon tacos",
    caption: "Filet tacos",
    span: "normal",
  },
  {
    src: "/photos/tequila-wall.jpg",
    alt: "Backlit tequila bottle wall",
    caption: "The tequila wall",
    span: "normal",
  },
  {
    src: "/photos/party.jpg",
    alt: "Long dining table at La Mesa for private events",
    caption: "Private dining",
    span: "wide",
  },
] as const;

export type MenuItem = { name: string; price: string; note?: string };

export const menu = {
  tacoNote: "Taco prices are for 3 or 5.",
  food: {
    appetizers: [
      { name: "House-made chips & salsas", price: "$4" },
      { name: "Guac and chips", price: "$14", note: "caramelized jalapeños +$2" },
      { name: "Guacamole trio", price: "$26" },
      { name: "Street corn", price: "$12" },
      { name: "Queso fundido", price: "$15", note: "add chorizo +$2" },
      { name: "Chile relleno", price: "$14" },
      { name: "Chorizo meatballs", price: "$15" },
      { name: "Mexican wings", price: "$14" },
      { name: "Empanadas chicken / beef", price: "$16 / $17" },
      { name: "Bang-bang shrimp", price: "$19" },
      { name: "Seafood ceviche", price: "$19" },
      { name: "Tuna tartare", price: "$19" },
      { name: "Seafood trio", price: "$31" },
      { name: "Quesadillas chicken / shrimp / birria", price: "$19–22" },
      { name: "Nachos chicken / pork / birria", price: "$19–23" },
    ],
    tacos: [
      { name: "Chicken tinga", price: "$19 / $30" },
      { name: "Pork carnitas", price: "$19 / $30" },
      { name: "Chorizo", price: "$19 / $30" },
      { name: "Al pastor", price: "$20 / $31" },
      { name: "Grilled fish", price: "$20 / $32" },
      { name: "Grilled salmon", price: "$20 / $32" },
      { name: "Bang-bang shrimp tacos", price: "$20 / $32" },
      { name: "Carne asada", price: "$23 / $35" },
      { name: "Braised brisket", price: "$24 / $36" },
      { name: "Birria", price: "$25 / $37" },
      { name: "Filet mignon", price: "$25 / $37" },
      { name: "Surf & turf", price: "$26 / $39" },
    ],
    plates: [
      { name: "Fajitas chicken / shrimp / steak / combo", price: "$29–35" },
      { name: "Enchiladas verde / suiza / mole", price: "$28–30" },
      { name: "Barbacoa", price: "$33" },
      { name: "Carne asada plate", price: "$34" },
      { name: "Grilled salmon entrée", price: "$33" },
      { name: "Chimichanga", price: "$26" },
      { name: "Chicken tortilla soup", price: "$10" },
      { name: "House salad / Mexican Caesar", price: "$13" },
    ],
    desserts: [
      { name: "Churros", price: "$10" },
      { name: "Tres leches", price: "$11" },
      { name: "Caramel flan", price: "$11" },
      { name: "Flourless chocolate cake", price: "$11" },
      { name: "Tres leches bread pudding", price: "$11" },
      { name: "La Mesa homemade gelato", price: "$10" },
    ],
  } satisfies Record<string, MenuItem[]>,
  drinks: {
    signatures: [
      { name: "La Mesa Margarita", price: "$13" },
      { name: "Cadillac (Grand Marnier)", price: "+$4" },
      { name: "Assorted flavors", price: "+$1" },
      { name: "Blueberry Lychee", price: "$15" },
      { name: "Blackberry Hibiscus", price: "$15" },
      { name: "Coconut-Ginger", price: "$15" },
      { name: "Passion-Fruit Lychee", price: "$15" },
      { name: "Mangonada", price: "$14" },
      { name: "Pineapple Habanero", price: "$15" },
      { name: "Spicy Watermelon", price: "$15" },
      { name: "Jalapeño Jungle Rita", price: "$19" },
      { name: "Grande Guava Margarita", price: "$19" },
      { name: "Corona-Rita Grande", price: "$20" },
      { name: "Colossal Coco-Marg", price: "$21" },
    ],
    spirits: [
      { name: "Tequila Old Fashioned", price: "$16" },
      { name: "Oaxacan Old Fashioned", price: "$15" },
      { name: "Espresso-Mocha Old Fashioned", price: "$15" },
      { name: "Añejo Espresso Martini", price: "$15" },
      { name: "Carajillo", price: "$15" },
      { name: "Smoke Break", price: "$15" },
      { name: "Mezcalito", price: "$15" },
      { name: "Jalisco Mule", price: "$15" },
      { name: "Maple Pear Bourbon", price: "$15" },
      { name: "Paloma Cantarito", price: "$15" },
      { name: "Tamarindo Tiki Twist", price: "$15" },
      { name: "Oaxacan Oasis", price: "$15" },
      { name: "Hibiscus Hula", price: "$15" },
    ],
    share: [
      { name: "Spicy Señoritas — trio", price: "$19" },
      { name: "Fruity Fiesta — cuatro", price: "$25" },
      { name: "Cuatro Borrachos", price: "$27" },
    ],
    "non-alcoholic": [
      { name: "Horchata, Jamaica, Tamarindo, Boing", price: "$4" },
      { name: "Jarritos & Mundet", price: "$5" },
      { name: "Coffee / tea", price: "$3" },
      { name: "Latte / cappuccino", price: "$4" },
    ],
  } satisfies Record<string, MenuItem[]>,
};
