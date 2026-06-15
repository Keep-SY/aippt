# AI PPT 生成系统 — UI/UX 设计文档

> Vue 3 + TypeScript + Fabric.js · 对标 Kimi PPT / WPS AI PPT
> 设计语言：Glassmorphism 2.0 + 现代极简 + 微动效驱动

---

## 1. 产品定位与核心流程

**一句话定义**：用户输入一个想法 → AI 生成大纲 → 选择模板 → 生成可编辑 PPT → 在画布上微调 → 导出。

### 核心用户旅程（Happy Path）

```
[Landing] → [Prompt 输入]
    ↓
[Outline 大纲生成 & 编辑] ← AI 重写 / 增删章节
    ↓
[Template Picker 模板选择]
    ↓
[Generating 全屏进度] · 流式展示每页生成
    ↓
[Editor 编辑器]
    ├─ 左：Slide 缩略图列表（拖拽排序）
    ├─ 中：Fabric.js 画布
    ├─ 右：属性面板（对象 / AI 助手切换）
    └─ 顶：撤销/重做、播放、导出
    ↓
[Export] PDF / PPTX / 图片 / 分享链接
```

### 二级页面
- **My Decks** — 我的演示稿（卡片网格 + 最近编辑）
- **Templates** — 模板市场
- **Account** — 套餐 / 用量 / 设置

---

## 2. 设计语言（Design Tokens）

### 2.1 色彩系统

```css
/* —— 主品牌色：电光紫 → 极光蓝渐变 —— */
--brand-gradient: linear-gradient(135deg, #7C5CFF 0%, #4FA8FF 100%);
--brand-500: #7C5CFF;     /* 主操作 */
--brand-400: #9B7FFF;     /* 悬停 */
--brand-600: #5E3DE5;     /* 按下 */

/* —— 中性色（暖灰，避免纯黑） —— */
--ink-900: #0F1226;       /* 主文字（深空蓝紫，非纯黑）*/
--ink-700: #2A2F4A;
--ink-500: #6B7088;
--ink-300: #B8BCD0;
--ink-100: #EDEEF5;

/* —— 背景层（玻璃拟态分层） —— */
--bg-canvas:  #F7F8FC;    /* 应用底层 */
--bg-surface: #FFFFFFCC;  /* 卡片（80% 透明 + blur）*/
--bg-elevated:#FFFFFFE6;
--bg-glass:   rgba(255,255,255,0.6);
--border-hairline: rgba(15, 18, 38, 0.08);  /* 1px 极细边 */

/* —— 暗色模式 —— */
--dark-canvas:  #0B0D1A;
--dark-surface: rgba(255,255,255,0.04);
--dark-glass:   rgba(255,255,255,0.06);
--dark-border:  rgba(255,255,255,0.08);

/* —— 语义色 —— */
--success: #10B981;
--warning: #F59E0B;
--danger:  #EF4444;
--info:    #4FA8FF;
```

### 2.2 字体

```css
--font-sans: "Inter", "PingFang SC", "Microsoft YaHei", system-ui;
--font-mono: "JetBrains Mono", "SF Mono", monospace;

/* 字号阶梯（黄金比例近似） */
--text-xs:   12px;
--text-sm:   13px;
--text-base: 14px;
--text-md:   16px;
--text-lg:   20px;
--text-xl:   28px;
--text-2xl:  40px;   /* Hero */
--text-3xl:  56px;   /* Landing big claim */
```

### 2.3 间距 / 圆角 / 阴影

```css
/* 间距：4 / 8 / 16 / 24 / 32 / 48 / 64 */
/* 圆角：统一语义 */
--r-sm: 8px;     /* 输入框、Tag */
--r-md: 12px;    /* 按钮、小卡片 */
--r-lg: 16px;    /* 弹窗、面板 */
--r-xl: 24px;    /* 大卡片、Hero 容器 */
--r-full: 9999px;

/* 柔和阴影（弥散 + 彩色透光） */
--shadow-sm: 0 1px 2px rgba(15,18,38,0.04);
--shadow-md: 0 8px 24px -8px rgba(15,18,38,0.10);
--shadow-lg: 0 24px 60px -16px rgba(124,92,255,0.18);
--shadow-glow: 0 0 0 4px rgba(124,92,255,0.16); /* focus ring */

/* 玻璃拟态 */
--glass: { backdrop-filter: blur(20px) saturate(140%); }
```

### 2.4 动效曲线

```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--dur-fast: 120ms;
--dur-base: 220ms;
--dur-slow: 420ms;
```

---

## 3. 关键页面设计

