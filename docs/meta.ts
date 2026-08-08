import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [
    { icon: 'House', page: 'index', title: 'Doctrine' },
    { directory: 'guide' },
    { icon: 'Sparkles', page: 'features', title: 'Features' },
    { icon: 'Palette', page: 'customization', title: 'Customization' },
    { icon: 'Settings', page: 'configuration', title: 'Configuration' },
    { icon: 'Terminal', page: 'cli', title: 'CLI reference' },
    { icon: 'Upload', page: 'deployment', title: 'GitHub Pages' },
  ],
})
