---
title: "キーボードのキーを立体の箱に見せる kbd"
description: "kbd 要素に枠線、角丸、下側の内側の影を付けて、キーボードのキーのように見せる。等幅フォントと小さな行の高さで、キーの文字を収めるための細かい調整。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [386, 398]
function: "\".markdown-body kbd\""
difficulty: 2
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

キーボードの入力を表す `kbd` 要素を、キーボードのキーのように見せるルールです。枠線、角丸、背景色を付け、下側だけ内側に影を落とすことで、キーが少し盛り上がって見えるようにしています。文字は等幅フォントで書かれます。

## コード

```css:line-numbers=386
.markdown-body kbd {
  display: inline-block;
  padding: var(--base-size-4);
  font: 11px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
  line-height: 10px;
  color: var(--fgColor-default);
  vertical-align: middle;
  background-color: var(--bgColor-muted);
  border: solid 1px var(--borderColor-neutral-muted);
  border-bottom-color: var(--borderColor-neutral-muted);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 var(--borderColor-neutral-muted);
}
```

## 前提知識

- **kbd 要素**: キーボードのキーの入力を表す HTML 要素です。`Ctrl` や `Enter` のように書くときに使います。
- **box-shadow**: 要素の周りに影を描くプロパティです。`inset` を付けると、影が箱の内側に落ちます。
- **inline-block**: 文字と同じ行に並びながら、幅と高さを持てる箱にする指定です。
- **CSS 変数**: `var(--bgColor-muted)` のように、色や余白を名前で読み出す仕組みです。ライトとダークのテーマを切り替えるときに、同じルールを使えます。

## 何をしているか

### 1. キーの箱と文字

```css:line-numbers=387
  display: inline-block;
  padding: var(--base-size-4);
  font: 11px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
  line-height: 10px;
  color: var(--fgColor-default);
  vertical-align: middle;
```

`inline-block` で文の流れの中に置き、`padding` で周りに余白を取ります。フォントは 11px の等幅で、`line-height: 10px` と小さく抑えています。キーの中に文字がきれいに収まるように、行の高さを文字より詰めています。

### 2. キーの立体感

```css:line-numbers=393
  background-color: var(--bgColor-muted);
  border: solid 1px var(--borderColor-neutral-muted);
  border-bottom-color: var(--borderColor-neutral-muted);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 var(--borderColor-neutral-muted);
```

背景色と枠線で、キーの面を作ります。`border-bottom-color` は下の枠線の色を決めます。`box-shadow: inset 0 -1px 0` は、箱の内側の下の辺に、1px の影を落とします。この影が、キーの下側の厚みに見えます。

## ここがすごい

- 立体感を、画像を使わずに、枠線と一本の内側の影だけで作っています。色はテーマの変数から取るので、ダークモードでも同じ形で見えます。
- 文字の大きさを 11px、行の高さを 10px と、数字をわざと詰めています。小さなキーの中に、文字を収めるための調整です。
- 素直に `kbd { border: 1px solid #ccc; }` と書くと、平らな枠線にしかなりません。内側の影を一本足すだけで、キーらしい見た目になります。
- 角の丸さを `6px` にして、キーの丸みを表しています。

## まとめ

- `kbd` は、キーボードの入力を表す要素です。
- 枠線と内側の一本の影で、キーの立体感を作れます。
- 色を変数で決めると、テーマを変えてもキーの見た目が揃います。
