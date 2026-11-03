---
title: "hr の高さと色を枠線に任せるリセット"
description: "水平線 hr の高さを 0 にし、色を継承、上の枠線の太さだけを 1px にそろえる。見た目が一本の線になるための調整。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [59, 63]
function: "hr"
difficulty: 1
format: 2
tags: [移植性]
---
## ひとことで

`hr`（水平線）の見た目を、一本の細い線だけにそろえるルールです。`height: 0` で箱の高さをゼロにして、線は上の枠線だけで描きます。さらに色を `inherit` で親から受け継ぎ、枠線の太さを `1px` に決めています。

## コード

```css:line-numbers=59
hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}
```

## 前提知識

- **hr 要素**: 段落や話題の区切りを表す水平線の HTML 要素です。
- **height**: 要素の高さです。`0` にすると、中身のない薄い箱になります。
- **border-top-width**: 上の枠線の太さです。`hr` は上の枠線を線として使うことが多いです。
- **inherit**: 親の値をそのまま受け継ぐキーワードです。`color: inherit` は、親の文字色を線の色として使うという意味になります。

## 何をしているか

### 1. 高さをゼロにして、線の箱をつぶす

```css:line-numbers=59
hr {
  height: 0; /* 1 */
```

`height: 0` は、`hr` の箱の高さをゼロにします。コメントにあるように、Firefox では既定の高さがそのまま残るため、ここで明示的にゼロにしています。

### 2. 色を親から受け継ぎ、太さを決める

```css:line-numbers=61
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
```

`color: inherit` で、線の色を親の文字色に合わせます。`border-top-width: 1px` は上の枠線の太さを 1px に決めます。線の種類は Preflight 全体の `border: 0 solid` によって実線になるので、ここでは太さだけを指定すれば十分です。

## ここがすごい

- 線の色を `inherit` で受け取るので、ダークモードなどで文字色を変えると、区切り線も一緒に変わります。
- コメント 2 は、Firefox で枠線の色が正しく継承されないバグへの対策を示しています。リンク先の Bugzilla の報告まで書かれているので、なぜこの行があるのかを後から調べられます。
- 素直に `hr { border: 1px solid #ccc; }` と書くと、色を決め打ちすることになります。テーマを変えるたびに、この色も直す必要が出てきます。
- 3 行だけで、ブラウザごとの水平線の見た目の差を揃えています。

## まとめ

- `hr` は既定で高さと枠線を持つので、見た目がブラウザごとにずれやすいです。
- `height: 0` と上の枠線だけで、一本の線として描けます。
- 色を `inherit` で受け取ると、テーマの変更に自動で追従します。
- 枠線の太さだけを指定すれば、線の種類は全体のリセットに任せられます。
