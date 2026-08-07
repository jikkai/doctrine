import { defineConfig } from "@amamo/doctrine";

export default defineConfig({
  description: {
    en: "A Vite-powered static documentation generator for MDX.",
    "zh-CN": "一个由 Vite 驱动的 MDX 静态文档生成器。",
  },
  locales: {
    default: "en",
    labels: { en: "English", "zh-CN": "简体中文" },
    names: ["en", "zh-CN"],
  },
  title: "@amamo/doctrine",
});
