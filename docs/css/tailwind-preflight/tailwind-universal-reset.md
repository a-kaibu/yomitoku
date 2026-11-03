---
title: "余白と枠線をゼロにしてから組み立てる"
description: "Tailwind CSS の Preflight が最初に行う全要素リセット。margin・padding・border をゼロにし、枠線の幅と色を後から決められる状態にする。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [7, 16]
function: "\"*, ::after, ::before, ::backdrop, ::file-selector-button\""
difficulty: 1
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

Tailwind CSS の土台である Preflight の先頭にある、全要素のリセットです。ブラウザが最初から持っている余白と枠線を、すべての要素でいったん消します。その上で、必要な余白や枠線だけを使う側が書き足す、という使い方を前提にしています。

## コード

```css:line-numbers=7
*,
::after,
::before,
::backdrop,
::file-selector-button {
  box-sizing: border-box; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 2 */
  border: 0 solid; /* 3 */
}
```

## 前提知識

- **Preflight**: Tailwind CSS が最初に読み込むリセット用の CSS です。ブラウザの既定のスタイルのばらつきを、ほぼ白紙の状態に戻します。
- **margin と padding**: 要素の外側と内側の余白です。見出しや段落、リストなどには、ブラウザごとに既定の値が入っています。
- **border**: 要素の枠線です。`border: 0 solid` は、幅をゼロにしたうえで線の種類だけを既定値にそろえる指定です。
- **疑似要素**: `::before` や `::after` のように、HTML にない仮想の箱を表す名前です。`::backdrop` は全画面表示などの背景の幕、`::file-selector-button` はファイル選択ボタンを表します。
- **詳細度**: セレクタがどれだけ優先されるかを表す指標です。`*` は詳細度がとても低いので、後から書いた指定で簡単に上書きできます。

## 何をしているか

### 1. 対象を要素と疑似要素に広げる

```css:line-numbers=7
*,
::after,
::before,
::backdrop,
::file-selector-button {
```

`*` だけでは、疑似要素は対象になりません。そこで `::after`、`::before` に加えて、`::backdrop` と `::file-selector-button` も並べています。これで、ページの中の箱はすべて同じ出発点から始まります。

### 2. 余白と枠線をゼロに戻す

```css:line-numbers=12
  box-sizing: border-box; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 2 */
  border: 0 solid; /* 3 */
```

`box-sizing: border-box` で、幅に padding と border を含めます（コメント 1）。`margin: 0` と `padding: 0` で、ブラウザの既定の余白を消します（コメント 2）。`border: 0 solid` は、枠線の幅を 0 にして、線の種類だけを `solid` にそろえます（コメント 3）。

`border: 0 solid` の `solid` は、あとから `border-width` だけを書けば、実線の枠線がすぐに出るようにするための準備です。色を指定しなくても、その時点の文字色の枠線として扱われます。

## ここがすごい

- 余白をゼロにするのは、見た目を作る人が「どこに余白を入れるか」を毎回決められるようにするためです。ブラウザの既定値に頼らない設計になっています。
- `*` を使うと、セレクタを一つずつ書く必要がありません。新しい要素が増えても、リセットの対象から漏れにくくなります。
- 素直に見出しや段落だけを対象にすると、ボタンや入力欄、リストの一部などで既定の余白が残ります。全要素にかけることで、そうした取りこぼしを防げます。
- コメントの番号が 1 から 3 までで、それぞれが何を目的にしているかを示しています。読む人は、一行ずつ意図を追えます。

## まとめ

- Preflight は、ブラウザの既定の余白と枠線を最初にゼロにするリセットです。
- `*` に疑似要素を並べると、取りこぼしのない一括指定になります。
- 余白をゼロにしておくと、必要なときだけ自分で余白を決められます。
- `border: 0 solid` のように、幅と線の種類をセットで整えておくと、後の指定が簡単になります。
