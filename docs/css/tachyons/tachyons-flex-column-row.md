---
title: "並ぶ向きを四つの名前で切り替える"
description: "Tachyons の flex-row・flex-column と、その reverse は flex-direction を四つの向きに決める。横並びと縦並び、逆順を、クラスの名前だけで切り替える指定。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_flexbox.css
lines: [25, 31]
function: "\".flex-column, .flex-row, .flex-wrap, .flex-nowrap\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Tachyons の `.flex-row` と `.flex-column` は、flex の項目を横に並べるか縦に並べるかを、クラスの名前で決めます。逆順の指定も並べて用意されています。

## コード

```css:line-numbers=25
.flex-column  { flex-direction: column; }
.flex-row     { flex-direction: row; }
.flex-wrap    { flex-wrap: wrap; }
.flex-nowrap    { flex-wrap: nowrap; }
.flex-wrap-reverse    { flex-wrap: wrap-reverse; }
.flex-column-reverse  { flex-direction: column-reverse; }
.flex-row-reverse     { flex-direction: row-reverse; }
```

## 前提知識

- **flex**: 項目を一列に並べ、幅や位置を決めやすくする表示方法です。
- **flex-direction**: 項目の並ぶ向きを決めるプロパティです。row は横、column は縦です。
- **reverse**: 並ぶ順番を逆にする指定です。row-reverse は右から左へ、column-reverse は下から上へ並べます。
- **flex-wrap**: 入りきらない項目を次の行に回すかどうかを決めます。

## 何をしているか

### 1. 向きを選ぶ

```css:line-numbers=25
.flex-column  { flex-direction: column; }
.flex-row     { flex-direction: row; }
```

column は縦に、row は横に並べます。どちらも、親の flex の中で向きを変える役割を持ちます。

### 2. 折り返しを選ぶ

```css:line-numbers=27
.flex-wrap    { flex-wrap: wrap; }
.flex-nowrap    { flex-wrap: nowrap; }
```

wrap は項目を次の行に回し、nowrap は一行に留めます。幅が足りないときの振る舞いを選べます。

### 3. 逆順を選ぶ

```css:line-numbers=29
.flex-wrap-reverse    { flex-wrap: wrap-reverse; }
.flex-column-reverse  { flex-direction: column-reverse; }
.flex-row-reverse     { flex-direction: row-reverse; }
```

wrap-reverse や column-reverse は、並ぶ順番を逆にします。表示の順序を変えずに、見た目の向きだけ変えたいときに使えます。

## ここがすごい

向きと折り返しと逆順を、それぞれ独立したクラスとして組み合わせられます。HTML の要素を増やさずに、レイアウトの変化を試せます。

## まとめ

flex の向きをクラスで選べるようにすると、同じ要素を、横にも縦にも並べ替えられます。