### 3.1 Landing / Prompt 首页

**布局**：垂直 Z 型扫读，Hero 居中聚焦。

```
┌──────────────────────────────────────────────────┐
│  Logo            Templates  Pricing  [Sign in]   │  ← 顶部导航：玻璃浮条
├──────────────────────────────────────────────────┤
│                                                  │
│        ✨ AI · Slide Studio                      │  ← 小徽章（gradient border）
│                                                  │
│      用一句话，生成一份发布会级 PPT              │  ← Hero (text-3xl, 渐变文字)
│      Powered by Kimi · GPT · Claude              │
│                                                  │
│   ┌────────────────────────────────────────┐    │
│   │  例如：用 12 页讲清楚 AI Agent 的       │    │  ← 主输入框（圆角 24px）
│   │  现状、技术栈与未来趋势 ...             │    │     超大、内嵌 Shiny Button
│   │                                         │    │
│   │  📎 上传文档  🎨 风格   📄 12页 ▾   [生成 →] │
│   └────────────────────────────────────────┘    │
│                                                  │
│   💡 试试： 季度复盘 · 产品发布 · 学术答辩 · 路演 │  ← Quick Suggestions Chips
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│   [Bento Grid · 3×2 不对称展示]                  │  ← 功能展示
│   ┌──────────┬──────┬──────┐                    │
│   │ 大模型生成 │ 模板 │ 一键 │                    │
│   │  (大卡片) │ 切换 │ 美化 │                    │
│   ├──────────┼──────┴──────┤                    │
│   │  AI 改写 │  画布精修    │                    │
│   └──────────┴─────────────┘                    │
│                                                  │
│   [Marquee] · 客户 logo 滚动                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**关键动效**：
- Hero 文字逐字 fade-in（stagger 40ms）
- 输入框 focus 时 `box-shadow` 由 sm 过渡到 glow + 内部出现微光扫过
- 背景：极淡的 `Retro Grid` + 跟随鼠标的渐变光斑（30% 透明）
- "生成" 按钮：Shiny Button（渐变光从左到右循环 3s）

---

### 3.2 Outline 大纲编辑器

用户提交 prompt 后进入此页，**避免直接生成**全部 PPT，先校对结构。

```
┌──────────────────────────────────────────────────┐
│  ← 返回    AI 正在为你起草大纲...                  │
├──────────────────────────────────────────────────┤
│                                                  │
│   📝 演示标题                          [✏️ 重写]  │
│   ┌────────────────────────────────────┐        │
│   │ AI Agent 现状、技术栈与未来趋势      │        │
│   └────────────────────────────────────┘        │
│                                                  │
│   📚 大纲（可拖拽排序）                          │
│   ┌────────────────────────────────────┐        │
│   │ ⋮⋮ 1. 封面 · AI Agent 全景        ✕│        │
│   │   └─ 副标题：从 LLM 到自治系统     │        │
│   ├────────────────────────────────────┤        │
│   │ ⋮⋮ 2. 什么是 Agent？              ✕│        │
│   │   • 定义与边界                      │        │
│   │   • 与 Chatbot 的区别 [+ 添加要点]  │        │
│   ├────────────────────────────────────┤        │
│   │ ⋮⋮ 3. 技术栈拆解                   ✕│        │
│   │   ...                                │        │
│   └────────────────────────────────────┘        │
│                                                  │
│   [+ 添加章节]                                   │
│                                                  │
│   ─── 右下角悬浮 ───                              │
│   ┌────────────────────────┐                    │
│   │ 💬 让 AI 帮你调整：      │                    │
│   │ [更详细] [更精简] [换角度]│                    │
│   └────────────────────────┘                    │
│                                                  │
│  ────────────────────────────                    │
│  [上一步]              [选择模板 →]              │  ← Sticky Footer
└──────────────────────────────────────────────────┘
```

**交互**：
- 大纲流式生成时：每行从底部 8px 透明 → 滑入 + fade（spring）
- 拖拽：FLIP layout 动画，被拖项 scale(1.02) + shadow-lg
- 删除：`AnimatePresence` 高度收起 + opacity → 0
- 行内编辑：单击进入，Enter 保存，Esc 取消

---

### 3.3 Template Picker 模板选择

```
┌──────────────────────────────────────────────────┐
│  选择模板风格                       [跳过 →]      │
├────────────┬─────────────────────────────────────┤
│ 风格筛选   │   ┌──────┬──────┬──────┬──────┐    │
│ ─────      │   │      │      │      │      │    │
│ ☑ 商务     │   │ 预览 │ 预览 │ 预览 │ 预览 │    │  ← 16:9 缩略图
│ ☐ 科技     │   │  1   │  2   │  3   │  4   │    │     hover 时整张
│ ☐ 极简     │   │      │      │      │      │    │     scale(1.03) +
│ ☐ 教育     │   ├──────┼──────┼──────┼──────┤    │     shadow-lg
│ ☐ 创意     │   │      │      │      │      │    │
│            │   │  5   │  6   │  7   │  8   │    │  ← 选中态：渐变描边
│ 配色       │   └──────┴──────┴──────┴──────┘    │     2px brand-500
│ ●●●●●     │                                     │
│            │   [显示更多 ▾]                       │
└────────────┴─────────────────────────────────────┘
```

每个模板卡片右上角悬浮 "实时预览" 按钮 → 弹窗模态用当前大纲数据快速渲染前 3 页。

---

### 3.4 Generating 进度页（关键时刻）

> **设计原则**：等待时间是体验杀手，必须把它变成一场表演。

```
┌──────────────────────────────────────────────────┐
│              ✨ 正在为你打造演示稿                 │
│                                                  │
│         [大型环形进度 + 中心 % 数字]               │
│                                                  │
│  ✓ 解析提纲                                      │
│  ✓ 匹配模板                                      │
│  ⟳ 正在生成第 5 / 12 页 ...                      │ ← 当前步骤脉动光效
│  ○ 智能配图                                      │
│  ○ 排版优化                                      │
│                                                  │
│   ┌─────────────────────────────────────┐       │
│   │ [实时缩略图带：已生成的页面流式入场]  │       │  ← 已生成页的小卡
│   └─────────────────────────────────────┘       │     从右侧滑入
│                                                  │
│         "你知道吗？演示文稿应该 ..."              │  ← 趣味 Tip 轮播
└──────────────────────────────────────────────────┘
```

**视觉**：
- 背景：Beam Effect — 两条柔和光束从顶部斜下慢速移动
- 已生成的小卡片以 stagger 入场，鼠标悬停可放大预览，提前观看
- 进度数字使用 Number Ticker（数字滚动效果）

---

### 3.5 Editor 编辑器（核心生产页）

> 三栏结构 · 顶部工具条 · 底部状态栏

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] 标题  •  已保存                  ▶播放  ⤓导出  [👤] │ ← 顶部 56px
├──────┬──────────────────────────────────┬──────────────────┤
│      │                                  │                  │
│ ☐ 1  │                                  │  [Object][AI]   │ ← 右侧 320px
│ ☑ 2  │                                  │ ────────────────│
│ ☐ 3  │   ╔═══════════════════════════╗  │  ▣ 文本          │   双 Tab：
│ ☐ 4  │   ║                           ║  │  字体 ──────     │   - 对象属性
│ ☐ 5  │   ║      Fabric Canvas        ║  │  字号 16 ── 96   │   - AI 助手
│ ☐ 6  │   ║       (16:9 居中)         ║  │  色彩 ⬛⬛⬛⬛    │
│      │   ║                           ║  │  ────────────────│
│ +    │   ║                           ║  │  ▣ 对齐          │
│      │   ╚═══════════════════════════╝  │  ⤒ ⤓ ⇤ ⇥        │
│      │                                  │  ────────────────│
│      │   ◀  缩放 100% ──── ⊕ ⊖ ⤢      │  ✨ AI 改这页 ▾  │
├──────┴──────────────────────────────────┴──────────────────┤
│ Page 5 / 12   ·   1280×720   ·   ⌘Z 撤销   ·   💾 已同步     │ ← 状态条 28px
└────────────────────────────────────────────────────────────┘
```

