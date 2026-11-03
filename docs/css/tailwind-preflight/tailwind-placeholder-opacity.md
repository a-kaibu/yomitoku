---
title: "Firefox の既定の薄いプレースホルダーを元に戻す"
description: "::placeholder の opacity を 1 にして、Firefox が既定で薄く描くプレースホルダーの文字を、他のブラウザと同じ濃さにそろえる。入力欄の見た目のばらつきを消すリセット。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [287, 289]
function: "\"::placeholder\""
difficulty: 1
format: 2
tags: [移植性, 防御的プログラミング]
---
## ひとことで

入力欄の中に薄く表示される案内の文字（プレースホルダー）の透明度を `1` にするルールです。Firefox は、この案内の文字を既定で少し薄く描きます。このルールで、Firefox でも他のブラウザと同じ濃さで表示されるようにしています。

## コード

```css:line-numbers=287
::placeholder {
  opacity: 1;
}
```

## 前提知識

- **プレースホルダー**: 入力欄が空のときに、何を入力すればよいかを示す薄い文字です。`placeholder` 属性で書きます。
- **::placeholder**: プレースホルダーの文字を表す疑似要素です。
- **opacity**: 要素の不透明度です。`1` は完全に不透明、`0` は完全に透明です。
- **既定の色の違い**: ブラウザごとに、案内の文字の色や濃さは、少しずつ違います。

## 何をしているか

### 1. 透明度を 1 にする

```css:line-numbers=288
  opacity: 1;
```

`opacity: 1` は、案内の文字を完全に不透明にします。コメントに書かれているとおり、この指定は Firefox 向けに、既定の薄さを打ち消すためのものです。

## ここがすごい

- 色ではなく透明度だけを上書きしているので、案内の文字の色そのものは、後から変えられます。
- 「既定が薄い」という、目立ちにくいブラウザごとの差を、一行で揃えています。
- 素直に、プレースホルダーの色を直接決めると、他のブラウザとの差が残ります。透明度を揃えるほうが、ブラウザ間の差をそのまま消せます。
- 案内の文字が薄すぎると、入力の目安が読めなくなります。濃さを揃えることは、読みやすさの配慮でもあります。

## まとめ

- `::placeholder` は、入力欄の案内の文字を表す疑似要素です。
- Firefox は既定で、この文字を少し薄く描きます。
- `opacity: 1` で、ブラウザ間の濃さを揃えられます。
