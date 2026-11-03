---
title: "上向きの吹き出しを中央にそろえる translate(-50%)"
description: "上向きの吹き出しで、hover や visible のときに translate(-50%, 0) を当てて、要素の中央に吹き出しを揃える。幅が決まっていなくても中央になる仕組み。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [56, 57]
function: "\"[data-balloon-pos=\\\"up\\\"]:hover:after\""
difficulty: 3
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

上向きの吹き出し（`data-balloon-pos="up"`）が表示されているとき、その吹き出しを `translate(-50%, 0)` で左に半分ずらすルールです。吹き出しの左端を基準の位置に置いてから、幅の半分だけ戻すことで、要素の中央に吹き出しを揃えます。幅が事前にわからなくても、中央に出せるのがポイントです。

## コード

```css:line-numbers=56
  [aria-label][data-balloon-pos][data-balloon-pos="up"]:hover:after, [aria-label][data-balloon-pos][data-balloon-pos="up"][data-balloon-visible]:after, [aria-label][data-balloon-pos][data-balloon-pos="down"]:hover:after, [aria-label][data-balloon-pos][data-balloon-pos="down"][data-balloon-visible]:after {
    transform: translate(-50%, 0); }
```

## 前提知識

- **translate()**: 要素を、横と縦にずらす変形の関数です。`translate(-50%, 0)` は、横方向に自分の幅の半分だけ左へずらします。
- **% 単位の translate**: `%` は、ずらされる要素自身の幅や高さを基準にします。親の幅ではありません。
- **position: absolute**: 吹き出しを、基準の要素の中で好きな位置に置く指定です。左端が基準の位置に来ます。
- **transform**: 要素を回転、拡大、ずらすなどの変形を行うプロパティです。`translate` は transform の一つです。

## 何をしているか

### 1. 表示されているときだけ位置を変える

```css:line-numbers=56
  [aria-label][data-balloon-pos][data-balloon-pos="up"]:hover:after, [aria-label][data-balloon-pos][data-balloon-pos="up"][data-balloon-visible]:after, [aria-label][data-balloon-pos][data-balloon-pos="down"]:hover:after, [aria-label][data-balloon-pos][data-balloon-pos="down"][data-balloon-visible]:after {
    transform: translate(-50%, 0); }
```

`:hover:after` または `[data-balloon-visible]:after` が成り立つときに、上向きの吹き出しの本体だけを `translate(-50%, 0)` でずらします。普段は位置を変えず、表示のときだけ中央に寄せる仕組みです。

### 2. 中央にそろえる理由

吹き出しは、`position: absolute` で、基準の要素の左端に置かれます。そのままだと、吹き出しの左端が要素の左端に揃ってしまいます。`-50%` は吹き出し自身の幅の半分なので、吹き出しの中心が要素の左端に来ます。この計算で、要素の中央に吹き出しが揃います。

## ここがすごい

- 吹き出しの幅が、文字の長さや `data-balloon-length` で変わっても、ずらしの量は自動で決まります。幅を計算するための JavaScript が要りません。
- `translate` は、レイアウトを崩さずに位置だけを変えられる変形です。ほかの要素の配置を変えずに、吹き出しだけを動かせます。
- 素直に `left: 50%` で位置を決めると、吹き出しの中心ではなく、左端が中央に来てしまいます。`-50%` で戻すことで、中心を合わせています。
- 表示されるときだけずらすという条件が、ボタンの位置を崩さないための工夫です。

## まとめ

- `translate(-50%, 0)` で、吹き出しの幅の半分だけ左にずらせます。
- この変形で、吹き出しの中心を基準の要素の左端に合わせられます。
- 幅が事前にわからなくても、中央に出せます。
- 変形は、レイアウトを崩さずに位置を変える手段として便利です。
