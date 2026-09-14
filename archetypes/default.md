{{- $title := "新文章" -}}
{{- with .File -}}
  {{- $base := .ContentBaseName -}}
  {{- if eq $base "index" }}{{ $base = path.Base .Dir }}{{ end -}}
  {{- $title = $base | replaceRE `[-_]` " " | title -}}
{{- end -}}
+++
date = '{{ .Date }}'
draft = true
title = '{{ $title }}'
description = ''
# cover = 'cover.png'             # 封面图，放在本文章目录里，写文件名即可
# categories = ['分类名']          # 可选，写了会自动生成分类页
# tags = ['标签一', '标签二']       # 可选
+++

正文用 Markdown 写。

图片等附件直接放进本文章目录（和 index.md 并列），然后这样引用：

![图片说明](你的图片.png)

Obsidian 的写法 `![[你的图片.png]]` 也可以，主题会按文件名在本文章目录内查找。
