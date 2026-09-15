# Neon 主题使用说明

深色底 + 青蓝霓虹渐变 + 玻璃拟态 + 网格线条的 Hugo 博客主题，由 Ardot 设计稿 1:1 落地。
覆盖文章列表、文章详情、侧边栏（分类 / 标签 / 归档）、归档页、标签总览页。
**主题不包含任何作者 / 个人身份区块**：没有头像、作者名、个人简介、作者卡、联系方式或社交链接。
本仓库已按站点要求做过定制（2026-09-14）：**首页 Hero 顶栏与「置顶长文」板块整体移除**（首页现在只有「最新文章」列表 + 侧栏）、
**页脚整体移除**、**订阅入口全部移除**（导航栏按钮 + 侧栏订阅卡 + 文章页订阅卡）。细节见第三节。

- **不依赖任何前端框架、不依赖 Node**，只有一份 CSS + 一个 3KB 的 JS
- **中文走系统字体**，默认零外部请求（国内不会被墙）；想用原设计的 Sora / JetBrains Mono 打开一个开关即可
- **原 PaperMod 主题原样保留**，`hugo.toml` 改一行就能切回去

---

## 一、目录结构

```
praesepeee.github.io/              ← 仓库根目录就是 Obsidian 的 vault
├─ hugo.toml                       ← 已切到 theme = "neon"
├─ .obsidian/                      ← Obsidian 配置（只同步 app / appearance / core-plugins 等）
├─ .gitignore / .gitattributes     ← 选择性同步策略 + 跨平台行尾统一
├─ .github/workflows/hugo.yaml     ← push 后自动构建并部署到 GitHub Pages
├─ .github/scripts/transcode-videos.sh  ← 部署前把视频转成浏览器能播的格式
├─ content/
│  ├─ archives.md                  ← 归档（layout = 'archives'）
│  └─ posts/                       ← 文章：一篇一个目录（Hugo Page Bundle）
│     ├─ 示例文章/
│     │  ├─ index.md               ← 正文
│     │  ├─ cover.png              ← 封面（可选）
│     │  └─ 插图.png               ← 图片 / PDF / 视频都与 index.md 并列
│     └─ 另一篇/
│        ├─ index.md
│        └─ photo.webp
└─ themes/
   ├─ PaperMod/                    ← 原主题，一个字节都没动
   └─ neon/                        ← 新主题
      ├─ theme.toml
      ├─ assets/
      │  ├─ css/
      │  │  ├─ tokens.css          ← ★ 颜色/圆角/间距/字体全在这里，改主题只改这个文件
      │  │  ├─ base.css            ← 重置、排版、容器、背景氛围、导航、页脚
      │  │  ├─ components.css      ← 按钮、卡片、列表、侧栏、正文、目录、分页、留言
      │  │  ├─ chroma.css          ← 代码高亮配色（青/蓝/紫三色）
      │  │  └─ light.css           ← 浅色模式覆盖
      │  └─ js/main.js             ← 主题切换 / 移动菜单 / 目录高亮 / 代码复制 / 滚动动画
      └─ layouts/
         ├─ baseof.html            ← 全站骨架
         ├─ index.html             ← 首页：最新文章列表 + 侧栏（Hero 与「置顶长文」已移除）
         ├─ 404.html
         ├─ _default/
         │  ├─ list.html           ← 分区列表（分类页 / 标签页自动复用同一个模板）
         │  ├─ single.html         ← 文章详情：头部 → 封面 → 正文 + 右栏 → 留言
         │  ├─ terms.html          ← 标签 / 分类总览（标签云 + 计数）
         │  └─ archives.html       ← 归档页（按年份分组）
         └─ partials/
            head.html   nav.html      footer.html   sidebar.html
            post-card.html featured.html toc.html   related.html
            subscribe.html pagination.html comments.html
            icon.html   img-url.html  post-content.html  excerpt.html
            extend_head.html  extend_footer.html
```

`post-content.html` 负责正文渲染（顺带兼容 Obsidian 的 `![[图片]]` 嵌入），
`excerpt.html` 负责列表摘要与 SEO 描述（会把图片路径剥干净）。

---

## 二、套用步骤

这套已经落到你的仓库里了。下面是复现步骤，换一台机器 / 换个仓库时照着做：

