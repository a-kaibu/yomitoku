---
title: "行間と文字の拡大をブラウザ間でそろえる"
description: "normalize.css は html に line-height 1.15 と -webkit-text-size-adjust: 100% を与え、ブラウザごとの行間の差と、iOS の向きの変化による文字の拡大を抑える。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [11, 14]
function: "\"html\""
difficulty: 2
format: 2
tags: [移植性, レスポンシブ]
---
## ひとことで

normalize.css は、ページ全体の基準になる `html` 要素に、行間と文字の拡大の扱いを決めています。ブラウザごとの既定値の差を、一か所で埋める指定です。

## コード

```css:line-numbers=11
html {
  line-height: 1.15; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
}
```

## 前提知識

- **line-height**: 行と行の間隔を決めるプロパティです。数値は文字の大きさに対する倍率で、1.15 は少し余裕のある行間です。
- **ブラウザの既定値**: ブラウザには、それぞれ独自の既定の行間や文字の大きさがあります。同じ HTML でも、表示がわずかに違う原因になります。
- **向きの変化**: スマートフォンを縦から横に回すと、ブラウザが文字を自動で大きくすることがあります。レイアウトが崩れる原因になります。
- **-webkit-text-size-adjust**: 向きの変化による文字の自動拡大を、ブラウザに許すかどうかを決める指定です。WebKit 系のブラウザで使われます。

## 何をしているか

### 1. 行間をそろえる

```css:line-numbers=12
  line-height: 1.15; /* 1 */
```

行間を 1.15 にそろえます。ブラウザごとに異なる既定の行間を、同じ数値で置き換えています。

### 2. 文字の自動拡大を止める

```css:line-numbers=13
  -webkit-text-size-adjust: 100%; /* 2 */
```

`-webkit-text-size-adjust: 100%` で、向きを変えたときに文字が勝手に大きくならないようにします。レイアウトの幅が予想どおり保たれます。

## ここがすごい

html に書くだけで、ページ全体の基準の値が決まります。子要素に個別の指定をしなくても、行間の基準がそろうので、後の調整が楽になります。

## まとめ

html の行間と拡大の扱いを先に決めると、ブラウザが違っても、同じ基準から組み立てられます。
