const content = {
  en: {
    description:
      'Doctrine adds navigation, search, localization, light and dark themes, and static output—ready to preview locally and deploy anywhere.',
    eyebrow: 'Static documentation, ready by default',
    features: [
      {
        description:
          'Start the development server and get navigation, search, themes, and responsive layout without assembling a stack.',
        title: 'Ready on first run',
      },
      {
        description:
          'Every route is prerendered and indexed. The deployed site is ordinary static files with no Node.js server.',
        title: 'Static by design',
      },
      {
        description:
          'Repository subpaths, localized routes, assets, search results, and 404 pages stay correct on GitHub Pages.',
        title: 'Deploy without surprises',
      },
    ],
    featuresLink: 'Explore the features',
    getStarted: 'Get started',
    included: [
      'Localized content and navigation',
      'Pagefind search',
      'Persistent light and dark themes',
      'Custom React and MDX components',
      'Subpath-safe static deployment',
    ],
    installLabel: 'Install Doctrine and start the development server',
    setupDescription:
      'Keep content close to its navigation metadata. Doctrine turns the directory into routes and validates the whole tree before publishing.',
    setupEyebrow: 'Small source, complete site',
    setupTitle: 'Write docs. Let the site assemble itself.',
    title: 'An MDX directory is all you need.',
  },
  'zh-CN': {
    description:
      'Doctrine 自动补齐导航、搜索、多语言、明暗主题和静态产物，本地即可预览，也能直接部署到任意静态平台。',
    eyebrow: '开箱即用的静态文档',
    features: [
      {
        description: '启动开发服务器即可获得导航、搜索、主题和响应式布局，不必再拼装一套技术栈。',
        title: '第一次运行就完整可用',
      },
      {
        description:
          '每条路由都会预渲染并建立索引，部署产物只是普通静态文件，不需要 Node.js 服务器。',
        title: '从设计上就是静态的',
      },
      {
        description:
          'GitHub Pages 上的仓库子路径、语言路由、资源、搜索结果和 404 页面都会保持正确。',
        title: '部署不留意外',
      },
    ],
    featuresLink: '查看功能说明',
    getStarted: '开始使用',
    included: [
      '多语言内容与导航',
      'Pagefind 搜索',
      '持久化明暗主题',
      '自定义 React 与 MDX 组件',
      '支持子路径的静态部署',
    ],
    installLabel: '安装 Doctrine 并启动开发服务器',
    setupDescription:
      '让内容与导航元数据就近放置。Doctrine 会将目录转换成路由，并在发布前校验整棵内容树。',
    setupEyebrow: '精简源码，完整站点',
    setupTitle: '只管写文档，网站会自行组装。',
    title: '只需一个 MDX 目录。',
  },
} as const

interface IHomeProps {
  locale: keyof typeof content
}

export function Home({ locale }: IHomeProps) {
  const copy = content[locale]

  return (
    <div className="text-base leading-7 sm:text-[15px]" data-slot="home">
      <section className="border-b border-border" data-slot="home-hero">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href="./guide/getting-started/"
              >
                {copy.getStarted}
                <span aria-hidden="true">→</span>
              </a>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href="./features/"
              >
                {copy.featuresLink}
              </a>
            </div>
          </div>

          <pre
            aria-label={copy.installLabel}
            className="mt-14 max-w-3xl overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-4 font-mono text-[13px] leading-6 sm:px-5 sm:text-sm"
          >
            <code>
              <span className="select-none text-muted-foreground">$ </span>pnpm add @amamo/doctrine
              {'\n'}
              <span className="select-none text-muted-foreground">$ </span>pnpm exec doctrine dev
              docs
            </code>
          </pre>
        </div>
      </section>

      <section className="border-b border-border" aria-label={copy.eyebrow}>
        <div className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {copy.features.map((feature) => (
            <div className="py-10 md:px-8 md:py-12 md:first:pl-0 md:last:pr-0" key={feature.title}>
              <h2 className="text-base font-semibold tracking-tight">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-start lg:gap-20 lg:px-8 lg:py-28">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-muted-foreground">{copy.setupEyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.setupTitle}
          </h2>
          <p className="mt-5 text-pretty leading-7 text-muted-foreground">
            {copy.setupDescription}
          </p>
        </div>
        <ul className="grid gap-4">
          {copy.included.map((item) => (
            <li className="flex gap-3 border-b border-border pb-4 last:border-0" key={item}>
              <span
                aria-hidden="true"
                className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-foreground"
              />
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