**第 1 步 · 放主题**
把 `themes/neon/` 整个目录复制过去（注意：`themes/PaperMod` 是 git submodule，`themes/neon` 是普通目录，会随主仓库一起提交）。

**第 2 步 · 改配置**
`hugo.toml` 里把主题名换掉，并补上导航菜单和 `[params]`（完整配置见文件内注释）：

```toml
theme = "neon"

[markup.highlight]
  noClasses = false      # 让代码高亮用 CSS 类，配色才能跟主题走

[[menus.main]]
  name = '首页'
  url = '/'
  weight = 10
# …归档 / 标签，见 hugo.toml
```

**第 3 步 · 建归档页**
归档页需要对应的内容文件才会生成：

```toml
# content/archives.md
+++
date = 2026-09-14
draft = false
title = '归档'
layout = 'archives'
+++
```

**第 4 步 · 本地预览**

```powershell
# 本机没装 Hugo，用便携版（路径固定）
& "C:\Users\Administrator\.workbuddy\binaries\hugo\_tmp\hugo.exe" server -D
# 打开 http://localhost:1313/
```

**第 5 步 · 构建 + 发布**

```powershell
cd C:\Users\Administrator\praesepeee.github.io
& "C:\Users\Administrator\.workbuddy\binaries\hugo\_tmp\hugo.exe" --minify --cleanDestinationDir
git add .
git commit -m "主题换成 Neon：新增 themes/neon，配置 hugo.toml，新增归档页"
git push
```

`public/` **不在版本库里**（见第四节的「选择性同步」）。本地想先看效果就跑一次
`hugo --minify` 生成 `public/`，用 `hugo server` 预览；上线由 CI 负责，push 即可。

---

## 三、配置速查表

全部写在 `hugo.toml` 的 `[params]` 下。

| 参数 | 作用 | 默认值 |
|---|---|---|
| `description` | 站点描述（SEO / OG） | — |
| `enableLightTheme` | 是否允许切换浅色模式 | `true` |
| `hero.title` | 首页 Hero 主标题 | —（**整块已移除**） |
| `fonts.useCDN` | 是否加载 Sora + JetBrains Mono | `false` |
| `search.enable` | 是否显示搜索图标 | `false` |
| `comments.provider` | `giscus` 或 `utterances` | 空 |
| `comments.syncTheme` / `themeDark` / `themeLight` / `theme` | 评论区配色是否跟随站点深/浅切换，以及两套主题名 | `true` / `dark_dimmed` / `light` / `preferred_color_scheme` |
| `comments.mapping` / `strict` / `reactionsEnabled` / `emitMetadata` / `inputPosition` / `lang` / `loading` | giscus 的其余属性 | 见「开启评论」一节 |
| `subscribeAction` / `subscribeLabel` / `subscribeTitle` / `subscribeDesc` | 订阅功能参数；**当前站点的所有入口已移除，填了也不会显示** | — |
| `footer.description` / `footer.columns` / `footerNote` | 页脚参数；**当前站点页脚整体未渲染** | — |

**首页 Hero 已整体移除**（2026-09-14）：`[params.hero]` 整块（`title` / `cta1`，以及更早删掉的 `eyebrow` / `subtitle` / `cta2`）都已从 `hugo.toml` 删除，`layouts/index.html` 里也不再渲染 hero 区块 —— **首页直接从「最新文章 + 侧栏」开始**，顶部间距来自 `.layout` 自带的 `padding-block: var(--section-y)`。想恢复就从 `git log` 取回参数与模板那两段。

**已移除的参数**（主题不再输出任何个人身份内容）：`author`、`authorRole`、`bio`、`avatar`、`aboutURL`、`social`、`about.*`。
文章详情页的署名行只保留日期 / 阅读时长 / 字数，作者卡整块删除；侧栏不再有「关于我」部件；页脚不再有社交按钮。
若确实需要恢复某一项，用 `git log` 找回对应提交后按原样加回 `hugo.toml` 与模板即可。

---

## 四、日常操作

### 写一篇文章

**一篇一个目录**（Hugo 的 Page Bundle），正文固定叫 `index.md`，图片 / PDF / 视频都**直接放在同一个目录里**（不分子目录）：

```text
content/posts/我的新文章/
├─ index.md           正文
├─ cover.png          封面（可选）
├─ photo-1.webp       插图
└─ guide.pdf          PDF、视频同理
```

`index.md` 的 front matter：

