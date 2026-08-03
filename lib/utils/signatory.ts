export function normalizeSignatoryName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
