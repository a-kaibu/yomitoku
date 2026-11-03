---
title: "メニューの項目を折り返さない一行にする"
description: "Pure CSS の .pure-menu-link は display: block と white-space: nowrap で、メニューの文字を折り返さず一行に保つ。狭い場所でも項目の高さがそろう。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/menus/css/menus-core.css
lines: [30, 35]
function: "\".pure-menu-link, .pure-menu-heading\""
difficulty: 1
format: 2
tags: [レイアウト]
---
## ひとことで

Pure CSS のメニューの項目は、文字が長くても改行せず、一行に収まるように決められています。メニューの高さがそろい、見た目が崩れにくくなります。

## コード

```css:line-numbers=30
.pure-menu-link,
.pure-menu-heading {
    display: block;
    text-decoration: none;
    white-space: nowrap;
}
```

## 前提知識

- **display: block**: 要素を行全体の箱にする指定です。クリックできる範囲が広がります。
- **white-space**: 空白や改行の扱いを決めるプロパティです。`nowrap` は改行を禁止します。
- **pure-menu-heading**: メニューの見出しを表すクラスです。項目と同じ扱いにするため、同じルールに並べています。

## 何をしているか

### 1. 項目を行全体の箱にする

```css:line-numbers=30
.pure-menu-link,
.pure-menu-heading {
    display: block;
    text-decoration: none;
```

リンクと見出しを block にし、文字の下線をなくします。項目の端まで、同じ箱として扱えます。

### 2. 文字を折り返さない

```css:line-numbers=34
    white-space: nowrap;
```

`white-space: nowrap` で、長い文字も一行に収めます。折り返しによる高さの違いが出ません。

## ここがすごい

リンクと見出しを一つのルールにまとめているので、両者の見た目がずれません。

メニューの項目が折り返すと、同じ列でも高さがばらつき、見た目が崩れます。nowrap で一行に収めると、項目どうしの高さがそろいます。長い語で横幅が足りないときは、折り返しではなく省略などの別の手段を選ぶことになります。このルールは、メニュー全体の見た目を安定させるための、基本の決まりです。

## まとめ

block と nowrap を組み合わせると、メニューの項目が一行の箱として並びます。
