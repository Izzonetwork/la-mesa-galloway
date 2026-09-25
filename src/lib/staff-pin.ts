export function staffPin() {
  const fromEnv = process.env.STAFF_PIN?.trim();
  if (fromEnv) return fromEnv;
  return "mesa2026";
}

export function pinOk(pin: string) {
  return pin === staffPin();
}
