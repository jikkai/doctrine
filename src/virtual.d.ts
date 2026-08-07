declare module "virtual:doctrine/content" {
  export const documents: readonly import("./runtime/types.js").IGeneratedDocument[];
}

declare module "virtual:doctrine/config" {
  const config: import("./runtime/types.js").IRuntimeConfig;
  export default config;
}

declare module "virtual:doctrine/styles.css" {}
