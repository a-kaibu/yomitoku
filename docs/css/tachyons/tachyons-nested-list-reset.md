---
title: "本文の中の箇条書きの点と字下げをなくす"
description: "Tachyons の .nested-list-reset は、中の ul と ol の padding-left と margin-left を 0 にし、list-style-type を none にする。CMS の本文に付く点を消すための指定。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_nested.css
lines: [24, 29]
function: "\".nested-list-reset ul, .nested-list-reset ol\""
difficulty: 1
format: 2
tags: [レイアウト]
---
## ひとことで

Tachyons の `.nested-list-reset` は、本文の中にある箇条書きの点と字下げを消します。リストを、ナビゲーションや一覧の部品として使いたいときの指定です。

## コード

```css:line-numbers=24
.nested-list-reset ul,
.nested-list-reset ol {
  padding-left: 0;
  margin-left: 0;
  list-style-type: none;
}
```

## 前提知識

- **ul と ol**: 順序のない一覧と、順序のある一覧を表す要素です。
- **list-style-type**: 一覧の先頭記号を決めるプロパティです。none は記号を表示しません。
- **padding-left と margin-left**: 一覧の左側の余白です。ブラウザは通常、ここに字下げを入れます。

## 何をしているか

### 1. 字下げをゼロにする

```css:line-numbers=25
.nested-list-reset ol {
  padding-left: 0;
  margin-left: 0;
```

左の内側の余白と、外側の余白を 0 にします。一覧の左端が、親の箱の左端にそろいます。

### 2. 記号を消す

```css:line-numbers=28
  list-style-type: none;
```

list-style-type を none にして、項目の先頭の点や数字を表示しません。

## ここがすごい

本文の中のリストだけを対象にするので、ページ全体のリストの見た目は変わりません。記事の中ではリストを使い、ナビゲーションではそのまま流用できます。

本文の箇条書きをナビゲーションに使う場合、点が残っていると、リンクの一覧として見えにくくなります。字下げも消すことで、リンクの左端が他の要素と一直線にそろいます。一方で、通常の本文の箇条書きには点が必要な場合もあるため、このクラスは必要な箱にだけ付ける使い方が向いています。

## まとめ

字下げと記号を消すだけで、本文のリストを、部品として扱える形に変えられます。
