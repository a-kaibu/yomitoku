---
title: "コードとキーボード入力を同じ等幅で表示する"
description: "normalize.css は code・kbd・samp に monospace の font-family と 1em の font-size を与え、ブラウザごとに異なる等幅フォントの大きさを、本文の大きさに合わせる。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [105, 110]
function: "\"code, kbd, samp\""
difficulty: 2
format: 2
tags: [フォーム, 移植性]
---
## ひとことで

normalize.css は、コード、キーボード入力、出力を表す三つの要素に、等幅のフォントを指定します。ブラウザによって大きく見える等幅の文字を、本文に近い大きさにそろえます。

## コード

```css:line-numbers=105
code,
kbd,
samp {
  font-family: monospace, monospace; /* 1 */
  font-size: 1em; /* 2 */
}
```

## 前提知識

- **code・kbd・samp**: それぞれコード、キーボードの入力、プログラムの出力を表す HTML の要素です。
- **monospace**: 文字の幅がすべて同じフォントを表す総称です。コードの桁がそろって見えます。
- **等幅フォントの大きさ**: 等幅フォントは、同じ数値でも本文より大きく見えることがあります。ブラウザごとに、その差が違いました。

## 何をしているか

### 1. 等幅フォントを指定する

```css:line-numbers=105
code,
kbd,
samp {
  font-family: monospace, monospace; /* 1 */
```

三つの要素に、monospace を二つ並べて指定します。一つ目が使えない場合も、次の候補で等幅のフォントが選ばれます。

### 2. 大きさをそろえる

```css:line-numbers=109
  font-size: 1em; /* 2 */
```

font-size を 1em にして、親の文字の大きさに合わせます。等幅なのに大きすぎる、という問題を防げます。

## ここがすごい

フォントを一つだけ書くのではなく、総称の monospace を付けることで、環境にある等幅の字体に任せています。

コードの文字は、等幅であることで、字下げや記号の位置が縦にそろいます。そのため、どの環境でも同じ大きさに見えることが大切です。キーボードの入力を表す kbd は、ボタンのような小さな箱で示されることが多く、大きさの違いが目立ちやすい要素です。ここでは三つの要素をまとめて、表示の差を抑えています。

## まとめ

等幅の指定と大きさの指定を組み合わせると、コードの文字が本文と自然に馴染みます。
