---
title: "リンクの色を継承にして、使う側が決める"
description: "a 要素の色と下線を親から継承させるリセット。ブラウザの既定の青い下線を消し、利用者がリンクの見た目を opt-in で指定する設計。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [92, 96]
function: "a"
difficulty: 1
format: 2
tags: [設計パターン, 移植性]
---
## ひとことで

`a` 要素（リンク）の色と下線を、親の値から受け継ぐルールです。ブラウザは既定で、リンクを青い文字と下線で表示します。このルールはそれを消して、リンクの見た目はそれぞれの場所で決める、という考え方を示しています。

## コード

```css:line-numbers=92
a {
  color: inherit;
  -webkit-text-decoration: inherit;
  text-decoration: inherit;
}
```

## 前提知識

- **リンク（a 要素）**: 別のページや場所へ移動するための HTML 要素です。ブラウザは既定で、未訪問のリンクを青、訪問済みを紫で表示します。
- **text-decoration**: 文字の下線などの装飾を決めるプロパティです。`inherit` で、親の装飾を受け継げます。
- **opt-out と opt-in**: 既定の見た目を消してから必要な場所だけ付け直す（opt-out）か、既定を無くして必要な場所だけ付ける（opt-in）かの違いです。
- **-webkit-text-decoration**: 古い WebKit 系のブラウザ向けの接頭辞付きの指定です。

## 何をしているか

### 1. 色を親から受け継ぐ

```css:line-numbers=93
  color: inherit;
```

`color: inherit` で、リンクの文字色を周りの文字色と同じにします。リンクだけが特別な色になることはなくなります。リンクの色を変えたいときは、そのリンクを囲む要素や、クラスで指定します。

### 2. 下線も親から受け継ぐ

```css:line-numbers=94
  -webkit-text-decoration: inherit;
  text-decoration: inherit;
```

下線の指定も `inherit` にして、親の装飾を受け継ぎます。接頭辞付きの指定を先に書いて、古い WebKit 系のブラウザでも同じ動きになるようにしています。

## ここがすごい

- コメントの「opt-out ではなく opt-in に最適化する」という一文が、このルールの考え方を表しています。既定の見た目を消して、必要な場所だけに見た目を付ける形です。
- リンクの色は、テキストの中にあるかどうかで意味が変わります。すべてのリンクに青を付けると、ナビゲーションや見出しの中で浮いてしまいます。
- 素直に書くと、`a { color: blue; text-decoration: underline; }` のように決め打ちします。そうすると、ボタンのように見せたいリンクを作るたびに、上書きが必要になります。
- 継承にすると、親の色が変わったときにリンクも追従します。テーマを切り替えるときの修正が減ります。

## まとめ

- ブラウザの既定のリンクの色は、そのままだと全体のデザインから浮きやすいです。
- `color` と `text-decoration` を `inherit` にすると、周りに合わせた見た目になります。
- 見た目は必要な場所で指定する（opt-in）と、デザインの意図が明確になります。
- 接頭辞付きの指定を併記して、古いブラウザへの配慮を残しています。
