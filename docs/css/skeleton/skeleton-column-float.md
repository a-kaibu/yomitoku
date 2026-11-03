---
title: "float: left で列を横に並べる古典的な書き方"
description: ".column と .columns に width 100% と float: left を指定し、横に並ぶ列を作る。flex が使えない時代の、グリッドの列の基本の形。"
language: css
project: undefined
repo: https://github.com/dhg/Skeleton
license: MIT
copyright: "\"Copyright (c) 2011-2014 Dave Gamache\""
commit: "88f03612b05f093e3f235ced77cf89d3a8fcf846"
file: css/skeleton.css
lines: [38, 42]
function: "\".column, .columns\""
difficulty: 2
format: 2
tags: [イディオム, 設計パターン]
---
## ひとことで

列を表す `.column` と `.columns` のクラスに、幅 100% と `float: left` を指定するルールです。`float` で列を左から詰めて並べると、同じ行に複数の列が横に並びます。幅は、後のメディアクエリで割合を変えて、列の数を決めます。

## コード

```css:line-numbers=38
.column,
.columns {
  width: 100%;
  float: left;
  box-sizing: border-box; }
```

## 前提知識

- **float**: 要素を左または右に寄せ、周りの文字がその横に回り込むようにする指定です。`float: left` は、左に寄せて並べます。
- **width: 100%**: 既定では、列は親の幅いっぱいを使います。後から幅を割合で指定して、横に並べられるようにします。
- **box-sizing**: 幅に余白や枠線を含めるかどうかを決めるプロパティです。
- **グリッド**: 画面を格子に分けて、部品を並べる考え方です。Skeleton では 12 分割の列を使います。

## 何をしているか

### 1. 列を左に寄せる

```css:line-numbers=40
  width: 100%;
  float: left;
```

`width: 100%` は、列の既定の幅を親いっぱいにします。`float: left` は、列を左から順に並べる指定です。幅の小さい列を並べると、同じ行に横並びになります。

### 2. 幅を border-box で数える

```css:line-numbers=42
  box-sizing: border-box; }
```

`box-sizing: border-box` は、列の幅に余白や枠線を含めます。割合で決めた幅が、余白で押し広げられることがありません。

## ここがすごい

- `flex` が普及する前の時代に、横並びのレイアウトを、わずか数行で作っています。
- `.column` と `.columns` の二つの名前で、どちらを使っても同じ動きになります。単数形と複数形の両方を用意した、使う人への配慮です。
- 素直に幅だけを指定して横並びにすると、列の高さがずれて、次の行の位置が崩れやすくなります。float と後の clear を組み合わせることで、その問題を扱います。
- `box-sizing` を一緒に指定しているので、割合で決めた幅が、余白の分だけはみ出しません。

## まとめ

- `float: left` で、要素を左から横に並べられます。
- 列の幅は割合で決め、余白は `border-box` に含めます。
- 単数と複数の両方の名前を用意すると、読みやすさと使いやすさが両立します。
