---
title: "進捗バーの先端を光らせて勢いを見せる"
description: "NProgress の .peg は、バーの右端に box-shadow の光を重ね、少し傾けて動かす。進み続けていることを、先端の光で伝えるための小さな装飾。"
language: css
project: undefined
repo: https://github.com/rstacruz/nprogress
license: MIT
copyright: "\"Copyright (c) 2013, 2014 Rico Sta. Cruz\""
commit: "e1a8b7fb6e059085df5f83c45d3c2308a147ca18"
file: nprogress.css
lines: [19, 31]
function: "\"#nprogress .peg\""
difficulty: 2
format: 2
tags: [アニメーション, 配色]
---
## ひとことで

NProgress の `.peg` は、進捗バーの先端に付く光の帯です。影を重ね、少し傾けて置くことで、読み込みが勢いよく進んでいるように見せます。

## コード

```css:line-numbers=19
#nprogress .peg {
  display: block;
  position: absolute;
  right: 0px;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px #29d, 0 0 5px #29d;
  opacity: 1.0;

  -webkit-transform: rotate(3deg) translate(0px, -4px);
      -ms-transform: rotate(3deg) translate(0px, -4px);
          transform: rotate(3deg) translate(0px, -4px);
}
```

## 前提知識

- **box-shadow**: 要素の外側に影や光を描くプロパティです。複数の影をカンマで並べられます。
- **transform**: 要素を回転させたり、移動させたりする指定です。ここでは 3 度の回転と、少しの上への移動を使っています。
- **position: absolute**: 親の中で位置を決めて、他の要素の流れから外す指定です。ここでは、バーの右端に置くために使います。

## 何をしているか

### 1. 先端に置く

```css:line-numbers=20
  display: block;
  position: absolute;
  right: 0px;
  width: 100px;
  height: 100%;
```

`.peg` を右端に置き、幅 100px、高さは親いっぱいにします。バーの先端だけを、光る帯として扱います。

### 2. 光を重ねる

```css:line-numbers=25
  box-shadow: 0 0 10px #29d, 0 0 5px #29d;
  opacity: 1.0;
```

青い影を二つ重ね、近い光と遠い光を作ります。不透明度は 1 のままで、影の強さだけで光を表します。

### 3. 傾けて動きを出す

```css:line-numbers=28
  -webkit-transform: rotate(3deg) translate(0px, -4px);
      -ms-transform: rotate(3deg) translate(0px, -4px);
          transform: rotate(3deg) translate(0px, -4px);
```

3 度の回転と、少しの上への移動を組み合わせ、先端が跳ねているように見せます。ベンダープレフィックスを三つ書いて、古いブラウザでも動くようにしています。

## ここがすごい

装飾は、影と変形だけで作られていて、画像を一枚も使いません。バーの幅が変わっても、先端の光はそのまま付いていきます。

## まとめ

box-shadow と transform を重ねるだけで、進捗バーに勢いを与えられます。
