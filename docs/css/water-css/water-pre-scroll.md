---
title: "ブロックのコードは横にスクロールさせる"
description: "Water.css は pre の中の code を block にし、overflow-x を auto にして、長い行を横にスクロールできるようにする。コードの行を折り返さずに読む書き方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [188, 192]
function: "\"pre > code\""
difficulty: 2
format: 2
tags: [レイアウト, 可読性]
---
## ひとことで

Water.css は、コードブロックの中の code を、横に長い行を読めるように整えます。幅を超えた行は、折り返さずに横へスクロールさせます。

## コード

```css:line-numbers=188
pre > code {
  padding: 10px;
  display: block;
  overflow-x: auto;
}
```

## 前提知識

- **pre 要素**: 整形済みのテキストを、そのままの空白で表示する HTML の要素です。コードブロックによく使われます。
- **display: block**: 要素を行全体の箱にする指定です。code が文字と並ばず、ブロックの幅を持ちます。
- **overflow-x: auto**: 横方向にはみ出した内容を、必要なときだけスクロールで見せる指定です。

## 何をしているか

### 1. 一つの箱として表示する

```css:line-numbers=189
  padding: 10px;
  display: block;
```

内側の余白を 10px にし、code を block にします。コードの塊が、一つの箱として前後の文章から分かれます。

### 2. 長い行をスクロールさせる

```css:line-numbers=191
  overflow-x: auto;
```

横にはみ出した部分を、スクロールで読めるようにします。折り返すと字下げが崩れるため、この方法が読みやすさを保ちます。

## ここがすごい

字下げや記号の位置を崩さずに、長い行をそのまま読めます。コードの意味を保つ点で、折り返しより適した指定です。

コードを折り返すと、字下げの位置が変わり、意味が読み取りにくくなります。横にスクロールさせると、一行ずつの形を保ったまま、必要な部分を読めます。ブロックの箱として区切ることで、本文との境目も分かりやすくなります。コードを読むときは、折り返しよりも形の保存が大切なことが多いです。

## まとめ

pre の中の code を block にし、横スクロールを許すと、長いコードも字下げを保って読めます。