```toml
+++
date = 2026-09-14T21:00:00+08:00     # 带时分秒，同一天也能正确排序
draft = false
title = '我的新文章'
description = '一句话导语，会显示在标题下方和列表摘要里'
cover = 'cover.png'                   # 可选：封面，写文件名即可
categories = ['分类名']                # 可选
tags = ['标签一', '标签二']             # 可选
+++

正文用 Markdown 写，插图直接写文件名：

![图片说明](photo-1.webp)
```

> **排序与页面显示的发布时间，全部来自这里的 `date`** —— 不是文件创建时间，也不是 git 提交时间。
> 在手机上手动写 front matter 时**千万别留占位值**（例如 `date = 2026-09-14T12:00:00+08:00`）：
> 2026-09-14 就出过一次 —— 两篇手机文章都写了 `12:00:00`，结果按 12 点排到了当天文章的中间。
> 现在列表页 / 归档页 / 文章页都会显示「`2026.09.14 17:30`」这种精确到分钟的时间，
> 日期写错一眼就能看出来。嫌手动填麻烦就走「QuickAdd 一键新建」（模板会自动写入当前时间）。

> 目录名建议用英文（决定 URL）：`content/posts/my-post/index.md` → `/posts/my-post/`。
> 用中文目录名也能跑（`/posts/我的新文章/`），但链接里会是转义后的长串，不太好看。
> 也可以用 `slug = 'my-post'` 单独指定 URL。

> **不要**再把图片直接丢在 `content/posts/` 根目录 —— 那样会发布到 `/posts/xxx.png`，
> 而且文章里引用不到。图片一律放进对应文章的目录里。

> **排序提醒**：`date` 只写日期（如 `2026-09-13`）等价于当天 00:00，同一天的多篇会退化成按标题排序，最新发的反而垫底。写文章时带上时分秒最稳。另外 Hugo 默认跳过「未来日期」的文章。

### 分类与标签

主题没有独立的分类配置文件，靠 front matter 里写 `categories` / `tags` 自动生成：

- 侧边栏「分类」按文章数取前 4 个，「标签」按文章数取前 8 个
- `/categories/` 和 `/tags/` 是总览页（标签云 + 计数）
- 点进单个分类/标签，复用列表页模板
- 一个分类/标签都没有时，侧栏会显示「还没有分类」而不是空白
- 文章不写 `categories` 时，列表/封面上的分类标签回退成「随笔」（不会露出 `posts` 这个分区名）

### 封面图

`cover` 可以是本文章目录内的相对路径、`static/` 下的站内路径，或外链：

```toml
cover = 'cover.png'                    # 本文章目录内（推荐，写文件名即可）
cover = '/images/my-cover.jpg'         # static/images/ 下的全站图
cover = 'https://example.com/a.jpg'    # 外链
```

不写封面时，卡片和封面区会用**渐变 + 网格线条 + 光斑**生成一张抽象图 —— 这是设计稿的处理方式，比随便配张图更统一。缩略图按文章在列表中的位置在 4 套渐变里轮换。

文章详情页的封面上有个小标签，默认显示分类名，可以用 `coverCaption = '封面说明文字'` 覆盖。

### 用 Obsidian 写作

**仓库根目录就是 Obsidian 的 vault**（`.obsidian/` 在仓库根）。这样 vault 与 git 仓库重合，
手机端的 Git 插件能直接工作。

#### 一键新建（QuickAdd，推荐）

配置已随仓库同步（`Scripts/` 里的两个脚本 + `.obsidian/plugins/quickadd/data.json` 里的宏）。
流程是：**按快捷键 → 输入标题 → 文章目录和 `index.md` 自动建好，光标已经在正文里**。

1. **绑一次快捷键**：设置 → 快捷键（Hotkeys）→ 搜 `QuickAdd: 📝 新建博客` → 设为 `Ctrl + Alt + N`
   （安卓端没有快捷键，从命令面板或 QuickAdd 的侧边按钮触发）
2. 按快捷键，弹框里输入标题。中文、带空格都可以，例如 `Hugo 与 Obsidian 工作流`
3. 自动生成 `content/posts/Hugo-与-Obsidian-工作流/index.md`，`title` 与 `date` 已填好

宏由两个脚本组成，都在 `Scripts/new-post/`：

