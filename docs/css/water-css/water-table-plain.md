---
title: "表の枠を消して余白で段を分ける"
description: "Water.css は table を幅 100%、線の重なりなしにし、td と th に余白 6px と左寄せを与える。表の枠線を減らし、余白で列と行を区切る書き方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [203, 207]
function: "\"table\""
difficulty: 2
format: 2
tags: [レイアウト, 可読性]
---
## ひとことで

Water.css は、表の全幅と線の重なりを整え、表の下に余白を取ります。細かい枠線を増やさず、余白だけで読みやすい表にします。

## コード

```css:line-numbers=203
table {
  border-collapse: collapse;
  margin-bottom: 10px;
  width: 100%;
}
```

## 前提知識

- **table 要素**: 表を表す HTML の要素です。行と列の交点に、セルを置きます。
- **border-collapse**: 隣り合うセルの枠線を、一本にまとめるかどうかを決めます。collapse は重ねて一本にします。
- **width: 100%**: 親の幅いっぱいに広げる指定です。表が本文の幅に収まります。

## 何をしているか

### 1. 線を重ねる

```css:line-numbers=204
  border-collapse: collapse;
```

隣り合う枠線を一本にまとめます。二重の線が出ず、すっきりした表になります。

### 2. 幅と余白

```css:line-numbers=205
  margin-bottom: 10px;
  width: 100%;
```

表の下に 10px の余白を取り、幅を 100% にします。表の後の文章と、適切な距離が保たれます。

## ここがすごい

枠線を少なくし、余白で区切る考え方は、線が多い表より読みやすさを保ちやすい方法です。

表の枠線が多いと、線が文字より目立ってしまい、データの読みにくさにつながります。隣り合う線を一本にまとめ、余白で段を分けると、数字や文字が主役になります。左寄せにそろえた文字は、目が行に沿って読みやすくなり、比較の作業も楽になります。

表の中の段は、行の並びを追うための手がかりです。余白で段を分けておくと、線を引かなくても、目が自然に行を追えます。線が少ない表は、印刷やスマートフォンの画面でも、崩れにくいという利点もあります。表の下に余白を置くことで、表と次の文章が、適切な距離で区切られます。

## まとめ

線を重ねて一本にし、余白で段を分けると、表は軽く、読みやすく見えます。
