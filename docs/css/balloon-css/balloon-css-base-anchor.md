---
title: "aria-label を持つ要素だけに吹き出しの起点を作る"
description: "aria-label と data-balloon-pos の両方を持つ要素を position: relative にし、その中に吹き出しの疑似要素を配置する。カーソルも指の形に変える起点のルール。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [11, 13]
function: "\"[aria-label][data-balloon-pos]\""
difficulty: 1
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`aria-label` と `data-balloon-pos` の両方を持つ要素に、吹き出しの基準点を作るルールです。`position: relative` によって、この要素の中に配置された吹き出しは、要素を基準にして位置が決まります。また、`cursor: pointer` でマウスを乗せたときの形を指の形にします。

## コード

```css:line-numbers=11
[aria-label][data-balloon-pos] {
  position: relative;
  cursor: pointer; }
```

## 前提知識

- **position: relative**: 要素を通常の位置のまま、子の配置の基準にするプロパティです。子に `position: absolute` を付けたとき、この要素の箱が基準になります。
- **position: absolute**: 要素を、基準の箱からの相対位置で置くプロパティです。吹き出しの本体はこの指定で描かれます。
- **cursor**: マウスを乗せたときの矢印の形を決めるプロパティです。`pointer` は指の形になり、クリックできることを示します。
- **疑似要素**: `:before` や `:after` のように、HTML にない仮想の子要素を作る仕組みです。

## 何をしているか

### 1. 吹き出しの基準になる箱を作る

```css:line-numbers=11
[aria-label][data-balloon-pos] {
  position: relative;
```

`position: relative` で、この要素を後で配置する吹き出しの基準にします。この要素自体は、普段どおりの場所に残ります。位置を動かさず、基準だけを用意するのがこの指定の役目です。

### 2. カーソルを指の形にする

```css:line-numbers=13
  cursor: pointer; }
```

`cursor: pointer` は、マウスを乗せたときに指の形を表示します。吹き出しはツールチップなので、もともとは説明を読むための要素です。それでも、その要素がクリックできるなら、指の形で示すのが自然です。

## ここがすごい

- 吹き出しの本体を、要素の中の疑似要素として作っているので、HTML に余計な要素を追加する必要がありません。
- 対象を `aria-label` と `data-balloon-pos` の両方に絞っているので、吹き出しを使わない要素には何も起きません。
- 素直に JavaScript で吹き出しの要素を作ると、ページの構造が複雑になり、位置の計算も必要になります。CSS だけの基準点にすると、位置は勝手に要素に追従します。
- `aria-label` を、画面読み上げにも使う名前として使っています。見た目の説明と、読み上げの説明を同じ属性でまかなっています。

## まとめ

- `position: relative` で、子の吹き出しの基準点を作ります。
- 吹き出しの本体は、疑似要素として CSS だけで作れます。
- `cursor: pointer` で、説明つきの要素が操作できることを示せます。
- 属性を条件にすると、必要な要素だけに仕組みが働きます。
