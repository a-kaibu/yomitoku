---
title: "記事の段落と箇条書きの行間をそろえる"
description: "Tachyons の .nested-copy-line-height は、中に入った p・ul・ol の行間を 1.5 にする。CMS が生成した本文に、クラスを一つ付けるだけで行間をそろえる仕組み。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_nested.css
lines: [9, 13]
function: "\".nested-copy-line-height p, ul, ol\""
difficulty: 1
format: 2
tags: [レイアウト, 可読性]
---
## ひとことで

Tachyons の `.nested-copy-line-height` は、クラスを付けた箱の中の段落と箇条書きに、ゆったりした行間を一括で与えます。

## コード

```css:line-numbers=9
.nested-copy-line-height p,
.nested-copy-line-height ul,
.nested-copy-line-height ol {
  line-height: 1.5;
}
```

## 前提知識

- **line-height**: 行と行の間隔を決めるプロパティです。数値は文字の大きさに対する倍率です。
- **nested**: 親のクラスの中にある子要素に、まとめて効かせる書き方です。
- **CMS が生成する本文**: 管理画面で書かれた本文は、p や ul が自動で入ります。個々の要素にクラスを付けられないことがあるため、親に一つ付けて済ませます。

## 何をしているか

### 1. 対象を決める

```css:line-numbers=9
.nested-copy-line-height p,
.nested-copy-line-height ul,
.nested-copy-line-height ol {
```

親の中にある p、ul、ol を選びます。見出しは別の指定に任せ、本文だけに行間を付けます。

### 2. 行間を広げる

```css:line-numbers=12
  line-height: 1.5;
```

行間を 1.5 にします。文字が詰まりすぎず、長い文章でも読み進めやすくなります。

## ここがすごい

HTML を書き換えずに、本文全体の読みやすさを変えられます。見出しの行間だけは別に決められるよう、対象を分けてあります。

CMS の本文は、見出しや段落が後から増えることがあります。そのため、行間を要素ごとに書くと、管理画面の変更に合わせて直す手間が増えます。このクラスは、本文の箱にだけ一度付ければ、新しく入った段落や箇条書きも、同じ行間で読めるようになります。段落の間隔は別の指定に任せ、行間だけに責任を絞っている点が、扱いやすさにつながっています。

## まとめ

親に一つクラスを付けるだけで、本文の行間をそろえられる、現場向けの工夫です。
