import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [
    {
      description: '一个由 Vite 驱动的 MDX 静态文档生成器。',
      icon: 'House',
      page: 'index',
      title: 'Doctrine',
    },
    { icon: 'Rocket', page: 'getting-started', title: '入门教程' },
    { icon: 'Sparkles', page: 'features', title: '功能说明' },
    { icon: 'Palette', page: 'customization', title: '自定义' },
    { icon: 'Blocks', page: 'mdx-components', title: 'MDX 组件' },
    { icon: 'Settings', page: 'configuration', title: '配置参考' },
    { icon: 'Terminal', page: 'cli', title: 'CLI 参考' },
    { icon: 'Upload', page: 'deployment', title: 'GitHub Pages' },
  ],
})
