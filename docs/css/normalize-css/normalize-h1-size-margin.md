---
title: "見出し h1 の大きさと余白を決める"
description: "normalize.css は h1 の font-size を 2em、margin を 0.67em 0 にし、section や article の中でも同じ大きさに見せる。ブラウザごとに変わる見出しの既定値を、一つの値に寄せる。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [40, 43]
function: "\"h1\""
difficulty: 2
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

normalize.css は、見出しの `h1` の大きさと上下の余白を、ブラウザによらず同じ値にそろえます。文書の中で入れ子になった見出しで、大きさが変わってしまう問題を防ぐためです。

## コード

```css:line-numbers=40
h1 {
  font-size: 2em;
  margin: 0.67em 0;
}
```

## 前提知識

- **em**: 親要素の文字の大きさを 1 とする単位です。2em は、親の文字の 2 倍になります。
- **section と article**: 文書を区切るための要素です。ブラウザによっては、その中の h1 が小さく描かれる時期がありました。
- **見出しの余白**: 見出しの上下には、ブラウザが既定で余白を付けます。その値も、ブラウザごとに違っていました。

## 何をしているか

### 1. 文字の大きさ

```css:line-numbers=41
  font-size: 2em;
```

h1 の文字を親の 2 倍にします。どの区切りの中にあっても、見出しが大きく見えます。

### 2. 上下の余白

```css:line-numbers=42
  margin: 0.67em 0;
```

上下の余白を 0.67em にそろえます。見出しの前後の空きが、ブラウザが変わっても同じになります。

## ここがすごい

大きさを em で決めているため、見出しが入る場所の文字の大きさが変わっても、相対的な比率は保たれます。

見出しの大きさは、文書の構造と結びついた情報です。h1 が小さくなると、文書の一番大事な部分が伝わりにくくなります。normalize は、その基準を一定の比率で決めて、文書の入れ子によって大きさが変わる問題を防いでいます。余白も em で決めているため、見出しの大きさに比例して、前後の間隔も変わります。

## まとめ

h1 の大きさと余白を先に決めると、見出しのばらつきを、一つの値で押さえられます。
