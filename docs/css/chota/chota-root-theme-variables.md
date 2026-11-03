---
title: ":root の変数で色と格子の幅をまとめて決める"
description: "Chota は :root に色、文字の大きさ、グリッドの最大幅とガターを CSS 変数として並べる。部品のルールは変数を読むだけなので、テーマの変更が一か所で済む。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_base.css
lines: [1, 18]
function: "\":root\""
difficulty: 2
format: 2
tags: [設計パターン, 配色]
---
## ひとことで

Chota のテーマの値を、`:root` に書かれた CSS 変数の一覧で決めているルールです。背景色、主要な色、文字の色、グリッドの最大幅や列の間隔、文字の大きさ、フォントの候補がここにまとまっています。部品のルールは、この変数を読むだけになっています。

## コード

```css:line-numbers=1
:root {
  --bg-color: #fff;
  --bg-secondary-color: #f3f3f6;
  --color-primary: #14854f;
  --color-lightGrey: #d2d6dd;
  --color-grey: #747681;
  --color-darkGrey: #3f4144;
  --color-error: #d43939;
  --color-success: #28bd14;
  --grid-maxWidth: 120rem;
  --grid-gutter: 2rem;
  --font-size: 1.6rem;
  --font-color: #333;
  --font-family-sans: -apple-system, "BlinkMacSystemFont", "Avenir",
    "Avenir Next", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
    "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  --font-family-mono: monaco, "Consolas", "Lucida Console", monospace;
}
```

## 前提知識

- **CSS 変数（カスタムプロパティ）**: `--name: 値;` で宣言し、`var(--name)` で読み出す仕組みです。
- **:root**: 文書の一番上の要素を指す疑似クラスです。ここに書いた変数は、ページ全体から読めます。
- **rem 単位**: html の文字の大きさを基準にした長さの単位です。
- **フォントの候補リスト**: 左から順に使えるフォントを探す、フォントの指定の並びです。

## 何をしているか

### 1. 色の変数

```css:line-numbers=2
  --bg-color: #fff;
  --bg-secondary-color: #f3f3f6;
  --color-primary: #14854f;
  --color-lightGrey: #d2d6dd;
  --color-grey: #747681;
  --color-darkGrey: #3f4144;
  --color-error: #d43939;
  --color-success: #28bd14;
```

背景色、主要な色（`--color-primary`）、灰色の段階、エラーと成功の色が並んでいます。色の名前が役割で付いているので、部品のルールは「primary を使う」という形で書けます。

### 2. 格子とフォントの変数

```css:line-numbers=10
  --grid-maxWidth: 120rem;
  --grid-gutter: 2rem;
  --font-size: 1.6rem;
  --font-color: #333;
  --font-family-sans: -apple-system, "BlinkMacSystemFont", "Avenir",
    "Avenir Next", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
    "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  --font-family-mono: monaco, "Consolas", "Lucida Console", monospace;
```

`--grid-maxWidth` と `--grid-gutter` は、格子の最大幅と列の間隔です。`--font-size` や `--font-color`、フォントの候補リストもここに入っています。等幅フォントも別の変数で決められています。

## ここがすごい

- 色の名前を「役割」で付けているので、ブランドの色を変えるときは、`--color-primary` の値だけを変えれば済みます。
- 格子の幅と余白の変数は、グリッドのルールの計算の中で使われています。一つの値を変えると、列の幅と余白が一緒に変わります。
- 素直に、部品ごとに色を直接書くと、テーマの変更が数十か所に散らばります。変数にすると、変更は一か所で済みます。
- フォントの候補リストを変数にしておくと、利用者が自分のフォントに差し替えやすくなります。

## まとめ

- `:root` に変数をまとめると、テーマの変更が一か所で済みます。
- 色は名前を役割で付けると、使う側が意味を理解しやすくなります。
- 格子の値も変数にすると、レイアウトとテーマを同じ仕組みで調整できます。
