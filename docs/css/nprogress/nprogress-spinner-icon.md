---
title: "円形の回転アイコンを CSS の animation で回す"
description: "NProgress の .spinner-icon は、枠線の二辺だけに色を付けた円を、400ms の animation で回し続ける。画像を使わず、線と角丸だけで回転するスピナーを作る方法。"
language: css
project: undefined
repo: https://github.com/rstacruz/nprogress
license: MIT
copyright: "\"Copyright (c) 2013, 2014 Rico Sta. Cruz\""
commit: "e1a8b7fb6e059085df5f83c45d3c2308a147ca18"
file: nprogress.css
lines: [42, 54]
function: "\"#nprogress .spinner-icon\""
difficulty: 2
format: 2
tags: [アニメーション, 配色]
---
## ひとことで

NProgress の `.spinner-icon` は、右上に回る小さな円を作ります。枠線のうち二辺だけに色を付け、animation で回すことで、くるくる回る印になります。

## コード

```css:line-numbers=42
#nprogress .spinner-icon {
  width: 18px;
  height: 18px;
  box-sizing: border-box;

  border: solid 2px transparent;
  border-top-color: #29d;
  border-left-color: #29d;
  border-radius: 50%;

  -webkit-animation: nprogress-spinner 400ms linear infinite;
          animation: nprogress-spinner 400ms linear infinite;
}
```

## 前提知識

- **border**: 要素の四辺の枠線です。辺ごとに色や太さを変えられます。
- **border-radius: 50%**: 角を丸めて、正方形を円にする指定です。
- **animation**: 時間に沿って値を変えていく仕組みです。キーフレームの名前と、長さ、繰り返しを指定します。
- **box-sizing**: 幅の指定に、枠線を含めるかどうかを決めます。

## 何をしているか

### 1. 大きさと枠を決める

```css:line-numbers=43
  width: 18px;
  height: 18px;
  box-sizing: border-box;

```

18px の正方形を、枠線を含めた大きさで決めています。枠は透明にしたうえで、必要な辺だけ色を付けます。

### 2. 二辺だけ色を付ける

```css:line-numbers=47
  border: solid 2px transparent;
  border-top-color: #29d;
  border-left-color: #29d;
```

上と左だけに青を付けると、円の一部が色づきます。回ると、その色の付いた部分が移動して、回転して見えます。

### 3. 回し続ける

```css:line-numbers=52
  -webkit-animation: nprogress-spinner 400ms linear infinite;
          animation: nprogress-spinner 400ms linear infinite;
```

400ms の animation を、直線的な速さで無限に繰り返します。ベンダープレフィックスも付けて、古いブラウザに備えています。

## ここがすごい

画像やフォントを使わず、枠線の色の付け方だけで回るアイコンを作っています。色を変えるだけで、どの画面にも馴染みます。

## まとめ

border の一部に色を付け、animation で回すと、軽いスピナーになります。
