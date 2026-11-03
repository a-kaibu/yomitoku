---
title: "水平線を枠線の一本だけで描く"
description: "Water.css は hr の枠をすべて消し、上の枠線だけを 1px の薄い灰色にする。文章の区切りを、重くならない細い線で示す指定。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [198, 201]
function: "\"hr\""
difficulty: 1
format: 2
tags: [配色, レイアウト]
---
## ひとことで

Water.css の `hr` は、枠線をすべて消して、上の一本だけを薄い灰色の線にします。文章の区切りを、重くならない細い線で示します。

## コード

```css:line-numbers=198
hr {
  border: none;
  border-top: 1px solid #dbdbdb;
}
```

## 前提知識

- **hr 要素**: 話題の区切りを表す HTML の要素です。見た目は、ブラウザの既定の枠線で描かれることが多いです。
- **border**: 四辺の枠線を表すプロパティです。none は枠を消し、border-top は上の辺だけを指定します。
- **色の選び**: 区切りの線は、本文より薄い色にすると、文章の流れを邪魔しません。

## 何をしているか

### 1. 枠をすべて消す

```css:line-numbers=199
  border: none;
```

まず枠線を none にして、既定の枠をすべて消します。ブラウザごとの違いを、ここで一度リセットします。

### 2. 上の一本だけ残す

```css:line-numbers=200
  border-top: 1px solid #dbdbdb;
```

上の辺にだけ 1px の薄い灰色の線を引きます。区切りの線が、細く軽く見えます。

## ここがすごい

既定の枠を消してから、必要な辺だけを足す書き方です。ブラウザの違いを気にせず、一本の線だけを確実に出せます。

区切りの線が太いと、文章の流れが途切れて見えます。細い線にすると、話題が変わることだけを静かに示せます。線の色を薄くすれば、背景との対比が小さく、本文の読みやすさを保てます。枠を一度消してから必要な辺だけ足す書き方は、ブラウザの違いを気にせず線を描くための、確かな方法です。

## まとめ

hr の枠を一度消して上の一本だけを残すと、文章の区切りを、静かな線で示せます。
