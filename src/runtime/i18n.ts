import type { DoctrineLocalizedText } from "../config.js";

export function localizedText(
  value: DoctrineLocalizedText,
  locale: string,
  fallback: string,
): string {
  if (typeof value === "string") return value;
  return value[locale] ?? value[fallback] ?? Object.values(value)[0] ?? "";
}
