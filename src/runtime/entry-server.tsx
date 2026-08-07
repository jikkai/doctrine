import type { Readable } from "node:stream";

import { prerenderToNodeStream } from "react-dom/static";

import components from "virtual:doctrine/components";
import { documents } from "virtual:doctrine/content";
import config from "virtual:doctrine/config";
import "virtual:doctrine/styles.css";

import { App } from "./app.js";
import { createDocumentRoutes, findDocumentRoute } from "./content.js";
import { htmlDocument } from "./document.js";
import type { IPageAssets } from "./types.js";

const routes = createDocumentRoutes(documents, config);

export function getRoutePaths(): string[] {
  return routes.map((route) => route.path);
}

export async function renderPage(pathname: string, assets: IPageAssets): Promise<string> {
  const route = findDocumentRoute(routes, pathname);
  const module = route ? await route.document.load() : undefined;
  const result = await prerenderToNodeStream(
    <App
      Content={module?.default}
      components={components}
      config={config}
      route={route}
      routes={routes}
    />,
  );
  const appHtml = await readStream(result.prelude as Readable);
  return htmlDocument(appHtml, config, routes, route, assets);
}

function readStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let value = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk: string) => {
      value += chunk;
    });
    stream.on("end", () => resolve(value));
    stream.on("error", reject);
  });
}