| 脚本 | 作用 |
|---|---|
| `01-prompt-title.js` | 弹输入框要标题，存进宏变量 `title`；留空或取消就中止，不会建出空目录 |
| `02-create-article.js` | 目录名安全化（去 `\/:*?"<>\|`、空格换连字符）→ 建目录 → 套 `Templates/Blog.md` → 填 `title` / `date` → 打开新文件 |

标题用**你输入的原文**（不是目录名），所以中文标题不会变成一串联字符。

> ⚠️ 脚本必须放在 `Scripts/` 这类**非隐藏目录**里。QuickAdd 的用户脚本是从 vault 里按路径读的，
> 放进 `.obsidian/` 读不到。
>
> ⚠️ **改 QuickAdd 配置请让 Obsidian 完全退出后再开**。`data.json` 是插件的内存态：
> 如果 Obsidian 还开着旧配置、你又去动了 QuickAdd 设置，它退出时会把内存里的旧值写回文件，
> 把磁盘上的改动覆盖掉。

#### 手动新建（Templater）

不装 QuickAdd 也能用，只是要多点两下：

1. 在文件列表里右键 `content/posts` → **New folder**，文件夹名就是文章的 URL（建议英文，如 `my-first-post`）
2. 在这个新文件夹里右键 → **New note**，命名为 **`index.md`**
3. Templater 会自动套用 `Templates/Blog.md`，把标题按**文件夹名**填好、日期填当前时间

> 为什么标题取文件夹名？因为正文固定叫 `index.md`，Templater 的 `tp.file.title` 只会给出
> `index` —— 直接用它会导致每篇文章都叫 "index"。模板里用 `tp.file.folder()` 取父目录名绕开了这一点。

Templater 需要这三项设置（已写进 `.obsidian/plugins/templater-obsidian/data.json`，请在设置页确认一遍）：

| 设置项 | 值 |
|---|---|
| Template folder location | `Templates` |
| Template matching mode | `Folder templates`（**会作用于子文件夹**，所以 `content/posts` 的规则对每篇文章目录都生效） |
| Folder Templates | folder = `content/posts`，template = `Templates/Blog.md` |

> 注意：`Folder templates` 是唯一能覆盖子目录的模式；Templater 没有 "all" 这个选项。
> 走 regex 模式要写 `.*`，覆盖范围会失控，不建议。

#### 附件放哪里

**附件与 `index.md` 放在同一个目录**，不再分子目录 —— Obsidian 的原生设置就能做到，
不需要任何插件：

```text
content/posts/my-first-post/
├─ index.md
├─ cover.png          封面
├─ screenshot.webp    插图
└─ guide.pdf          PDF / 视频 / 音频同样放这里
```

对应设置（已随仓库同步，`app.json` 里已设好）：

| 设置项 | 值 |
|---|---|
| 文件与链接 → 新附件的默认位置 | **当前文件所在文件夹**（即 `./`） |
| 使用 [[Wikilinks]] | **关闭**（`useMarkdownLinks: true`），插入标准 Markdown 链接 |

主题的正文渲染会**按后缀自动分派**，混在一起也不会出错。标准 Markdown 的 `![](文件名)`
和 Obsidian 的 `![[文件名]]` **两种写法都认**，渲染结果一样：

各类后缀分别渲染成什么，见下面「媒体怎么写进正文」一节的对照表。

> 两套语法走两条不同的实现：标准 Markdown 由 `_markup/render-image.html`
> （Hugo 的图片渲染钩子）在**渲染时**处理；`![[...]]` 是 Obsidian 私有语法、markdown 渲染器不认，
> 由 `partials/post-content.html` 在**渲染后**做替换。改这套规则时两边都要看。
> 另外钩子只转换上表里已知的后缀，避免把动态图片地址之类的链接误改成 `<a>`。

> 想把附件收进一个子目录（比如 `attachments/`）也支持 —— 把 Obsidian 的附件位置改成
> `./attachments` 即可，主题对子目录一视同仁。只是没必要，混放更省事。

#### 视频：放进去就能播（CI 会自动转码）

浏览器能不能播一个视频，看的**不是扩展名，是编码**。手机拍的默认是 HEVC / H.265，
Chrome / Edge / Firefox 桌面端在 Windows 上解不了 —— 表现就是页面上一个黑框、点了没反应。

