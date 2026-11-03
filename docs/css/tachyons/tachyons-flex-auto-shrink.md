---
title: "伸び縮みする項目が縮みすぎないようにする"
description: "Tachyons の .flex-auto は flex を 1 1 auto にし、min-width と min-height を 0 にする。内容の長い項目が、箱の中で伸縮する際に、はみ出しや縮みすぎを避けるための指定。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_flexbox.css
lines: [17, 21]
function: "\".flex-auto\""
difficulty: 3
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

Tachyons の `.flex-auto` は、flex の項目が、余った幅を取り、必要なら縮むようにするクラスです。最小の幅と高さを 0 にして、中身の大きさに引きずられないようにしています。

## コード

```css:line-numbers=17
.flex-auto {
  flex: 1 1 auto;
  min-width: 0; /* 1 */
  min-height: 0; /* 1 */
}
```

## 前提知識

- **flex: 1 1 auto**: 伸びる係数、縮む係数、基本の大きさの三つを表す省略形です。ここでは、余った幅を取り、縮むことも許します。
- **min-width と min-height**: 要素の最小の幅と高さです。既定の値は auto で、中身より小さくなれません。
- **Chrome 44 の不具合**: 古い Chrome では、flex の項目が正しく縮まないことがありました。その回避として、最小の値を 0 にする指定が書かれています。

## 何をしているか

### 1. 古いブラウザへの対応

```css:line-numbers=19
  min-width: 0; /* 1 */
  min-height: 0; /* 1 */
```

最小の幅と高さを 0 にします。項目の中身が長くても、縮む余地が生まれます。

### 2. 伸縮の基本

```css:line-numbers=17
.flex-auto {
  flex: 1 1 auto;
```

余った幅を取り、縮むことを許し、基本の大きさは中身に合わせます。flex-auto と組み合わせると、残りの幅を埋める項目になります。

## ここがすごい

仕様の振る舞いと、過去のブラウザの不具合への回避が、コメントと一緒に残されています。使う側は、なぜ min-width が 0 なのかを、そのまま理解できます。

項目が伸び縮みするときは、中身の長い文字列が、箱の幅を押し広げてしまうことがあります。最小の幅を 0 にすると、その押し返しを止めて、箱の中で縮むことができます。ただし、縮めすぎると文字が切れるため、overflow や省略の指定と組み合わせて使うのが一般的です。この二行は、伸縮の余地を作るための、控えめで確実な書き方です。

## まとめ

flex の伸縮と最小の大きさを 0 にする組み合わせは、長い内容の項目を箱に収めるための基本の形です。
