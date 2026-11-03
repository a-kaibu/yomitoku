---
title: "Firefox の新しいフォーカス枠を全要素に使う"
description: ":-moz-focusring を使って、キーボードでフォーカスしたときだけ outline: auto の枠を出す。Firefox の新しいフォーカス表示を、すべての要素で揃える。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [178, 180]
function: "\":-moz-focusring:where(:not(iframe))\""
difficulty: 2
format: 2
tags: [移植性, 防御的プログラミング]
---
## ひとことで

キーボードでフォーカスを当てたときに、Firefox で出るフォーカス枠を `outline: auto` で描くルールです。`:-moz-focusring` は、Firefox でキーボードによるフォーカスがあるときだけ一致する疑似クラスです。マウスでクリックしたときには枠が出ません。

## コード

```css:line-numbers=178
:-moz-focusring:where(:not(iframe)) {
  outline: auto;
}
```

## 前提知識

- **フォーカス**: キーボードの Tab キーなどで、今操作の対象になっている要素のことです。フォーカスされた要素には、通常は枠が付きます。
- **outline**: 要素の外側に描かれる枠です。`border` と違って、要素の大きさには影響しません。
- **auto**: `outline` で、ブラウザが推奨するフォーカス枠を使うという値です。
- **:-moz-focusring**: Firefox 独自の疑似クラスです。キーボード操作でフォーカスされたときに一致します。
- **:not(iframe)**: `iframe` 以外の要素に一致させる否定の指定です。`:where` で囲んで、詳細度をゼロにしています。

## 何をしているか

### 1. キーボードでフォーカスされた要素を対象にする

```css:line-numbers=178
:-moz-focusring:where(:not(iframe)) {
  outline: auto;
}
```

`:-moz-focusring` は、Firefox でキーボード操作によってフォーカスされている要素に一致します。`:where(:not(iframe))` で、対象を `iframe` 以外にしぼります。`iframe` は中にほかのページを表示する要素で、そこにフォーカス枠を重ねると二重になるため、対象から外しています。

`outline: auto` で、ブラウザが推奨する見た目の枠を使います。コメントにあるとおり、これは Firefox の新しいフォーカス表示に合わせるための指定です。

## ここがすごい

- キーボード操作のときだけ枠を出すことで、マウスの利用者には余計な枠が出ません。アクセシビリティのための、見た目と操作の両立です。
- `:where` を使っているので、詳細度がゼロになります。利用者が `outline` を書いたときは、その指定が優先されます。
- 素直に `*:focus { outline: 2px solid blue; }` と書くと、マウスでクリックしたときにも枠が出ます。また、利用者が独自の枠を付けたいときに上書きしにくくなります。
- `iframe` を除外するという細かい配慮で、二重の枠の表示を防いでいます。

## まとめ

- キーボードでのフォーカスは、利用者が今どこにいるかを知るための重要な目印です。
- `:-moz-focusring` は、キーボード操作のときだけ一致させる Firefox 独自の疑似クラスです。
- `outline: auto` で、ブラウザが推奨する枠を使えます。
- `:where` で詳細度を抑えると、利用者が後から枠を変えやすくなります。
