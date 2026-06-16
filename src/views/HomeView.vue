<script setup lang="ts">
/**
 * 智演 AI · 产品官网（落地页）
 * 视觉参考 public/code.html，CTA 跳 /app（即原 LandingView "用一句话生成 PPT" 入口）
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const navScrolled = ref(false)
const mobileOpen = ref(false)
const yearly = ref(false)

function onScroll() {
  navScrolled.value = window.scrollY > 50
}

function go() {
  router.push('/app')
}

function scrollTo(hash: string) {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  mobileOpen.value = false
}

// 数字滚动动画
const counters = ref<HTMLElement[]>([])
function setCounterRef(el: Element | any) {
  if (el && el instanceof HTMLElement) counters.value.push(el)
}
function animateCounter(el: HTMLElement) {
  const target = Number(el.dataset.target ?? 0)
  const suffix = el.dataset.suffix ?? ''
  const duration = 1800
  const start = performance.now()
  const fmt = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(0) + '万'
    return n.toLocaleString()
  }
  function step(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = fmt(Math.round(eased * target)) + suffix
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

let observer: IntersectionObserver | null = null
let revealObs: IntersectionObserver | null = null

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target as HTMLElement)
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )
  counters.value.forEach((c) => observer?.observe(c))

  // reveal stagger
  revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const parent = entry.target.parentElement
          if (parent) {
            const sibs = Array.from(parent.querySelectorAll('.reveal'))
            const idx = sibs.indexOf(entry.target)
            setTimeout(() => entry.target.classList.add('visible'), idx * 80)
          } else {
            entry.target.classList.add('visible')
          }
          revealObs?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.reveal').forEach((el) => revealObs?.observe(el))
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
  revealObs?.disconnect()
})

const features = [
  {
    title: 'AI 智能生成',
    desc: '输入一句话主题，AI 自动完成内容大纲、文案撰写、版式设计，60秒交付完整演示文稿',
    icon: 'M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22 M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93',
    tone: 'rgba(45,212,191,0.12)',
    stroke: '#5eead4'
  },
  {
    title: '5000+ 精品模板',
    desc: '覆盖商务汇报、产品发布、学术答辩等 50+ 场景，持续更新行业定制模板库',
    icon: '',
    tone: 'rgba(52,211,153,0.12)',
    stroke: '#34d399',
    grid: true
  },
  {
    title: '一键美化',
    desc: '智能配色、自动对齐、字体优化——一键将平庸设计升级为专业级视觉效果',
    icon: '',
    tone: 'rgba(251,191,36,0.12)',
    stroke: '#fbbf24',
    magic: true
  },
  {
    title: '智能排版引擎',
    desc: '基于设计原理的 AI 排版系统，自动处理对齐、留白、层级，确保每页都赏心悦目',
    icon: '',
    tone: 'rgba(244,114,182,0.12)',
    stroke: '#f472b6',
    layout: true
  },
  {
    title: '多语言支持',
    desc: '支持中、英、日、韩等 30+ 种语言，一键翻译整套演示文稿，轻松应对国际化场景',
    icon: '',
    tone: 'rgba(56,189,248,0.12)',
    stroke: '#38bdf8',
    globe: true
  },
  {
    title: '团队实时协作',
    desc: '多人同时编辑、评论、版本管理，让团队协作像编辑文档一样简单流畅',
    icon: '',
    tone: 'rgba(251,146,60,0.12)',
    stroke: '#fb923c',
    team: true
  }
]

const showcaseGradients = [
  'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',
  'linear-gradient(135deg,#042f2e 0%,#115e59 100%)',
  'linear-gradient(135deg,#450a0a 0%,#7f1d1d 100%)',
  'linear-gradient(135deg,#172554 0%,#1e3a5f 100%)',
  'linear-gradient(135deg,#3b0764 0%,#581c87 100%)',
  'linear-gradient(135deg,#1c1917 0%,#44403c 100%)',
  'linear-gradient(135deg,#052e16 0%,#14532d 100%)',
  'linear-gradient(135deg,#422006 0%,#78350f 100%)'
]
const showcaseLabels = ['商业计划', '产品发布', '年度汇报', '学术答辩', '营销方案', '融资路演', '教育培训', '工作周报']

const pricing = [
  {
    plan: '免费版',
    desc: '适合个人体验与轻度使用',
    monthly: 0,
    yearly: 0,
    period: '永久免费',
    features: ['每月生成 3 套演示文稿', '基础模板库', '导出 PDF 格式', '单人使用'],
    cta: '免费开始',
    featured: false
  },
  {
    plan: '专业版',
    desc: '适合高频使用的职场人士',
    monthly: 49,
    yearly: 39,
    period: '/月',
    features: ['无限生成演示文稿', '全部 5000+ 模板', 'PPT / PDF / 图片导出', 'AI 文案增强 & 翻译', '去除水印'],
    cta: '立即订阅',
    featured: true
  },
  {
    plan: '企业版',
    desc: '适合团队协作与品牌管理',
    monthly: 199,
    yearly: 159,
    period: '/月',
    features: ['专业版全部功能', '团队实时协作', '品牌资产管理', '管理员控制台', '优先技术支持'],
    cta: '联系销售',
    featured: false
  }
]

const testimonials = [
  {
    text: '以前每次做周报 PPT 都要花两三个小时，用智演 AI 之后，输入要点，一分钟就能生成一套精美的周报。省下来的时间可以专注在内容思考上。',
    name: '陈思远',
    role: '产品总监 · 某互联网公司',
    avatar: '陈',
    grad: 'linear-gradient(135deg,#2dd4bf,#5eead4)'
  },
  {
    text: '作为设计师，我原本对 AI 做 PPT 持怀疑态度。但试用后发现它的排版审美真的很在线，配色方案和留白处理甚至超过了很多初级设计师。',
    name: '林雨晴',
    role: 'UI 设计师 · 某设计工作室',
    avatar: '林',
    grad: 'linear-gradient(135deg,#34d399,#6ee7b7)'
  },
  {
    text: '我们整个教研组都在用。上传论文摘要，AI 自动生成答辩 PPT，逻辑清晰、图表专业。学生答辩通过率明显提高了，太省心了。',
    name: '王建国',
    role: '教授 · 某重点大学',
    avatar: '王',
    grad: 'linear-gradient(135deg,#f472b6,#fb7185)'
  }
]
</script>

<template>
  <div class="home grain-overlay">
    <!-- ============ NAVBAR ============ -->
    <nav
      class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      :class="navScrolled ? 'py-3 bg-canvas/80 backdrop-blur-xl border-b border-white/5' : 'py-4'"
    >
      <div class="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        <a href="#" class="flex items-center gap-2.5 font-display font-extrabold text-[22px]">
          <span
            class="w-9 h-9 rounded-[10px] grid place-items-center text-white text-lg font-black bg-brand-gradient"
          >S</span>
          智演 AI
        </a>
        <div class="hidden md:flex items-center gap-9">
          <a class="text-sm text-ink-500 hover:text-ink-900 transition-colors" href="#features" @click.prevent="scrollTo('#features')">功能</a>
          <a class="text-sm text-ink-500 hover:text-ink-900 transition-colors" href="#workflow" @click.prevent="scrollTo('#workflow')">工作流</a>
          <a class="text-sm text-ink-500 hover:text-ink-900 transition-colors" href="#pricing" @click.prevent="scrollTo('#pricing')">定价</a>
          <a class="text-sm text-ink-500 hover:text-ink-900 transition-colors" href="#testimonials" @click.prevent="scrollTo('#testimonials')">评价</a>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <a href="#" class="text-sm text-ink-500 hover:text-ink-900 transition-colors">登录</a>
          <button class="btn-shiny h-10 px-6 text-[13px]" @click="go">免费开始</button>
        </div>
        <button
          class="md:hidden flex flex-col gap-1.5 p-1"
          aria-label="菜单"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="w-6 h-0.5 bg-ink-900 rounded"></span>
          <span class="w-6 h-0.5 bg-ink-900 rounded"></span>
          <span class="w-6 h-0.5 bg-ink-900 rounded"></span>
        </button>
      </div>
    </nav>

    <!-- 移动菜单 -->
    <div
      v-if="mobileOpen"
      class="md:hidden fixed inset-0 z-40 bg-canvas/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
    >
      <a class="font-display text-2xl font-bold" href="#features" @click.prevent="scrollTo('#features')">功能</a>
      <a class="font-display text-2xl font-bold" href="#workflow" @click.prevent="scrollTo('#workflow')">工作流</a>
      <a class="font-display text-2xl font-bold" href="#pricing" @click.prevent="scrollTo('#pricing')">定价</a>
      <a class="font-display text-2xl font-bold" href="#testimonials" @click.prevent="scrollTo('#testimonials')">评价</a>
      <button class="btn-shiny h-11 px-6 mt-4" @click="go(); mobileOpen = false">免费开始</button>
    </div>

    <!-- ============ HERO ============ -->
    <section class="hero relative overflow-hidden min-h-screen flex items-center pt-24 pb-16">
      <div class="absolute inset-0 z-0 overflow-hidden">
        <div
          class="orb animate-orb-float"
          style="width:600px;height:600px;top:-10%;left:-10%;background:radial-gradient(circle, rgba(45,212,191,0.32), transparent 70%);"
        />
        <div
          class="orb animate-orb-float"
          style="width:500px;height:500px;bottom:-15%;right:-5%;animation-direction:reverse;animation-duration:20s;background:radial-gradient(circle, rgba(110,231,183,0.22), transparent 70%);"
        />
        <div
          class="orb animate-orb-float"
          style="width:300px;height:300px;top:40%;right:30%;animation-delay:3s;animation-duration:18s;background:radial-gradient(circle, rgba(52,211,153,0.15), transparent 70%);"
        />
      </div>

      <div class="relative z-10 max-w-[1200px] mx-auto px-6 w-full">
        <div class="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div
              class="inline-flex items-center gap-2 px-4 h-8 rounded-full border border-white/10 bg-surface/60 backdrop-blur text-[13px] text-ink-500 mb-7"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_#34d399] animate-pulse-dot" />
              全新 2.0 版本已上线
            </div>
            <h1 class="font-display font-extrabold leading-[1.15] text-[clamp(2.4rem,5vw,3.8rem)] mb-6">
              输入想法，<br />
              <span class="text-gradient">AI 帮你做 PPT</span>
            </h1>
            <p class="text-[17px] text-ink-500 leading-[1.8] mb-10 max-w-[480px]">
              告别熬夜排版。只需输入主题或上传文档，智演 AI 即刻生成专业级演示文稿——从内容大纲到视觉设计，全流程自动化。
            </p>
            <div class="flex gap-4 flex-wrap">
              <button class="btn-shiny h-12 px-8 text-[15px]" @click="go">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                立即免费体验
              </button>
              <a href="#workflow" class="btn-outline-soft" @click.prevent="scrollTo('#workflow')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                观看演示
              </a>
            </div>
            <div class="flex gap-10 mt-12 pt-8 border-t border-white/10">
              <div>
                <div :ref="setCounterRef" data-target="1200000" data-suffix="+" class="font-display text-[28px] font-extrabold">0</div>
                <div class="text-[13px] text-ink-300 mt-0.5">累计用户</div>
              </div>
              <div>
                <div :ref="setCounterRef" data-target="98" data-suffix="%" class="font-display text-[28px] font-extrabold">0</div>
                <div class="text-[13px] text-ink-300 mt-0.5">满意度</div>
              </div>
              <div>
                <div :ref="setCounterRef" data-target="50" data-suffix="M+" class="font-display text-[28px] font-extrabold">0</div>
                <div class="text-[13px] text-ink-300 mt-0.5">生成页数</div>
              </div>
            </div>
          </div>

          <!-- Mockup -->
          <div class="relative animate-mockup-float">
            <div
              class="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full text-xs font-semibold text-white animate-badge-float bg-brand-gradient"
              style="box-shadow: 0 4px 20px rgba(45,212,191,0.4)"
            >AI 生成中</div>
            <div
              class="rounded-2xl overflow-hidden border"
              style="background:#08141a;border-color:rgba(45,212,191,0.15);box-shadow:0 0 0 1px rgba(45,212,191,0.05),0 20px 60px rgba(0,0,0,0.5),0 0 80px rgba(45,212,191,0.10);"
            >
              <div class="flex items-center gap-2 px-5 py-3.5 bg-elevated/80 border-b border-white/5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span class="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span class="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div class="grid min-h-[340px]" style="grid-template-columns:120px 1fr 180px;">
                <!-- sidebar -->
                <div class="p-4 flex flex-col gap-2.5 bg-canvas/60 border-r border-white/5">
                  <div
                    v-for="(g, i) in [
                      'linear-gradient(135deg,#1e1b4b,#312e81)',
                      'linear-gradient(135deg,#1e1b4b,#3b0764)',
                      'linear-gradient(135deg,#042f2e,#134e4a)',
                      'linear-gradient(135deg,#1c1917,#44403c)',
                      'linear-gradient(135deg,#172554,#1e3a5f)'
                    ]"
                    :key="i"
                    class="aspect-[16/10] rounded-md relative overflow-hidden"
                    :style="{ background: g }"
                    :class="i === 0 ? 'outline outline-2 outline-brand-500 outline-offset-2' : ''"
                  >
                    <div class="absolute inset-0 border border-white/10 rounded-md" />
                  </div>
                </div>
                <!-- canvas -->
                <div class="p-5 flex items-center justify-center">
                  <div
                    class="w-full aspect-[16/9] rounded-lg relative overflow-hidden"
                    style="background:linear-gradient(135deg,#0d2b2e 0%,#06181c 100%);box-shadow:0 8px 32px rgba(0,0,0,0.45);"
                  >
                    <div class="absolute h-3.5 rounded bg-white/85" style="top:28%;left:10%;width:55%;" />
                    <div class="absolute h-2 rounded bg-white/30" style="top:44%;left:10%;width:40%;" />
                    <div class="absolute h-1.5 rounded bg-white/10" style="top:56%;left:10%;width:70%;" />
                    <div class="absolute h-1.5 rounded bg-white/10" style="top:64%;left:10%;width:50%;" />
                    <div
                      class="absolute rounded-md border"
                      style="bottom:12%;right:8%;width:35%;height:40%;background:linear-gradient(180deg,rgba(45,212,191,0.22) 0%,rgba(45,212,191,0.05) 100%);border-color:rgba(45,212,191,0.18);"
                    />
                  </div>
                </div>
                <!-- ai panel -->
                <div class="p-3 flex flex-col gap-3 bg-canvas/60 border-l border-white/5">
                  <div class="font-mono text-[10px] text-brand-400 tracking-widest uppercase">AI 助手</div>
                  <div class="rounded-lg p-2.5 bg-brand-500/[0.06] border border-brand-500/10 space-y-1.5">
                    <div class="h-1.5 rounded bg-white/10" style="width:80%" />
                    <div class="h-1.5 rounded bg-white/10" style="width:60%" />
                    <div class="h-1.5 rounded bg-white/10" style="width:70%" />
                  </div>
                  <div class="rounded-lg p-2.5 bg-brand-500/[0.06] border border-brand-500/10 space-y-1.5">
                    <div class="h-1.5 rounded bg-white/10" style="width:80%" />
                    <div class="h-1.5 rounded bg-white/10" style="width:60%" />
                  </div>
                  <div class="flex items-center gap-2 text-[11px] font-mono text-brand-400">
                    生成中
                    <span class="inline-flex gap-1">
                      <span class="w-1 h-1 rounded-full bg-brand-400 animate-gen-bounce" />
                      <span class="w-1 h-1 rounded-full bg-brand-400 animate-gen-bounce" style="animation-delay:0.2s" />
                      <span class="w-1 h-1 rounded-full bg-brand-400 animate-gen-bounce" style="animation-delay:0.4s" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ LOGOS ============ -->
    <section class="py-20 text-center">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="text-[13px] text-ink-300 mb-8 tracking-wide">已获得行业领先企业的信赖</div>
        <div class="flex items-center justify-center gap-12 flex-wrap opacity-40 font-display text-lg font-bold">
          <span>ByteForge</span>
          <span>CloudNest</span>
          <span>DataPulse</span>
          <span>Nexora</span>
          <span>QuantumLeaf</span>
          <span>SynthWave</span>
        </div>
      </div>
    </section>

    <!-- ============ FEATURES ============ -->
    <section id="features" class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="reveal text-center mb-16 max-w-[640px] mx-auto">
          <div class="section-tag">核心功能</div>
          <h2 class="section-title">为什么选择智演 AI</h2>
          <p class="text-[17px] text-ink-500">六大 AI 驱动能力，覆盖演示文稿从构思到交付的全生命周期</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(f, i) in features"
            :key="i"
            class="reveal feature-card relative bg-surface rounded-2xl p-9 border border-white/5 transition-all duration-500 hover:-translate-y-1 hover:bg-elevated overflow-hidden"
            style="will-change: transform"
          >
            <div
              class="w-13 h-13 rounded-2xl grid place-items-center mb-6"
              :style="{ background: f.tone }"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="f.stroke" stroke-width="1.8">
                <template v-if="f.grid">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </template>
                <template v-else-if="f.magic">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </template>
                <template v-else-if="f.layout">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </template>
                <template v-else-if="f.globe">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </template>
                <template v-else-if="f.team">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </template>
                <template v-else>
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                  <path d="M8.56 13a8 8 0 0 0-2.3 3.08" />
                  <path d="M15.44 13a8 8 0 0 1 2.3 3.08" />
                </template>
              </svg>
            </div>
            <h3 class="font-display text-lg font-bold mb-2.5">{{ f.title }}</h3>
            <p class="text-sm text-ink-500 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ WORKFLOW ============ -->
    <section id="workflow" class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="reveal text-center mb-20 max-w-[640px] mx-auto">
          <div class="section-tag">使用流程</div>
          <h2 class="section-title">三步，完成一套专业 PPT</h2>
          <p class="text-[17px] text-ink-500">无需设计经验，从想法到成品只需极简三步</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8 relative">
          <div class="hidden md:block absolute top-9 left-[calc(33.33%-16px)] right-[calc(33.33%-16px)] h-0.5 bg-gradient-to-r from-brand-500 to-success opacity-30" />
          <div
            v-for="(step, i) in [
              { num: '01', title: '描述你的想法', desc: '输入主题、上传文档或粘贴大纲，告诉 AI 你想讲什么', color: 'brand-500' },
              { num: '02', title: 'AI 自动生成', desc: 'AI 分析内容结构，自动生成文案、配图、排版，60秒完成', color: 'brand-400' },
              { num: '03', title: '导出与分享', desc: '支持 PPT、PDF、在线演示等多种格式，一键分享给团队', color: 'success' }
            ]"
            :key="i"
            class="reveal text-center relative z-10"
          >
            <div
              class="w-[72px] h-[72px] rounded-full grid place-items-center mx-auto mb-7 font-display text-[28px] font-extrabold border-2"
              :style="{
                background: i === 0 ? 'rgba(45,212,191,0.10)' : i === 1 ? 'rgba(110,231,183,0.10)' : 'rgba(52,211,153,0.10)',
                borderColor: i === 0 ? 'rgba(45,212,191,0.22)' : i === 1 ? 'rgba(110,231,183,0.22)' : 'rgba(52,211,153,0.22)',
                color: i === 0 ? '#5eead4' : i === 1 ? '#6ee7b7' : '#34d399'
              }"
            >{{ step.num }}</div>
            <h3 class="font-display text-xl font-bold mb-3">{{ step.title }}</h3>
            <p class="text-sm text-ink-500 max-w-[280px] mx-auto leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ SHOWCASE ============ -->
    <section class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="reveal text-center mb-16 max-w-[640px] mx-auto">
          <div class="section-tag">模板精选</div>
          <h2 class="section-title">为每个场景准备的专业设计</h2>
          <p class="text-[17px] text-ink-500">从商业计划到学术报告，海量精品模板等你探索</p>
        </div>
        <div class="reveal grid grid-cols-2 md:grid-cols-4 gap-5">
          <div
            v-for="(g, i) in showcaseGradients"
            :key="i"
            class="aspect-[16/11] rounded-xl relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] border border-white/5 group"
            :style="{ background: g }"
            @click="go"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span class="absolute bottom-3.5 left-3.5 text-xs font-medium text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">{{ showcaseLabels[i] }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PRICING ============ -->
    <section id="pricing" class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="reveal text-center mb-5 max-w-[640px] mx-auto">
          <div class="section-tag">定价方案</div>
          <h2 class="section-title">简单透明，按需选择</h2>
          <p class="text-[17px] text-ink-500">无论个人还是企业，总有适合你的方案</p>
        </div>
        <div class="reveal flex items-center justify-center gap-3.5 mt-10 mb-14">
          <span class="text-sm transition-colors" :class="!yearly ? 'text-ink-900' : 'text-ink-500'">月付</span>
          <button
            class="w-12 h-[26px] rounded-full relative transition-colors border"
            :class="yearly ? 'bg-brand-500 border-brand-500' : 'bg-surface border-white/10'"
            @click="yearly = !yearly"
            aria-label="切换年付月付"
          >
            <span
              class="block w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform"
              :style="{ transform: yearly ? 'translateX(22px)' : 'translateX(2px)' }"
            />
          </button>
          <span class="text-sm transition-colors" :class="yearly ? 'text-ink-900' : 'text-ink-500'">
            年付 <span class="text-success text-xs">省 20%</span>
          </span>
        </div>
        <div class="grid md:grid-cols-3 gap-6 items-start">
          <div
            v-for="(p, i) in pricing"
            :key="i"
            class="reveal pricing-card relative bg-surface border rounded-2xl p-10 transition-all duration-500 hover:-translate-y-1"
            :class="p.featured ? 'border-brand-500/30' : 'border-white/5'"
            :style="p.featured ? 'background:linear-gradient(180deg, rgba(45,212,191,0.06) 0%, rgb(var(--bg-surface)) 50%);' : ''"
          >
            <div
              v-if="p.featured"
              class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-brand-gradient"
            >最受欢迎</div>
            <div class="font-display text-base font-bold mb-2">{{ p.plan }}</div>
            <div class="text-[13px] text-ink-300 mb-6">{{ p.desc }}</div>
            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-xl font-semibold">¥</span>
              <span class="font-display text-5xl font-extrabold leading-none">
                {{ yearly ? p.yearly : p.monthly }}
              </span>
              <span v-if="p.period && p.period !== '永久免费'" class="text-sm text-ink-300">{{ p.period }}</span>
            </div>
            <div class="text-[13px] text-ink-300">
              {{ p.monthly === 0 ? p.period : (yearly ? '按年计费' : '按月计费') }}
            </div>
            <div class="h-px bg-white/5 my-7" />
            <div class="flex flex-col gap-3.5 mb-8">
              <div v-for="(feat, fi) in p.features" :key="fi" class="flex items-start gap-2.5 text-sm text-ink-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" class="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12" /></svg>
                {{ feat }}
              </div>
            </div>
            <button
              class="w-full h-12 rounded-md font-medium transition-all"
              :class="p.featured ? 'btn-shiny' : 'btn-outline-soft'"
              @click="go"
            >{{ p.cta }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ TESTIMONIALS ============ -->
    <section id="testimonials" class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="reveal text-center mb-16 max-w-[640px] mx-auto">
          <div class="section-tag">用户评价</div>
          <h2 class="section-title">他们都在用智演 AI</h2>
          <p class="text-[17px] text-ink-500">来自各行业用户的真实反馈</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="(t, i) in testimonials"
            :key="i"
            class="reveal bg-surface border border-white/5 rounded-2xl p-9 transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/20"
          >
            <div class="flex gap-1 mb-5">
              <svg v-for="s in 5" :key="s" width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <p class="text-[15px] text-ink-500 leading-[1.8] mb-6">"{{ t.text }}"</p>
            <div class="flex items-center gap-3.5">
              <div class="w-[42px] h-[42px] rounded-full grid place-items-center font-bold text-white" :style="{ background: t.grad }">
                {{ t.avatar }}
              </div>
              <div>
                <div class="text-sm font-semibold">{{ t.name }}</div>
                <div class="text-xs text-ink-300">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ CTA BANNER ============ -->
    <section class="py-32">
      <div class="max-w-[1200px] mx-auto px-6">
        <div
          class="reveal relative rounded-3xl text-center overflow-hidden"
          style="
            padding: 80px 60px;
            background: linear-gradient(135deg, rgba(45,212,191,0.14) 0%, rgba(52,211,153,0.06) 100%);
            border: 1px solid rgba(45,212,191,0.18);
          "
        >
          <div class="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full" style="background:radial-gradient(circle,rgba(45,212,191,0.18),transparent 70%)" />
          <div class="absolute -bottom-20 -left-16 w-[300px] h-[300px] rounded-full" style="background:radial-gradient(circle,rgba(52,211,153,0.12),transparent 70%)" />
          <div class="relative z-10">
            <h2 class="font-display font-extrabold leading-tight mb-4 text-[clamp(2rem,4vw,2.8rem)]">
              准备好用 AI 重新定义演示了吗？
            </h2>
            <p class="text-base text-ink-500 max-w-[480px] mx-auto mb-9">
              加入 120 万+ 用户的选择，让每一次演示都成为专业级呈现。注册即享免费额度，无需绑定信用卡。
            </p>
            <div class="flex gap-4 justify-center flex-wrap">
              <button class="btn-shiny h-12 px-8 text-[15px]" @click="go">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                免费开始使用
              </button>
              <button class="btn-outline-soft" @click="go">预约产品演示</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ FOOTER ============ -->
    <footer class="border-t border-white/5 pt-20 pb-10">
      <div class="max-w-[1200px] mx-auto px-6">
        <div class="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-16">
          <div>
            <div class="flex items-center gap-2.5 font-display font-extrabold text-[22px]">
              <span class="w-9 h-9 rounded-[10px] grid place-items-center text-white text-lg font-black bg-brand-gradient">S</span>
              智演 AI
            </div>
            <p class="text-sm text-ink-500 mt-4 leading-relaxed max-w-[280px]">
              下一代 AI 演示文稿生成平台，让创意即刻呈现。
            </p>
          </div>
          <div>
            <h4 class="font-display text-sm font-bold mb-5">产品</h4>
            <a v-for="x in ['功能介绍','模板市场','定价方案','更新日志','API 接口']" :key="x" href="#" class="block text-sm text-ink-500 hover:text-ink-900 py-1.5 transition-colors">{{ x }}</a>
          </div>
          <div>
            <h4 class="font-display text-sm font-bold mb-5">资源</h4>
            <a v-for="x in ['帮助中心','使用教程','设计博客','社区论坛','合作伙伴']" :key="x" href="#" class="block text-sm text-ink-500 hover:text-ink-900 py-1.5 transition-colors">{{ x }}</a>
          </div>
          <div>
            <h4 class="font-display text-sm font-bold mb-5">公司</h4>
            <a v-for="x in ['关于我们','加入团队','隐私政策','服务条款','联系我们']" :key="x" href="#" class="block text-sm text-ink-500 hover:text-ink-900 py-1.5 transition-colors">{{ x }}</a>
          </div>
        </div>
        <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-[13px] text-ink-300">© 2026 智演 AI. All rights reserved.</div>
          <div class="flex gap-4">
            <a v-for="x in ['Twitter','GitHub','微信']" :key="x" href="#" :aria-label="x" class="w-9 h-9 rounded-[10px] border border-white/10 grid place-items-center hover:border-brand-500 hover:bg-brand-500/10 transition-all">
              <span class="text-xs text-ink-500">{{ x.slice(0, 2) }}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.section-tag {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--brand-400));
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.section-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--brand-500));
  box-shadow: 0 0 10px rgb(var(--brand-500));
}
.section-title {
  font-family: 'Syne', 'Noto Sans SC', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
}
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.45), rgba(52, 211, 153, 0.4));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.feature-card:hover::before {
  opacity: 1;
}
.w-13 {
  width: 52px;
}
.h-13 {
  height: 52px;
}
</style>