#### 左侧：Slide 列表（宽 200px）
- 缩略图 16:9，圆角 8px，选中态：左侧 3px 渐变条 + 微光
- 拖拽排序、右键菜单（复制、删除、隐藏、重新生成本页）
- 底部固定 [+ 新页] 按钮

#### 中间：Fabric 画布
- 浅灰底（`bg-canvas`），画布白色卡片漂浮，shadow-lg
- 智能参考线：拖拽对齐时显示 1px 渐变青色虚线 + 像素距离 tag
- 选中对象：主色描边 + 8 个控制点（圆形，hover 放大 1.3x）
- **空白区右键** → 圆形扇形菜单（radial menu）：插入文本 / 图片 / 形状 / 图表 / AI

#### 顶部画布工具条（悬浮在画布上方）
```
[T 文字] [▢ 形状] [🖼 图片] [📊 图表] [✦ AI 元素]   |   [⤺] [⤻]   |   [≡ 图层]
```
胶囊形玻璃浮条，默认半透明，hover 整组实化。

#### 右侧面板 · AI Tab（重点）
```
┌──────────────────────┐
│ ✨ Slide Assistant    │
├──────────────────────┤
│ 当前选中：标题文本     │  ← 上下文感知
│                      │
│ 快捷操作：             │
│ [✏️ 改写]  [📝 扩写]   │
│ [📐 缩短]  [🌐 翻译]   │
│ [🎨 换风格] [🔍 纠错]  │
│                      │
│ ─── 或者直接对话 ───   │
│ ┌────────────────┐  │
│ │ 把这页改成更专业  │  │
│ │ 商务的语气...     │  │
│ └────────────────┘  │
│                  [→] │
│                      │
│ 历史：                │
│ • 优化第 3 页排版      │
│ • 重写封面副标题       │
└──────────────────────┘
```
- AI 输出以 diff 卡片形式呈现：原文（红删除）/ 新文（绿新增），用户 [接受][拒绝][重来]
- 整页改写时，画布出现 "正在重排" 半透明遮罩 + 内容流式渲染

