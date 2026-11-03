---
title: "小さな画面では吹き出しの幅を 90vw にする"
description: "max-width 768px 以下の画面で、xlarge の吹き出しを画面幅の 90% に縮める media query。固定の幅が画面からはみ出す問題を防ぐ。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [130, 132]
function: "\"@media screen and (max-width: 768px)\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 移植性]
---
## ひとことで

画面の幅が 768px 以下のとき、`xlarge` の吹き出しの幅を画面幅の 90% にするルールです。`xlarge` は固定の 380px で大きい幅なので、スマートフォンでは画面からはみ出してしまいます。そこで、小さな画面に限って幅を画面に合わせて縮めています。

## コード

```css:line-numbers=130
    @media screen and (max-width: 768px) {
      [aria-label][data-balloon-pos][data-balloon-length="xlarge"]:after {
        width: 90vw; } }
```

## 前提知識

- **media query**: 画面の幅や向きなどの条件によって、適用する CSS を変える仕組みです。`@media` で書きます。
- **max-width: 768px**: 画面の幅が 768px 以下のときに一致する条件です。タブレットやスマートフォンの多くが含まれます。
- **vw 単位**: ブラウザの画面の幅を 100 としたときの割合を表す単位です。`90vw` は画面幅の 90% です。
- **固定幅**: `380px` のように、画面の大きさに関係なく決まった長さのことです。

## 何をしているか

### 1. 小さな画面だけに条件をつける

```css:line-numbers=130
    @media screen and (max-width: 768px) {
      [aria-label][data-balloon-pos][data-balloon-length="xlarge"]:after {
```

`@media screen and (max-width: 768px)` のブロックの中だけ、ルールが適用されます。画面が大きいときは、前のルールの `380px` がそのまま使われます。

### 2. 画面幅の 90% にする

```css:line-numbers=132
        width: 90vw; } }
```

`width: 90vw` で、吹き出しの幅を画面の幅の 90% にします。固定の 380px よりも画面が狭いときは、この値の方が小さくなるので、画面からはみ出しません。

## ここがすごい

- 固定の幅を書いたうえで、小さな画面だけ別の値に変えるという、レスポンシブデザインの基本の書き方です。
- `vw` を使うと、画面の幅に比例して吹き出しが縮みます。ブレークポイントごとに値を書き分ける必要がありません。
- 素直に `max-width: 100%` を書いても、吹き出しの位置の計算が合わなくなることがあります。このライブラリは、幅そのものを変える方法を選んでいます。
- `xlarge` だけに条件を付けているので、他の大きさの吹き出しは、そのままの幅を保ちます。

## まとめ

- `@media` で、画面の幅に応じて適用するスタイルを変えられます。
- 固定の幅が大きすぎるときは、`vw` で画面の幅に合わせると安全です。
- 条件を一部の部品だけに絞ると、ほかの部品の見た目を変えずに済みます。
- 小さな画面でのはみ出しは、レスポンシブデザインの代表的な落とし穴です。
