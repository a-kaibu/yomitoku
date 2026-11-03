---
title: "ボタンの左右の余白を広く取る"
description: "Water.css は button と submit・button の input に、左右それぞれ 30px の余白を与え、文字の数が少なくても、ボタンが細く見えないようにする。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [122, 125]
function: "\"button, input[type='submit'], input[type='button']\""
difficulty: 1
format: 2
tags: [フォーム, 配色]
---
## ひとことで

Water.css は、ボタンの左右の内側の余白を 30px にします。短い言葉のボタンでも、押せる面積が十分にある、ゆったりした形になります。

## コード

```css:line-numbers=122
button, input[type='submit'], input[type='button'] {
  padding-right: 30px;
  padding-left: 30px;
}
```

## 前提知識

- **padding**: 要素の内側の余白です。枠線と文字の間の空きを表します。
- **左右の余白**: ボタンは、文字の左右に余白があるほど、目立つ押しやすい形になります。
- **押しやすさ**: 小さなボタンは押し間違えが増えます。一定の幅があると、指が当たりやすくなります。

## 何をしているか

### 1. 右の余白

```css:line-numbers=123
  padding-right: 30px;
```

ボタンの右側の内側に 30px の余白を取ります。文字の右端が、枠から離れて見えます。

### 2. 左の余白

```css:line-numbers=124
  padding-left: 30px;
```

左側にも同じ 30px を取ります。文字の左右が釣り合い、中央に収まった形になります。

## ここがすごい

上下の余白は、もう一つのルールで決めているため、このルールは左右だけを扱います。役割を分けることで、ボタンの形を調整しやすくなっています。

ボタンの幅が文字の長さだけで決まると、短い言葉のボタンは細い棒のように見えてしまいます。左右の余白を広く取ると、ボタンは押しやすい面積と、安定した形を持ちます。30px という値は、一般的な文字の大きさの中で、文字と枠の釣り合いがよく見える目安です。上下の余白とは別に調整できるため、形の好みに合わせやすい指定です。

## まとめ

左右の余白を広げると、ボタンは押しやすい面積を持ち、見た目も安定して見えます。
