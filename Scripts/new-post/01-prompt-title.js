// ============================================================================
// QuickAdd 宏 · 步骤 1：弹出输入框，问文章标题
//
// 用法：QuickAdd → Manage → Add Choice → Macro → 添加一个 User Script，
//       选择本脚本（Scripts/new-post/01-prompt-title.js）
//
// 作用：把用户输入的标题存进宏变量 title，供步骤 2 使用。
// 取消输入时用 params.abort 结束整个宏（QuickAdd 会弹出提示，不会继续建文件）。
// ============================================================================

module.exports = async (params) => {
  const { quickAddApi, variables, abort } = params;

  const raw = await quickAddApi.inputPrompt(
    "请输入文章标题",
    "例如：我的第一篇博客"
  );

  const title = (raw ?? "").trim();

  if (!title) {
    abort("没有输入标题，已取消。");
    return;
  }

  variables.title = title;
};