所以 CI 在 `hugo` 构建之前会先跑一遍 `.github/scripts/transcode-videos.sh`，
把 `content/` 下的视频统一转成 **H.264 + AAC**（webm 转成 VP9 + Opus），
**文件名保持不变**，所以 Markdown 里的引用不用改：

| 原来的编码 | 处理结果 |
|---|---|
| H.264 + AAC | 只重封装一次，把索引挪到文件头（边下边播），几乎不耗时 |
| HEVC / H.265、MPEG-4、VP9 in mp4 … | 重新编码成 H.264 + AAC，超过 1080p 会顺带缩到 1080p |
| webm | 转成 VP9 + Opus；本来就是的话原样保留 |

- 转码结果按「文件路径 + 体积」的指纹缓存进 `.cache/transcoded`，
  视频没变时第二次构建直接还原，不用每次都重转
- 想强制重转：Actions 页面手动跑一次 Deploy Hugo，勾上 **force_transcode**
- 调画质 / 体积：改 `hugo.yaml` 里的 `MAX_HEIGHT` / `CRF` / `PRESET`
  （`CRF` 越小越清晰，18 已经很精细，28 明显变小；`PRESET` 换 `medium` 更省体积但更慢）

> **为什么不本地转好再传？** 也可以，但手机端 Obsidian 写完直接推，没有转码这一步。
> 放在 CI 里做，写作流程不用变。仓库里存的仍是原文件。
>
> **已知的取舍**：竖屏手机视频的**旋转信息**（rotate 元数据）在重新编码后会丢，
> 画面可能是横着的。遇到这种情况，本地转好再传，或在视频前后加一句说明。

#### 媒体怎么写进正文

两种写法**渲染结果完全一致**，用哪个都行：

```markdown
![说明](clip.mp4)      ← 标准 Markdown（推荐，Obsidian 里也能直接预览）
![[clip.mp4]]          ← Obsidian 嵌入语法（|别名、|300 会被忽略）
```

| 后缀 | 渲染成 |
|---|---|
| mp4 / m4v / mov / webm / mkv / avi … | `<video controls playsinline>` + 「点此下载」兜底链接 |
| mp3 / wav / m4a / aac / ogg / flac … | `<audio controls>` + 兜底链接 |
| pdf / doc(x) / xls(x) / ppt(x) / zip / rar / 7z / md / csv / json / txt | 文件链接 `<a class="file-embed">` |
| png / jpg / gif / webp / avif / svg … | `<img loading="lazy">` |
| 其它后缀 / 无后缀 / 外链图片 | 按普通 `<img>` 处理（不改写） |

地址会优先解析成本页 bundle 资源的绝对路径，所以中文文件名、附件在子目录、
文章被摘到首页时都不会拼出坏链接。

> 附件的**自动重命名**（把 `Pasted image 20260914.png` 改成有意义的名字）Obsidian 原生做不到，
> 需要额外插件；目前没装，保持默认命名。

#### 其余约定

- 主题对 `![[文件名]]` 嵌入也做了兼容（按文件名在**本文章目录内**查找，`|别名`、`|300` 会被忽略）；
  但 `[[另一篇文章]]` 这种**笔记间链接不支持**，嵌入的文件也必须在**本文章目录内**
- **front matter 用 TOML（`+++`）**，与现有文章一致。代价是 Obsidian 的「属性」面板
  不识别 TOML，front matter 只能在源码模式下手改

### 换电脑 / 用手机写博客（选择性同步）

`.gitignore` 按「对写博客有没有用」分了三类：

| | 内容 |
|---|---|
| **同步到 GitHub** | `content/`（文章与图片）、`Templates/`（Templater 模板）、`Scripts/`（QuickAdd 脚本）、`themes/neon/`、`hugo.toml`、`archetypes/`、`.github/`、`.gitattributes`、`.obsidian/` 的**有效配置**（`app.json` / `appearance.json` / `core-plugins.json` / `community-plugins.json`）与**已装插件本体及其设置** |
| **不同步：构建产物与缓存** | `public/`（CI 用 `hugo --minify` 现场重建并部署，没必要进仓库）、`resources/`、`.hugo_build.lock` |
| **不同步：个人状态与临时文件** | `.obsidian/workspace.json`、`workspace-mobile.json`、`hotkeys.json`、`graph.json`、`.obsidian/plugins/obsidian-git/data.json`（存 GitHub Token）、`.trash/`、`.workbuddy/`、`.DS_Store`、`Thumbs.db`、`*.tmp` `*.bak` `*.log` |

