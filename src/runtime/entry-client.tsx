import { hydrateRoot } from "react-dom/client";

import { documents } from "virtual:doctrine/content";
import config from "virtual:doctrine/config";
import "virtual:doctrine/styles.css";

import { App } from "./app.js";
import { createDocumentRoutes, findDocumentRoute } from "./content.js";
import { withoutBase } from "./url.js";

async function main(): Promise<void> {
  const root = document.getElementById("doctrine-root");
  if (!root) throw new Error("Doctrine root element is missing");

  const routes = createDocumentRoutes(documents, config);
  const pathname = withoutBase(config.base, window.location.pathname);
  const route = pathname ? findDocumentRoute(routes, pathname) : undefined;
  const module = route ? await route.document.load() : undefined;
  hydrateRoot(
    root,
    <App Content={module?.default} config={config} route={route} routes={routes} />,
  );
}

main().catch((error: unknown) => {
  console.error(error);
});
