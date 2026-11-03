---
title: "マウスで押したボタンのフォーカス枠だけを消す"
description: "Bootstrap の Reboot は button:focus:not(:focus-visible) の outline を 0 にして、マウスでクリックしたときだけフォーカスの枠を消す。キーボード操作の枠は残す。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [739, 741]
function: "\"button:focus:not(:focus-visible)\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 移植性]
---
## ひとことで

ボタンにフォーカスが当たっていても、キーボード操作によるフォーカスではないとき（主にマウスでクリックしたとき）に、枠の線を消すルールです。キーボードでボタンを移動したときは、枠が残るので、誰にでも今の位置が見えます。

## コード

```css:line-numbers=739
  button:focus:not(:focus-visible) {
    outline: 0;
  }
```

## 前提知識

- **フォーカス**: 操作の対象になっている要素のことです。Tab キーで移ったり、クリックで当たったりします。
- **:focus-visible**: キーボード操作などで、フォーカスの枠を見せるべき場合に一致する疑似クラスです。
- **:not()**: 条件に一致しない要素を選ぶ疑似クラスです。
- **outline**: 要素の外側に描かれる枠線です。箱の大きさは変わりません。

## 何をしているか

### 1. フォーカスされているが、キーボードのフォーカスではないとき

```css:line-numbers=739
  button:focus:not(:focus-visible) {
```

`button:focus` は、フォーカスされたボタンに一致します。`:not(:focus-visible)` で、キーボード操作によるフォーカスではない場合に絞ります。マウスでクリックしたときが、ここに当たります。

### 2. 枠を消す

```css:line-numbers=740
    outline: 0;
```

`outline: 0` で、その枠を消します。マウスで押したボタンに、強調の枠が残らないようにします。

## ここがすごい

- 「キーボードの人には枠を残し、マウスの人には余計な枠を出さない」という、二つの利用者への配慮を一つの条件で実現しています。
- 枠を消すのはクリックの場合だけなので、フォーカスの枠を完全に消す危険な書き方を避けています。
- 素直に `button:focus { outline: none; }` と書くと、キーボードの利用者がどこにいるかわからなくなります。`:focus-visible` で条件を分けると、この問題を防げます。
- 見た目の美しさと、操作のわかりやすさを両立させた、現代的なフォーカスの扱い方です。

## まとめ

- `:focus-visible` は、キーボード操作のときにフォーカスを見せる条件です。
- `:not(:focus-visible)` で、マウスのクリックの場合だけ枠を消せます。
- フォーカスの枠を消すときは、キーボードの利用者を忘れないことが大切です。
