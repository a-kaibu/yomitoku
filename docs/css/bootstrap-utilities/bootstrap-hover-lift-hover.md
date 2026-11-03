---
title: "ホバーとフォーカスで要素を持ち上げる"
description: "Bootstrap の .hover-lift:hover と :focus-visible は、同じ変形と影を当てる。マウスでもキーボードでも同じ持ち上がりになり、操作の方法に関係なく見た目がそろう。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [500, 503]
function: "\".hover-lift:hover, .hover-lift:focus-visible\""
difficulty: 2
format: 2
tags: [アクセシビリティ, 設計パターン]
---
## ひとことで

マウスを乗せたとき（`:hover`）と、キーボードでフォーカスしたとき（`:focus-visible`）の両方で、要素を上に持ち上げ、影を付けるルールです。マウスの人にもキーボードの人にも、同じ強調が見えるようにしています。

## コード

```css:line-numbers=500
  .hover-lift:hover, .hover-lift:focus-visible {
    transform: var(--bs-hover-lift-transform);
    box-shadow: var(--bs-hover-lift-box-shadow);
  }
```

## 前提知識

- **:hover**: マウスカーソルが要素の上にあるときに一致する疑似クラスです。
- **:focus-visible**: キーボード操作でフォーカスが当たったときに一致する疑似クラスです。
- **transform**: 要素を移動や回転させる変形のプロパティです。
- **box-shadow**: 要素の周りに影を描くプロパティです。

## 何をしているか

### 1. 二つの入り口を一つのルールにまとめる

```css:line-numbers=500
  .hover-lift:hover, .hover-lift:focus-visible {
```

カンマで `:hover` と `:focus-visible` を並べて、どちらかが成り立てば同じ宣言が当たります。マウスでもキーボードでも、同じ見た目になります。

### 2. 変形と影を当てる

```css:line-numbers=501
    transform: var(--bs-hover-lift-transform);
    box-shadow: var(--bs-hover-lift-box-shadow);
```

`transform` には、先ほどの変数の移動量が入ります。`box-shadow` には大きめの影が入ります。この二つで、要素が浮いて見えます。

## ここがすごい

- マウスの動きだけに反応させると、キーボードで移動する人は、今どこを選んでいるかがわかりにくくなります。二つの入り口を揃えることで、その差を消しています。
- 同じ宣言を二つの状態に当てているので、ルールの数が増えません。読む人も、一か所を見れば足ります。
- 素直に `:hover` だけに書くと、キーボードの利用者には強調が出ません。`:focus-visible` を足すことで、その抜けを防いでいます。
- 変形と影は、レイアウトを変えないプロパティです。周りの要素の位置は動きません。

## まとめ

- カンマで二つの状態を並べると、同じ強調を複数の操作に当てられます。
- `:focus-visible` を足すと、キーボードの利用者にも強調が届きます。
- `transform` と `box-shadow` は、周りのレイアウトを変えずに見た目を強められます。
