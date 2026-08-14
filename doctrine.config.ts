import { defineConfig } from '@amamo/doctrine'

export default defineConfig({
  components: './docs/components.tsx',
  copyright: 'copyright © 2026 白熱。',
  description: 'A Vite-powered static documentation generator for MDX.',
  locales: {
    default: 'en',
    labels: { en: 'English', 'zh-CN': '简体中文' },
    names: ['en', 'zh-CN'],
  },
  githubUrl: 'https://github.com/jikkai/doctrine',
  iconLibrary: 'lucide-react',
  styles: './docs/theme.css',
  title: '@amamo/doctrine',
})
