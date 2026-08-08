import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [
    { icon: 'House', page: 'index', title: 'Doctrine' },
    { directory: 'guide' },
    { icon: 'Sparkles', page: 'features', title: '功能说明' },
    { icon: 'Palette', page: 'customization', title: '自定义' },
    { icon: 'Settings', page: 'configuration', title: '配置参考' },
    { icon: 'Terminal', page: 'cli', title: 'CLI 参考' },
    { icon: 'Upload', page: 'deployment', title: 'GitHub Pages' },
  ],
})
