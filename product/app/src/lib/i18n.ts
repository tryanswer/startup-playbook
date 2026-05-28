/**
 * Lightweight i18n — auto-detects system language, supports manual switch.
 * Stored in localStorage so the preference persists.
 */

export type Locale = 'en' | 'zh';

const LOCALE_KEY = 'sp_locale';

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first (user's explicit choice)
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;

  // Fall back to browser/system language
  const browserLang = navigator.language || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
}

// --- Translation dictionary ---

const translations = {
  // Nav
  'nav.ideas': { en: 'Ideas', zh: '想法' },
  'nav.products': { en: 'Products', zh: '产品' },
  'nav.agent': { en: 'Agent', zh: '智能体' },

  // Home
  'home.title': { en: 'From Idea to Revenue', zh: '从想法到收入' },
  'home.subtitle': {
    en: 'Submit an idea. Get automated validation, business model design, and growth strategy — with an AI agent available at every stage.',
    zh: '提交一个想法，自动完成验证、商业模式设计和增长策略——每个阶段都有 AI 智能体协助。',
  },
  'home.ideas.label': { en: 'Ideas', zh: '想法' },
  'home.ideas.desc': { en: 'Validate & incubate', zh: '验证与孵化' },
  'home.products.label': { en: 'Products', zh: '产品' },
  'home.products.desc': { en: 'Grow & operate', zh: '增长与运营' },
  'home.agent.label': { en: 'Agent', zh: '智能体' },
  'home.agent.desc': { en: 'AI collaboration', zh: 'AI 协作' },
  'home.cta': { en: 'Start with an Idea', zh: '从一个想法开始' },

  // Ideas list
  'ideas.title': { en: 'Ideas', zh: '想法' },
  'ideas.count': { en: '{count} idea(s) in incubation', zh: '{count} 个想法孵化中' },
  'ideas.empty': { en: 'No ideas yet. Start by submitting one.', zh: '还没有想法，提交一个开始吧。' },
  'ideas.new': { en: 'New Idea', zh: '新想法' },
  'ideas.status.running': { en: '🔄 Running', zh: '🔄 执行中' },
  'ideas.status.waiting': { en: '⏳ Needs decision', zh: '⏳ 等待决策' },
  'ideas.status.next': { en: 'Next: {stage}', zh: '下一步: {stage}' },

  // New idea form
  'new.title': { en: 'New Idea', zh: '新想法' },
  'new.subtitle': {
    en: "Describe your idea and we'll automatically validate it against Reddit, Google Trends, and competitor data.",
    zh: '描述你的想法，我们会自动通过 Reddit、Google Trends 和竞品数据进行验证。',
  },
  'new.name.label': { en: 'Idea Name', zh: '想法名称' },
  'new.name.optional': { en: '(optional)', zh: '（可选）' },
  'new.name.placeholder': { en: 'e.g., AI Skin Analysis App', zh: '如：AI 皮肤分析应用' },
  'new.desc.label': { en: "What's your idea?", zh: '你的想法是什么？' },
  'new.desc.placeholder': {
    en: "Describe the problem you're solving and for whom. 2-3 sentences work best.\n\ne.g., An AI-powered skin analysis app that recommends personalized skincare routines for women 25-35 who are overwhelmed by product choices.",
    zh: '描述你要解决的问题以及目标用户。2-3 句话最佳。\n\n如：一款 AI 驱动的皮肤分析应用，为 25-35 岁被护肤品选择困扰的女性推荐个性化护肤方案。',
  },
  'new.advanced': { en: 'Advanced options', zh: '高级选项' },
  'new.keywords.label': { en: 'Keywords', zh: '关键词' },
  'new.keywords.hint': { en: '(comma-separated)', zh: '（逗号分隔）' },
  'new.subreddits.label': { en: 'Target Subreddits', zh: '目标 Subreddits' },
  'new.geo.label': { en: 'Geographic Focus', zh: '地域聚焦' },
  'new.geo.global': { en: 'Global', zh: '全球' },
  'new.submit': { en: 'Start Validation', zh: '开始验证' },

  // Idea detail / stage
  'stage.validate': { en: 'Validate', zh: '验证' },
  'stage.business-model': { en: 'Business Model', zh: '商业模式' },
  'stage.build': { en: 'Build', zh: '构建' },
  'stage.grow': { en: 'Grow', zh: '增长' },
  'stage.operate': { en: 'Operate', zh: '运营' },
  'stage.validate.desc': { en: 'Reddit pain mining, trends, competitor scan', zh: 'Reddit 痛点挖掘、趋势分析、竞品扫描' },
  'stage.business-model.desc': { en: 'Model selection, pricing, revenue projection', zh: '模式选择、定价、收入预测' },
  'stage.build.desc': { en: 'Scaffold, develop, deploy', zh: '脚手架、开发、部署' },
  'stage.grow.desc': { en: 'Content, SEO, distribution channels', zh: '内容、SEO、分发渠道' },
  'stage.operate.desc': { en: 'Metrics, retention, weekly reports', zh: '指标、留存、周报' },
  'stage.run': { en: 'Run Validation', zh: '运行验证' },
  'stage.running': { en: 'Running...', zh: '执行中...' },
  'stage.artifacts': { en: 'Artifacts', zh: '产出物' },
  'stage.openAgent': { en: 'Open Agent', zh: '打开智能体' },
  'stage.hideAgent': { en: 'Hide Agent', zh: '隐藏智能体' },
  'stage.pendingHint': { en: 'Run validation to see the report', zh: '运行验证以查看报告' },
  'stage.runningHint': { en: 'Validation in progress...', zh: '验证进行中...' },
  'stage.noReport': { en: 'No report available', zh: '暂无报告' },
  'stage.agentHint': { en: 'Or open the Agent to explore manually', zh: '也可以打开智能体手动探索' },

  // Decision gate
  'decision.title': { en: 'Decision Gate', zh: '决策门' },
  'decision.score': { en: 'Score: {score} / 100', zh: '评分: {score} / 100' },
  'decision.evidence': { en: 'Evidence', zh: '支撑证据' },
  'decision.concerns': { en: 'Concerns', zh: '风险提示' },
  'decision.continue': { en: 'Continue to Next Stage', zh: '进入下一阶段' },
  'decision.pivot': { en: 'Pivot', zh: '调整方向' },
  'decision.kill': { en: 'Kill', zh: '终止' },
  'decision.completed': { en: 'Decision: {decision}', zh: '决策: {decision}' },
  'decision.fallback': { en: 'Validation completed. Review the report and make your decision.', zh: '验证完成，查看报告并做出决策。' },

  // Agent terminal
  'agent.title': { en: 'Agent', zh: '智能体' },
  'agent.placeholder': { en: 'Ask the agent...', zh: '向智能体提问...' },
  'agent.empty': { en: 'Ask me anything about your idea or this stage.', zh: '关于你的想法或当前阶段，随便问我。' },
  'agent.suggest.subreddits': { en: 'Search more subreddits', zh: '搜索更多 subreddit' },
  'agent.suggest.japan': { en: 'Analyze Japanese market', zh: '分析日本市场' },
  'agent.suggest.pain': { en: 'Deep dive the top pain point', zh: '深入分析首要痛点' },
  'agent.suggest.saas': { en: 'Compare SaaS vs one-time pricing', zh: '对比 SaaS 与一次性定价' },
  'agent.suggest.ltv': { en: 'Calculate LTV for this model', zh: '计算该模式的 LTV' },
  'agent.suggest.brainstorm': { en: 'Help me brainstorm a new idea', zh: '帮我头脑风暴新想法' },

  // Agent page (multi-tab)
  'agent.newTab': { en: 'New Agent Tab', zh: '新建智能体标签' },
  'agent.newTab.desc': { en: 'Choose a project to connect the agent to, or start a free session.', zh: '选择要关联的项目，或开启自由对话。' },
  'agent.freeSession': { en: 'Free Session', zh: '自由对话' },
  'agent.freeSession.desc': { en: 'No project context — general exploration', zh: '无项目上下文——自由探索' },
  'agent.noProjects': { en: 'No projects yet. Create an idea first.', zh: '还没有项目，先创建一个想法。' },
  'agent.noTabs': { en: 'No agent tabs open.', zh: '没有打开的智能体标签。' },
  'agent.cancel': { en: 'Cancel', zh: '取消' },

  // Products
  'products.title': { en: 'Products', zh: '产品' },
  'products.count': { en: '{count} product(s) running', zh: '{count} 个产品运营中' },
  'products.empty': { en: 'No products yet.', zh: '还没有产品。' },
  'products.empty.hint': { en: 'Ideas graduate to Products after completing the Build stage.', zh: '想法在完成构建阶段后进入产品列表。' },
  'products.goIdeas': { en: 'Go to Ideas →', zh: '前往想法 →' },

  // Auto tasks
  'task.reddit': { en: 'Reddit Pain Mining', zh: 'Reddit 痛点挖掘' },
  'task.trends': { en: 'Trends & Demand Check', zh: '趋势与需求检查' },
  'task.competitors': { en: 'Competitor Scan', zh: '竞品扫描' },
  'task.report': { en: 'Generate Report', zh: '生成报告' },

  // Language
  'lang.switch': { en: '中文', zh: 'English' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale, params?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;
  let text: string = entry[locale] || entry.en;
  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(`{${paramKey}}`, String(value));
    }
  }
  return text;
}