> 插件设置（含 Templater 的模板路径、附件路由规则）是**同步**的，这样换设备不用重配。
> 例外是 `obsidian-git` 的 `data.json` —— 它保存 GitHub Token，必须排除，每台设备各填一次。

`workspace.json` 记录的是「打开了哪些标签页、面板多宽」，属于设备自己的状态，
同步过去只会让手机和电脑互相打架，所以排除。

**手机端第一次配置**（以 Android / iOS 的 Obsidian 为例）：

1. 用 Git 客户端把仓库克隆到手机（iOS 可用 Working Copy，Android 可用 Termux / MGit）
2. 在 Obsidian 里「打开文件夹作为仓库」，选克隆下来的**仓库根目录**
3. 装社区插件 **Git**（Vinzent03/obsidian-git），在插件设置里填仓库、分支 `main`、GitHub 用户名与 Personal Access Token
4. 之后就是「打开即拉取、写完即提交推送」

> 安全提醒：`obsidian-git` 会把 Token 存在 `.obsidian/plugins/obsidian-git/data.json`。
> 这个文件**在忽略列表里**，不会被提交 —— 但也意味着每台设备要各自填一次 Token。别把它加回同步。

> 小提示：`themes/PaperMod` 是 git submodule。克隆时没拉 submodule 也不影响构建
> （当前主题是 `neon`，是普通目录）；CI 里用的是 `submodules: recursive`，会自动拉全。

### 置顶首页长文（已移除）

首页的「置顶长文」板块已于 2026-09-14 整体删除，`featured = true` **不再有任何效果** ——
所有文章都按 Hugo 默认顺序进入「最新文章」列表（新的在前），不再有单独抽出的置顶位，也不必再从列表里排除某一篇。
`partials/featured.html` 与 `.featured` / `.pin-section` 样式都保留着，想恢复就把那段模板加回 `layouts/index.html`。

### 换主题色 / 圆角 / 间距

只改 `themes/neon/assets/css/tokens.css`：

```css
:root {
  --accent:    #22d3ee;   /* 强调色，霓虹的感觉靠它 + 光晕 */
  --accent-2:  #5b8cff;   /* 渐变第二段 */
  --bg:        #060a12;   /* 页面底 */
  --r-card:    20px;      /* 卡片圆角 */
  --gutter:    96px;      /* 桌面左右留白 */
  --grid-size: 120px 130px;  /* 背景网格的格子大小 */
}
```

换成暖色（比如橙红霓虹）：`--accent: #ff8a3d; --accent-2: #ff5d73;`，其余光晕、按钮、发光条会跟着变。

### 换字体

默认中文用系统字体栈（`PingFang SC` / `Microsoft YaHei` / `Noto Sans SC` …），**零外部请求**。想还原设计稿里的等宽元信息：

```toml
[params.fonts]
  useCDN = true
```

如果 Google Fonts 加载慢，把 `url` 换成国内可用的镜像即可；或者把 woff2 放进 `static/fonts/` 自托管，再在 `tokens.css` 里改 `--font-mono`。

### 开启评论

留言区默认只显示一张「如何接入」的说明卡，**不会出现假的输入框**。接 giscus：

```toml
[params.comments]
  provider   = 'giscus'
  repo       = 'praesepeee/praesepeee.github.io'
  repoId     = 'R_xxxxxx'        # https://giscus.app 上生成
  category   = 'Announcements'
  categoryId = 'DIC_xxxxxx'
```

换成 `provider = 'utterances'` + `repo` 则用 Issues 承载评论。

**可选参数**（都有默认值，不写就是下面这样）：

```toml
  mapping    = 'pathname'   # 文章 ↔ Discussion 的对应方式，pathname 最稳（改标题不丢评论）
  strict     = false        # true 时标题也要完全一致才匹配，容易开出一堆重复 Discussion
  reactionsEnabled = true   # 显示 👍 之类的表情回应
  emitMetadata     = false  # 把 Discussion 描述塞进 <meta>
  inputPosition    = 'bottom'
  lang       = 'zh-CN'
  loading    = 'lazy'
  syncTheme  = true         # 评论区跟随站点右上角的深/浅切换
  themeDark  = 'dark_dimmed'   # syncTheme = true 时，深色用哪套
  themeLight = 'light'         # 浅色用哪套
  theme      = 'preferred_color_scheme'   # 仅 syncTheme = false 时生效
```

