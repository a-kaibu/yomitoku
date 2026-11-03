---
title: "大文字の小さなラベル .tag の見た目"
description: "Chota の .tag は、枠線、大文字、字間、余白を小さくまとめた、ラベルの見た目を作る。カテゴリや状態を、本文の中で控えめに示すための部品。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_tag.css
lines: [1, 9]
function: "\".tag\""
difficulty: 1
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

`tag` クラスを付けた要素を、枠線付きの小さな大文字のラベルに見せるルールです。カテゴリや状態のような短い言葉を、本文の中で控えめに示すための部品になります。色は変数で決まり、大きさや余白も一緒に決まっています。

## コード

```css:line-numbers=1
.tag {
  display: inline-block;
  border: 1px solid var(--color-lightGrey);
  text-transform: uppercase;
  color: var(--color-grey);
  padding: 0.5rem;
  line-height: 1;
  letter-spacing: 0.5px;
}
```

## 前提知識

- **inline-block**: 文字と同じ行に並びながら、余白や枠線を持てる箱にする指定です。
- **text-transform: uppercase**: 文字を大文字で表示する指定です。HTML の文字は変わりません。
- **letter-spacing**: 文字と文字の間隔です。`0.5px` は少しだけ空けます。
- **line-height: 1**: 行の高さを文字の大きさと同じにする指定です。箱の高さが詰まります。

## 何をしているか

### 1. 箱と枠線

```css:line-numbers=2
  display: inline-block;
  border: 1px solid var(--color-lightGrey);
  text-transform: uppercase;
  color: var(--color-grey);
  padding: 0.5rem;
```

`inline-block` で文字と同じ行に置きます。`border` は、変数の薄い灰色の枠線です。`padding: 0.5rem` で、文字の周りに余白を取ります。

### 2. 文字の見た目

```css:line-numbers=4
  text-transform: uppercase;
  color: var(--color-grey);
  padding: 0.5rem;
  line-height: 1;
  letter-spacing: 0.5px;
```

`uppercase` で大文字にし、灰色の文字色と字間を付けます。`line-height: 1` は、ラベルの箱を詰めて、縦の大きさを小さく保つ指定です。

## ここがすごい

- 色、余白、文字の大きさを、ほとんど変数や相対単位で決めているので、テーマを変えても崩れにくくなっています。
- 大文字を `text-transform` で作るので、HTML に書いた文字はそのまま残り、検索や読み上げに影響しません。
- 素直に `span` へ直接スタイルを書くと、同じ見た目のラベルを作るたびに同じ指定を繰り返すことになります。クラスにまとめると、一度の定義で済みます。
- 大きさの違う `is-small` や `is-large` を、同じ部品の変化形として用意しています。

## まとめ

- `inline-block` と `padding` で、小さな箱を作れます。
- `uppercase` で、表示だけを大文字にできます。
- 大きさの違いは、基本のクラスに変化形を足して表します。
