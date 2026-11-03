---
title: "見出しと強調の文字を太く濃くする"
description: "Water.css は見出しと strong の色を黒にし、見出し・b・strong・th の太さを 600 にする。本文より濃い文字で、強調と見出しを同じ太さに揃える書き方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [31, 51]
function: "\"h1, h2, h3, h4, h5, h6, b, strong, th\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Water.css は、見出しと強調の文字を、本文より濃く太く見せます。本文の灰色に対して、見出しや強調が黒く浮かび上がるようにしています。

## コード

```css:line-numbers=31
h1,
h2,
h3,
h4,
h5,
h6,
strong {
  color: #000000;
}

h1,
h2,
h3,
h4,
h5,
h6,
b,
strong,
th {
  font-weight: 600;
}
```

## 前提知識

- **font-weight**: 文字の太さを決めるプロパティです。数値の 600 は、通常の 400 より太く、700 の太字より少し控えめな太さです。
- **strong と b**: どちらも太字を表す要素です。strong は意味として強調し、b は見た目の太字として使われます。
- **th**: 表の見出しのセルです。ブラウザは既定で太字にしますが、ここでは同じ太さに揃えています。

## 何をしているか

### 1. 色を濃くする

```css:line-numbers=31
h1,
h2,
h3,
h4,
h5,
h6,
strong {
  color: #000000;
}
```

見出しと strong の文字色を黒にします。本文の灰色と並んだとき、見出しや強調が、はっきり区別されます。

### 2. 太さを揃える

```css:line-numbers=41
h1,
h2,
h3,
h4,
h5,
h6,
b,
strong,
th {
  font-weight: 600;
}
```

見出し、b、strong、th の太さを 600 にそろえます。表の見出しも、見出しと同じ重さで読めます。

## ここがすごい

見出しの色と太さを、強調と表の見出しにも同じように使うことで、文書の中の「重要な部分」が一貫して示されます。

見出しや強調が本文と同じ色と太さだと、文書の中で何が大事か分かりにくくなります。黒い濃い文字と、600 の太さを組み合わせると、本文の灰色との差がはっきりと出ます。表の見出しも同じ太さにそろえることで、表の読み始めの位置が、文書の他の見出しと一貫して見えます。

## まとめ

見出しや強調の色と太さを一つのルールで揃えると、ページ全体の強弱が分かりやすくなります。