#### 评论区为什么不用 giscus 官方那段静态 `<script>`

官方片段里 `data-theme` 是写死的，而 giscus **只在 client.js 执行的那一刻读一次**。
本站的深浅色存在 `localStorage`、由 `<head>` 里的内联脚本在渲染前打到
`<html data-theme>` 上，Hugo 构建时不知道访客用的是哪套 —— 写死的结果就是
浅色访客先看到一个深色评论区，等 JS 纠正过来才变白。

所以 `partials/comments.html` 改成：内联脚本读当前 `<html data-theme>`，
再造出 giscus 的 `<script>` 标签，第一次加载就是对的颜色。
之后点右上角切换深浅色时，`assets/js/main.js` 里的 `giscusTheme()` 会
`postMessage` 通知 iframe 换肤（跨域 iframe 只能这么改）。

模板里那段内联 JS 有个坑：`jsonify` 的结果插进 `<script>` 必须再套 `safeJS`，
否则 html/template 会把它当字符串再转义一遍，输出 `var cfg = "{...}"` ——
语法上合法，但 `for...in` 会去遍历字符串下标，属性全设错。

### 开启订阅（当前站点已关闭）

**本仓库已把订阅入口全部移除**：导航栏的「订阅更新」按钮、侧栏订阅卡、文章页右栏订阅卡都不再渲染。
`partials/subscribe.html` 文件、`subscribe*` 参数都还留着，将来真要做这个功能时，
把调用加回 `nav.html` / `sidebar.html` / `single.html` 即可。

启用后填上服务商的表单地址就能真的收邮件（比如 Buttondown）：

```toml
subscribeAction = 'https://buttondown.email/api/emails/embed-subscribe/你的用户名'
```

不填时表单 action 是 `#`，点了会刷新页面 —— 不建议长期这样放线上。

### 页脚（当前站点已整体移除）

`baseof.html` 里不再调用 `partials/footer.html`，所以整块页脚（品牌 + 描述 + 浏览/订阅两栏 + 版权行）都不显示。
`footer.html` 与 `[params.footer]` 参数都保留着，想恢复只需在 `baseof.html` 的 `</main>` 之后加回一行
`{{- partial "footer.html" . -}}`。

页脚链接栏的自定义方式（启用后生效）：不配就是「浏览（取主导航）+ 订阅（RSS/邮箱）」两栏，想完全自定义：

```toml
[params.footer]
  columns = [
    { title = '浏览', links = [
      { name = '全部文章', url = '/posts/' },
      { name = '归档',     url = '/archives/' },
      { name = '标签',     url = '/tags/' },
    ] },
    { title = '站点', links = [
      { name = '全部文章', url = '/posts/' },
      { name = 'RSS 订阅', url = '/index.xml' },
    ] },
  ]
```

### 挂自定义代码

- `themes/neon/layouts/partials/extend_head.html` —— 插到 `</head>` 前（统计、验证 meta）
- `themes/neon/layouts/partials/extend_footer.html` —— 插到 `</body>` 前（第三方脚本）

---

## 五、响应式断点

主题按三档断点重构布局，不是等比缩小：

| 断点 | 变化 |
|---|---|
| **> 1180px** 桌面 | 内容区 1248px，主栏 + 352px 侧栏；详情页 760 + 424 |
| **≤ 1180px** 小桌面 | 左右留白收到 48px，侧栏 320px，置顶卡封面缩到 420px |
| **≤ 960px** 平板 / 移动 | 全部单列；**侧边栏降级到主栏下方**；导航折叠成 Logo + 汉堡菜单；置顶卡由横向改纵向；目录不再吸顶 |
| **≤ 640px** 手机 | 标题从 58px 降到 36px；列表条目隐藏缩略图、只留两行标题 + 摘要；上下篇改单列堆叠 |

---

## 六、交互与动效清单

