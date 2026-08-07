export function withBase(base: string, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return `${base}${href.slice(1)}`;
}

export function withoutBase(base: string, pathname: string): string | undefined {
  if (!pathname.startsWith(base)) return undefined;
  return normalizeRoutePath(`/${pathname.slice(base.length)}`);
}

export function documentRoutePath(locale: string, defaultLocale: string, slug: string): string {
  const localePrefix = locale === defaultLocale ? "" : `/${encodeURIComponent(locale)}`;
  const slugPath = slug === "/" ? "" : `/${encodeSlug(slug)}`;
  return normalizeRoutePath(`${localePrefix}${slugPath}`);
}

export function normalizeRoutePath(value: string): string {
  const pathname = `/${value.split("/").filter(Boolean).join("/")}`;
  return pathname === "/" ? pathname : `${pathname}/`;
}

function encodeSlug(slug: string): string {
  return slug
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
