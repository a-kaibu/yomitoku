---
title: "--theme() で既定フォントを設定ごとに差し替える"
description: "Tailwind の --theme() 関数で、フォントの候補リストを設定から差し替えられるようにする。html 要素で OS のフォントを既定にしつつ、利用者が上書きできる仕組み。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [28, 51]
function: "\"html, :host\""
difficulty: 2
format: 2
tags: [移植性, 設計パターン]
---
## ひとことで

`html` 要素と、Web コンポーネントの外側の `:host` に、既定のフォントを設定するルールです。フォントの候補リストの中で `--theme(...)` という関数を使っていて、利用者が設定ファイルに書いたフォントがあれば、その値が使われます。書かれていなければ、OS の標準フォントが使われます。

## コード

```css:line-numbers=28
html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  tab-size: 4; /* 3 */
  font-family: --theme(
    --default-font-family,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    'Noto Sans',
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ); /* 4 */
  font-feature-settings: --theme(--default-font-feature-settings, normal); /* 5 */
  font-variation-settings: --theme(--default-font-variation-settings, normal); /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}
```

## 前提知識

- **CSS 変数（カスタムプロパティ）**: `--name` の形で名前を付けて、値を後から差し替えられる仕組みです。`var(--name)` で読み出します。
- **--theme()**: Tailwind CSS が提供する特別な関数です。Tailwind の設定にある値を、ビルド時に CSS へ展開します。
- **:host**: Shadow DOM を使う Web コンポーネントの内側の根元を表す疑似クラスです。`html` と並べて書くと、Web コンポーネントの中でも同じフォントになります。
- **font-feature-settings / font-variation-settings**: フォントの合字や数字の幅などの細かい設定、可変フォントの軸の値を指定するプロパティです。ここでは既定の `normal` を入れています。

## 何をしているか

### 1. フォントのリストを設定から受け取る

```css:line-numbers=33
  font-family: --theme(
    --default-font-family,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    'Noto Sans',
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ); /* 4 */
```

`--theme(--default-font-family, ...)` は、設定に `--default-font-family` という値があればそれを使い、無ければ後ろに並んだ既定のリストを使う、という意味です。リストの中身は、先頭に `-apple-pay-button` ではなく `-apple-system`、続いて `BlinkMacSystemFont`、`Segoe UI`、`Roboto` などが並びます。

### 2. 文字の設定を同じ仕組みで扱う

```css:line-numbers=48
  font-feature-settings: --theme(--default-font-feature-settings, normal); /* 5 */
  font-variation-settings: --theme(--default-font-variation-settings, normal); /* 6 */
```

フォントの細かい設定も、同じように `--theme()` で受け取っています。設定が無ければ `normal` になり、ブラウザの既定と同じ動きになります。利用者が可変フォントを使うときは、ここで軸の値を指定できます。

## ここがすごい

- 既定値を CSS に直接書かず、設定ファイルから差し替えられるようにしています。プロジェクトごとにフォントを変えるとき、このファイルを直接書き換える必要がありません。
- 候補リストの後ろに汎用フォントの `sans-serif` を置き、最後の保険にしています。フォントが一つも見つからない環境でも、ページは読めるままです。
- 素直に書くと、`font-family: Arial, sans-serif;` のように決め打ちになります。すると設定を変えたいときに、CSS を直接書き換えることになります。
- コメントの 4 から 7 が、どの値が何のためにあるかを説明しています。`tab-size` や `line-height` の意図が、後で読む人にも伝わります。

## まとめ

- `--theme()` は、設定の値を CSS に取り込むための Tailwind の関数です。
- 既定のフォントを変数のように扱うと、利用者が自由に差し替えられます。
- 候補リストの最後に汎用フォントを置き、どの環境でも読める状態にします。
- Web コンポーネントの `:host` も対象にすると、外側と中身で同じ見た目になります。