| 交互 | 实现 |
|---|---|
| 导航吸顶 | `position: sticky` + 底部 1px 描边 |
| 卡片悬停 | 描边转青色 + 上浮 2px + 青色外发光 |
| 按钮悬停 | 主按钮上浮 + 阴影扩散；图标按钮底色转青色 10% |
| 「阅读全文 →」箭头 | 悬停时箭头右移 4px |
| 深/浅色切换 | localStorage 记忆 + 跟随系统 `prefers-color-scheme`；`<head>` 里有一段内联脚本，**首屏不会闪白** |
| 目录滚动高亮 | `IntersectionObserver`，当前章节高亮为青色底 |
| 代码块复制 | 悬停浮出 `COPY` 按钮，点击变 `COPIED` |
| 复制链接 / 分享 | 文章头部按钮，优先用系统分享面板，不支持则复制链接 |
| 滚动进入动画 | `.reveal` + `IntersectionObserver`，依次延迟 60ms 出现 |
| 无障碍 | 跳转正文链接、`:focus-visible` 焦点环、`aria-current` 当前导航、`prefers-reduced-motion` 时关闭动画 |

---

## 七、回滚到 PaperMod

`hugo.toml` 改一行：

```toml
theme = "PaperMod"
```

然后重新构建。`themes/PaperMod` 目录和文件底部的 PaperMod 参数（`ShowReadingTime` 等）都还在，行为跟以前一致。`themes/neon` 留着不影响。

---

## 八、已知取舍（重要，别踩坑）

1. **留言区没有后端**。默认不渲染假表单，只给一张说明卡；要真评论得按第四节接 giscus / utterances。
2. **搜索按钮默认关闭**。`params.search.enable = false`，因为仓库里还没有搜索页。打开之前先把 `/search/` 页面做出来，否则点了会 404。
3. **浅色模式是我推的，不是设计稿里的**。设计稿只给了深色。我按同一套结构推导了浅色版（画布翻白、强调色压深保证对比度、封面与代码块保持深色）。不需要就把 `enableLightTheme` 设成 `false`，之后 `light.css` 不会被加载。想彻底删掉，把 `head.html` 里追加 `light.css` 的那三行去掉即可。
4. **封面和缩略图默认是抽象渐变，不是照片**。这是刻意的 —— 霓虹科技调性下比随机配图统一。有实拍图就按第四节写 `cover`。
5. **归档页和标签总览页是设计稿之外补的**。设计稿里「归档」只是侧栏部件；做完整站需要能点进去的落地页，所以补了 `/archives/` 和 `/tags/`。
6. **文章头部原本设计的三个按钮是「收藏 / 分享 / 复制链接」**，我把「收藏」换成了 RSS —— 收藏没有后端就是个死按钮，RSS 是真实有用的。
7. **导航里没有独立的分区入口**。「首页」本身就是文章列表（首页列出全部文章，置顶那篇单独提走）；`/posts/` 仍然存在，作为「全部文章」的落地页被页脚和 Hero 主按钮引用。

---

## 九、CSS 类名速查

改样式时按这个找，别到处翻：

| 区块 | 主要类名 |
|---|---|
| 容器 | `.wrap`（内容宽 1248 + 左右留白）、`.layout` / `.layout--post`（主栏 + 侧栏栅格） |
| 背景装饰 | `.deco` / `.deco__grid` / `.deco__glow--cyan|blue|violet` |
| 区块标题 | `.sec-head` / `.sec-head__bar` / `.sec-head__text` |
| 导航 | `.nav` / `.nav__brand` / `.nav__link` / `.nav__actions` / `.nav__mobile` |
| 按钮 | `.btn` / `.btn--primary` / `.btn--ghost` / `.iconbtn` / `.iconbtn--sm` |
| 标签 | `.chip` / `.chip--accent` / `.chip--eyebrow` / `.chip--on-cover` |
| 首页 | `.hero` / `.featured` / `.pin-section`（**三者当前均已弃用**，首页不再渲染） |
| 列表 | `.post-list` / `.post-item` / `.post-item__thumb` / `.pager` |
| 侧栏 | `.widget` / `.widget__head` / `.tax-row` / `.tagcloud` / `.subscribe__*` |
| 文章 | `.post-head` / `.post-meta-line` / `.post-cover` / `.prose` / `.post-tags` / `.postnav` |
| 目录 | `.toc__list` / `.widget--sticky` |
| 归档 | `.archive-year` / `.archive-row` |
| 状态 | `.empty`（空状态）/ `.reveal`（滚动进入）/ `.mono`（等宽小字） |

颜色、圆角、间距一律用 `tokens.css` 里的 CSS 变量，不要在组件里写死色值。