---

### 3.6 我的演示稿 / 模板市场

标准卡片网格（响应式 4/3/2 列），每卡片：
- 16:9 缩略图（hover 时切换为前 4 页轮播）
- 标题、修改时间、页数 tag
- 右上悬浮：⋯ 菜单（重命名 / 复制 / 删除 / 导出）
- 删除使用 Soft Confirm（按钮变红 + 二次点击）

---

## 4. 组件库清单（Vue 3 + TS）

> 建议基于 **shadcn-vue** + **Reka UI** + **VueUse Motion**（Framer Motion 等价物）

### 基础（Atom）
| 组件 | 用途 | 状态 |
|---|---|---|
| `<AppButton variant="primary\|ghost\|shiny" size>` | 通用按钮 | hover / active / loading / disabled |
| `<AppInput>` `<AppTextarea>` | 输入 | focus glow |
| `<AppChip>` | 标签 / 建议 | removable |
| `<AppAvatar>` | 用户头像 | |
| `<AppTooltip>` | 提示 | 玻璃质感 |
| `<AppDropdown>` | 下拉 | |
| `<AppDialog>` `<AppDrawer>` | 弹窗 | enter spring / exit fade |
| `<AppToast>` | 通知 | 右上堆叠 |

### 业务（Molecule）
| 组件 | 描述 |
|---|---|
| `<PromptHero>` | Landing 巨型输入框，含上传/风格/页数控件 |
| `<OutlineEditor>` | 可拖拽大纲，使用 [vuedraggable-next] |
| `<OutlineNode>` | 单个章节，行内编辑 + AI 重写按钮 |
| `<TemplateCard>` | 模板卡，hover 预览 |
| `<TemplateGrid>` | 模板网格 + 筛选 |
| `<GenerationProgress>` | 进度环 + 步骤列表 + 缩略带 |
| `<SlideThumbnail>` | 左侧 slide 缩略 |
| `<SlideList>` | 拖拽排序的 slide 列表 |
| `<CanvasStage>` | Fabric 容器 wrapper（封装 zoom/grid/guides） |
| `<CanvasToolbar>` | 浮动工具条 |
| `<PropertyPanel>` | 右侧属性面板（Tab 切换） |
| `<AIChat>` | AI 对话面板（流式 markdown 渲染） |
| `<DiffCard>` | AI 改写 diff 展示 |
| `<DeckCard>` | 我的演示稿卡片 |
| `<RadialMenu>` | 画布右键扇形菜单 |
| `<ContextMenu>` | 通用右键菜单 |
| `<ExportDialog>` | 导出弹窗（PDF/PPTX/PNG） |

### 视觉装饰
| 组件 | 描述 |
|---|---|
| `<RetroGrid>` | 透视网格背景 |
| `<BeamBackground>` | 移动光束 |
| `<MarqueeRow>` | 滚动 logo |
| `<ShinyText>` | 渐变扫光文字 |
| `<NumberTicker>` | 数字滚动 |
| `<BentoGrid>` `<BentoCard>` | 不对称网格 |

---

## 5. Fabric.js 画布架构要点

