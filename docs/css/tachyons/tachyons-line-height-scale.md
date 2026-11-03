---
title: "行間を用途の名前で選ぶ"
description: "Tachyons の .lh-solid・.lh-title・.lh-copy は line-height を 1、1.25、1.5 にする。見出しは詰めて、本文は広げる、という用途の名前による行間の決まり。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_line-height.css
lines: [13, 15]
function: "\".lh-solid, .lh-title, .lh-copy\""
difficulty: 1
format: 2
tags: [可読性, レイアウト]
---
## ひとことで

Tachyons の `.lh-*` のクラスは、行の間隔を、用途の名前で三段階に選べるようにしています。見出しは詰め、本文は広げる、という使い分けを表します。

## コード

```css:line-numbers=13
  .lh-solid { line-height: 1; }
  .lh-title { line-height: 1.25; }
  .lh-copy  { line-height: 1.5; }
```

## 前提知識

- **line-height**: 行と行の間隔を決めるプロパティです。数値は、文字の大きさに対する倍率です。
- **leading**: 行間を表す印刷の用語です。Tachyons は、このクラス名に lh を使っています。
- **行間と読みやすさ**: 行間が詰まると、一行の固まりとして見えます。広すぎると、行が離れて読みにくくなります。

## 何をしているか

### 1. 一行の固まり

```css:line-numbers=13
  .lh-solid { line-height: 1; }
```

`.lh-solid` は、行間を 1 にします。複数行の見出しや、ボタンの文字のように、行を一つの塊として見せたいときに使います。

### 2. 見出し向け

```css:line-numbers=14
  .lh-title { line-height: 1.25; }
```

`.lh-title` は、行間を 1.25 にします。見出しとして、少し余裕のある行間になります。

### 3. 本文向け

```css:line-numbers=15
  .lh-copy  { line-height: 1.5; }
```

`.lh-copy` は、行間を 1.5 にします。長い文章でも、目が行を追いやすくなります。

## ここがすごい

行間を用途の名前で表すため、デザインの指示と HTML が対応します。数値を覚えなくても、見出しか本文かで選べます。

行間を名前で決めておくと、見出しや本文を書く人が、数値の意味を考えずに済みます。たとえば、ボタンの中の文字には solid、ニュースの見出しには title、記事の本文には copy、と役割で選べます。行間は、文字の大きさと合わせて読みやすさを決めるため、この三つの段階は、実用的な出発点になります。

## まとめ

行間を三つの名前で決めると、見出しと本文の読みやすさを、役割に合わせて切り替えられます。
