import { existsSync, realpathSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import { loadConfigFromFile } from "vite";

export type DoctrineLocalizedText = string | Readonly<Record<string, string>>;

export interface IDoctrineLocaleConfig {
  default: string;
  labels?: Readonly<Record<string, string>>;
  names: string[];
}

export interface IDoctrineConfig {
  description?: DoctrineLocalizedText;
  locales?: IDoctrineLocaleConfig;
  outDir?: string;
  siteUrl?: string;
  title?: DoctrineLocalizedText;
}

export interface INormalizedDoctrineConfig {
  base: string;
  contentDirectory: string;
  description: DoctrineLocalizedText;
  locales: IDoctrineLocaleConfig;
  outDir: string;
  root: string;
  siteUrl: string;
  title: DoctrineLocalizedText;
}

export interface INormalizeOptions {
  contentDirectory: string;
  outDir?: string;
  root: string;
  siteUrl?: string;
}

const CONFIG_FILES = [
  "doctrine.config.ts",
  "doctrine.config.mts",
  "doctrine.config.js",
  "doctrine.config.mjs",
] as const;

export function defineConfig<T extends IDoctrineConfig>(config: T): T {
  return config;
}

export async function loadDoctrineConfig(root: string, command: "build" | "serve") {
  const configFile = CONFIG_FILES.map((name) => path.join(root, name)).find(existsSync);
  if (!configFile) return {};

  const loaded = await loadConfigFromFile(
    { command, mode: command === "build" ? "production" : "development" },
    configFile,
    root,
  );
  if (!loaded) throw new Error(`Unable to load ${path.basename(configFile)}`);
  return loaded.config as IDoctrineConfig;
}

export async function normalizeDoctrineConfig(
  config: IDoctrineConfig,
  options: INormalizeOptions,
): Promise<INormalizedDoctrineConfig> {
  const resolvedRoot = path.resolve(options.root);
  const root = existsSync(resolvedRoot) ? realpathSync.native(resolvedRoot) : resolvedRoot;
  const contentDirectory = path.resolve(root, options.contentDirectory);
  const contentStat = await stat(contentDirectory).catch(() => undefined);
  if (!contentStat?.isDirectory()) {
    throw new Error(`MDX directory does not exist: ${contentDirectory}`);
  }

  const locales = normalizeLocales(config.locales);
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? config.siteUrl ?? "http://localhost/");

  return {
    base: new URL(siteUrl).pathname,
    contentDirectory: realpathSync.native(contentDirectory),
    description: config.description ?? "Documentation built from MDX.",
    locales,
    outDir: path.resolve(root, options.outDir ?? config.outDir ?? "dist"),
    root,
    siteUrl,
    title: config.title ?? "Documentation",
  };
}

function normalizeLocales(config: IDoctrineLocaleConfig | undefined): IDoctrineLocaleConfig {
  const value = config ?? { default: "en", names: ["en"] };
  if (value.names.length === 0 || !value.names.includes(value.default)) {
    throw new Error("locales.default must be included in locales.names");
  }
  if (new Set(value.names).size !== value.names.length) {
    throw new Error("locales.names must not contain duplicates");
  }
  for (const locale of value.names) {
    if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(locale)) {
      throw new Error(`Invalid locale: ${locale}`);
    }
  }
  return {
    default: value.default,
    labels: { ...value.labels },
    names: [...value.names],
  };
}

function normalizeSiteUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("siteUrl must use http or https");
  }
  if (url.search || url.hash) throw new Error("siteUrl must not include a query or fragment");
  url.pathname = `/${url.pathname.split("/").filter(Boolean).join("/")}${url.pathname === "/" ? "" : "/"}`;
  return url.href;
}
