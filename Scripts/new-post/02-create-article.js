// ============================================================================
// QuickAdd 宏 · 步骤 2：建文章文件夹 + index.md，并套用 Templates/Blog.md
//
// 用法：在同一个宏里再加一个 User Script，选择本脚本
//       （Scripts/new-post/02-create-article.js），必须排在步骤 1 之后。
//
// 做的事：
//   1. 用宏变量 title 生成安全的目录名（去掉非法字符、空格换连字符）
//   2. 建 content/posts/<目录名>/ ，把 Templates/Blog.md 写成里面的 index.md
//   3. 把模板里的 date / title 字段换成真实值
//   4. 打开新文件，光标就位，直接开始写
//
// 注意：附件（图片 / PDF / 视频）直接放进这个目录即可，Obsidian 的
//       「新附件的默认位置」已设为「当前文件所在文件夹」，不需要子目录。
// ============================================================================

module.exports = async (params) => {
  const { app, variables, abort } = params;

  const TEMPLATE_PATH = "Templates/Blog.md";
  const POSTS_DIR = "content/posts";

  const title = (variables.title ?? "").trim();
  if (!title) {
    abort("拿不到标题变量，请确认脚本顺序：先运行「01-prompt-title」。");
    return;
  }

  // ---- 1. 目录名安全化：中文保留，空格换连字符，去掉文件名非法字符 ----
  const slug =
    title
      .replace(/[\\/:*?"<>|#^[\]]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^[.\-]+|[.\-]+$/g, "")
      .slice(0, 80) || `post-${Date.now()}`;

  const folder = `${POSTS_DIR}/${slug}`;
  const filePath = `${folder}/index.md`;

  // ---- 2. 已存在就停手，不要覆盖别人的文章 ----
  if (app.vault.getAbstractFileByPath(folder)) {
    abort(`文件夹已存在：${folder}\n换个标题，或者先处理掉那个目录。`);
    return;
  }

  // ---- 3. 读模板 ----
  const tpl = app.vault.getAbstractFileByPath(TEMPLATE_PATH);
  if (!tpl) {
    abort(`找不到模板：${TEMPLATE_PATH}`);
    return;
  }
  let content = await app.vault.read(tpl);

  // ---- 4. 校验模板结构，再替换 date / title ----
  if (!/^date\s*=/m.test(content) || !/^title\s*=/m.test(content)) {
    abort(`模板缺少 date 或 title 字段，请检查 ${TEMPLATE_PATH}`);
    return;
  }

  // 整行替换，不依赖模板内部的 Templater 写法 —— 模板改了也不会失效
  // 不带引号：TOML 原生的 offset date-time，与仓库现有文章写法一致
  content = content.replace(/^date\s*=.*$/m, `date = ${localNow()}`);
  // 标题用「人写的原标题」，不是目录名，这样中文标题不会带上连字符
  content = content.replace(/^title\s*=.*$/m, `title = ${tomlString(title)}`);

  // 兜底：front matter 必须是最开头，且不能残留 Templater 标记，
  // 否则 Hugo 认不出 front matter，会把整块当正文渲染
  if (!content.startsWith("+++")) {
    abort(`模板 ${TEMPLATE_PATH} 的第一行必须是 +++（Hugo 的 TOML front matter 分隔符）。`);
    return;
  }
  if (/<%/.test(content)) {
    abort(`生成的内容里还残留 <% %> 标记（Templater 语法），Hugo 会把它当正文。\n请检查 ${TEMPLATE_PATH}`);
    return;
  }

  // ---- 5. 建目录、写文件、打开 ----
  await app.vault.createFolder(folder).catch(() => {});
  const newFile = await app.vault.create(filePath, content);
  await app.workspace.getLeaf(true).openFile(newFile);

  console.log(`[new-post] 已创建 ${filePath}`);
};

// 本地时区的 RFC3339，如 2026-09-14T21:30:00+08:00
// 不用 moment：Obsidian 里有，但脚本在别处跑就会 ReferenceError，
// 而且 moment 的 Z 会输出 +0800（缺冒号），不是 TOML 认的写法
function localNow(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset(); // 分钟，东八区 = 480
  const sign = off >= 0 ? "+" : "-";
  const a = Math.abs(off);
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `${sign}${p(Math.floor(a / 60))}:${p(a % 60)}`
  );
}

// TOML 字符串：优先用字面量字符串，标题含单引号时退回基本字符串
function tomlString(s) {
  if (!s.includes("'")) return `'${s}'`;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
