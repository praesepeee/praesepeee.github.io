+++
date = 2026-09-14T09:00:00+08:00
draft = false
title = '测试文章'
description = '这是一篇用于验证站点构建与展示是否正常的示例文章。'
cover = 'cover.png'
+++

这是一篇示例文章，用来确认站点可以正常构建、列表页与文章页都能正常展示。

## 一篇一个文件夹

每篇文章是一个目录，正文固定叫 `index.md`，图片 / PDF / 视频等附件**直接放在同一个目录里**，不再分子目录：

```text
content/posts/我的文章/
├─ index.md       ← 正文
├─ cover.png      ← 封面（可选）
└─ inline.png     ← 插图 / PDF / 视频…都放这里
```

## 引用附件

封面写在 front matter 里，路径相对本文章目录：

```toml
cover = 'cover.png'
```

正文里的插图推荐用标准 Markdown，直接写文件名：

![示例插图](inline.png)

如果你习惯 Obsidian 的附件写法，`![[]]` 嵌入主题也能认（按文件名在本文章目录内查找）：

![[inline.png]]

PDF、视频、音频同样处理，主题会按后缀分别渲染成文件链接、播放器：

```text
![[guide.pdf]]   →  文件链接
![[clip.mp4]]    →  视频播放器
![[sound.mp3]]   →  音频播放器
```