```typescript
// canvas/useCanvas.ts
interface SlideElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'icon'
  fabricObject: fabric.Object
  meta: { editable: boolean; aiTag?: string } // aiTag 标记此元素是否由 AI 生成
}

// 关键模块拆分
canvas/
├── useCanvas.ts          // Fabric 实例 + 双向绑定 Pinia store
├── useSelection.ts       // 选中态、多选、群组
├── useSnapGuide.ts       // 智能参考线（对齐 / 等距）
├── useHistory.ts         // 撤销/重做（基于 JSON 序列化快照）
├── useClipboard.ts       // 复制/粘贴
├── useShortcut.ts        // 键盘快捷键（⌘C/V/Z/⇧Z/Del/方向键）
├── useExport.ts          // 导出 PNG（toDataURL）/ PDF（jspdf）/ PPTX（pptxgenjs）
└── plugins/
    ├── grid.ts           // 标尺 + 网格
    ├── ruler.ts
    └── aiEditPlugin.ts   // AI 改写时高亮被编辑的对象
```

**关键交互**：
- **缩放**：Cmd/Ctrl + 滚轮（中心点跟随鼠标）
- **拖拽画布**：空格 + 拖拽（hand cursor）
- **多选**：拖框选择，Shift + 点击加选
- **吸附阈值**：8px 内吸附到对象边缘 / 中线 / 间距均分

---

## 6. 微交互 & 动效准则（务必落地）

| 场景 | 动效 |
|---|---|
| 按钮 hover | scale(1.02) · 220ms ease-out · shadow-md → shadow-lg |
| 按钮 press | scale(0.97) · 120ms |
| 卡片 hover | translateY(-4px) · shadow-md → shadow-lg |
| 弹窗入场 | scale(0.96) + opacity 0 → 1 · spring · 320ms |
| 弹窗退场 | scale(0.98) + opacity → 0 · 180ms |
| 列表新增 | height 0 + opacity 0 → 1 · stagger 40ms |
| 列表删除 | `AnimatePresence` 高度坍塌 + 模糊消散 |
| Toast | 从右上滑入，5s 后自动 fade |
| 切换 Tab | 下划线 layout 动画（共享 `layoutId`） |
| AI 流式输出 | 字符逐 token 渲染，光标闪烁 |
| 加载占位 | Skeleton 渐变扫光（不是转圈） |
| Focus | 主色 4px ring · 220ms |
| 拖拽 | 被拖项 cursor:grabbing + tilt(2deg) + shadow-lg |

---

## 7. 暗色模式

- 默认跟随系统，提供顶部 toggle
- 暗色下：玻璃面板降低亮度（`rgba(255,255,255,0.04)`），但保留 blur
- 主品牌色不变；语义色饱和度降低 10%
- 阴影换成 `inset` 高光 + 外部纯黑透明，避免发光过度

---

## 8. 响应式策略

- **桌面优先**：编辑器 ≥ 1280px 才完整展示三栏；1024–1279px 折叠右侧为浮层
- **平板**（768–1023px）：仅观看模式，可浏览/演示，编辑提示用桌面
- **移动端**（< 768px）：Landing + My Decks + 演示模式可用，编辑器跳转引导

---

## 9. 无障碍（A11y）

- 所有交互元素 ≥ 44×44px touch target
- 键盘可达：Tab 顺序合理、focus ring 醒目
- 色彩对比度 ≥ WCAG AA（4.5:1）
- ARIA labels 覆盖图标按钮
- 动效尊重 `prefers-reduced-motion`

---

## 10. 推荐的实现栈（与你的约束对齐）

```
Vue 3.4+ <script setup> + TypeScript 5
├─ Pinia              · 状态（slides / canvas / ai / user）
├─ Vue Router 4
├─ Fabric.js 6        · 画布（注意 6.x API 与 5.x 差异）
├─ TailwindCSS 3      · 原子化样式 + 设计 tokens（CSS vars）
├─ shadcn-vue / Reka  · headless 组件
├─ @vueuse/motion     · 动效（Framer Motion 等价）
├─ vuedraggable-next  · 拖拽排序
├─ @vueuse/core       · 工具集
├─ floating-vue       · Tooltip / Popover
├─ pptxgenjs          · 导出 PPTX
├─ jspdf / html2canvas · 导出 PDF
└─ marked + shiki     · AI 流式 markdown 渲染
```

---

## 11. 下一步建议

1. 用 Figma / 截图工具产出 **3 张关键页面**高保真稿：Landing、Outline、Editor
2. 搭建 **设计 token 文件**（`tokens.css` + `tailwind.config.ts`）
3. 先实现编辑器骨架与 Fabric 双向绑定，再接 AI 流
4. 把 "Generating 进度页" 当作品牌时刻精打细磨——它是用户最早形成 "高级感" 印象的地方

---

*本文档为 v0.1，建议在原型评审后迭代为 v1.0 与 Figma 双向对齐。*
