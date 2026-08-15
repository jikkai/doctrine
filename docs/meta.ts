import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [
    {
      description: 'A Vite-powered static documentation generator for MDX.',
      icon: 'House',
      page: 'index',
      title: 'Doctrine',
    },
    { icon: 'Rocket', page: 'getting-started', title: 'Getting started' },
    { icon: 'Sparkles', page: 'features', title: 'Features' },
    { icon: 'Palette', page: 'customization', title: 'Customization' },
    { icon: 'Blocks', page: 'mdx-components', title: 'MDX components' },
    { icon: 'Settings', page: 'configuration', title: 'Configuration' },
    { icon: 'Terminal', page: 'cli', title: 'CLI reference' },
    { icon: 'Upload', page: 'deployment', title: 'GitHub Pages' },
  ],
})
