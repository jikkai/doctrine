import type { IDoctrineComponents } from '@amamo/doctrine'

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
    installLabel: 'Install Doctrine with your package manager',
    setupDescription:
      'Keep content close to its navigation metadata. Doctrine turns the directory into routes and validates the whole tree before publishing.',
    setupEyebrow: 'Small source, complete site',
    setupTitle: 'Write docs. Let the site assemble itself.',
    title: 'An MDX directory is all you need.',
    workflow: ['Write MDX', 'Preview every route', 'Publish static files'],
    workflowLabel: 'One source, one continuous path',
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
    installLabel: '使用你的包管理器安装 Doctrine',
    setupDescription:
      '让内容与导航元数据就近放置。Doctrine 会将目录转换成路由，并在发布前校验整棵内容树。',
    setupEyebrow: '精简源码，完整站点',
    setupTitle: '只管写文档，网站会自行组装。',
    title: '只需一个 MDX 目录。',
    workflow: ['编写 MDX', '预览全部路由', '发布静态文件'],
    workflowLabel: '一份源码，一条完整路径',
  },
} as const

export interface IHomeProps {
  components?: IDoctrineComponents
  locale: keyof typeof content
}

export function Home({ components, locale }: IHomeProps) {
  const copy = content[locale]
  const InstallTabs = components?.InstallTabs

  return (
    <div className="text-base leading-7" data-slot="home">
      <section className="border-b border-border/60" data-slot="home-hero">
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:gap-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-sm font-medium text-muted-foreground before:h-px before:w-8 before:bg-[color-mix(in_oklab,var(--primary)_60%,transparent)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[12ch] text-balance font-[var(--doctrine-font-display)] text-5xl leading-[0.98] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]">
              {copy.title}
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              {copy.description}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_90%,var(--background))] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href="./getting-started/"
              >
                {copy.getStarted}
                <span aria-hidden="true">→</span>
              </a>
              <a
                className="group inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href="./features/"
              >
                {copy.featuresLink}
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                >
                  →
                </span>
              </a>
            </div>
          </div>

          <div className="self-end lg:pb-1">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {copy.workflowLabel}
            </p>
            <ol className="mt-5 border-t border-border/60">
              {copy.workflow.map((item, index) => (
                <li
                  className="grid grid-cols-[2rem_1fr] gap-3 border-b border-border/60 py-3.5 text-sm"
                  key={item}
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-primary"
                    data-pagefind-ignore
                  >
                    0{index + 1}
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ol>
            {InstallTabs && (
              <div className="doctrine-prose mt-8">
                <h2 className="sr-only">{copy.installLabel}</h2>
                <InstallTabs packageName="@amamo/doctrine" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60" aria-label={copy.eyebrow}>
        <ol className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3 md:gap-10 lg:px-8 lg:py-20">
          {copy.features.map((feature, index) => (
            <li className="border-t border-border/60 pt-5" key={feature.title}>
              <span
                aria-hidden="true"
                className="font-mono text-xs text-primary"
                data-pagefind-ignore
              >
                0{index + 1}
              </span>
              <h2 className="text-base font-semibold tracking-tight">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-start lg:gap-24 lg:px-8 lg:py-28">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-muted-foreground">{copy.setupEyebrow}</p>
          <h2 className="mt-4 max-w-[16ch] text-balance font-[var(--doctrine-font-display)] text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl">
            {copy.setupTitle}
          </h2>
          <p className="mt-5 text-pretty leading-7 text-muted-foreground">
            {copy.setupDescription}
          </p>
        </div>
        <ul className="border-t border-border/60">
          {copy.included.map((item) => (
            <li className="flex gap-4 border-b border-border/60 py-4" key={item}>
              <span aria-hidden="true" className="text-primary">
                —
              </span>
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
