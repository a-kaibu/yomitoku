---
title: "親にマウスを乗せたとき子の文字を現す"
description: "Tachyons の .hide-child は、親に付けたクラスの中の .child を opacity 0 で隠し、hover・focus・active で 1 に戻す。説明文を、必要なときだけ見せる仕組み。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_hovers.css
lines: [63, 72]
function: "\".hide-child .child\""
difficulty: 2
format: 2
tags: [アニメーション, 疑似要素]
---
## ひとことで

Tachyons の `.hide-child` は、親の箱にマウスを乗せたときだけ、中の `.child` の要素を表示する仕組みです。補足の文字やボタンを、普段は隠しておけます。

## コード

```css:line-numbers=63
.hide-child .child {
  opacity: 0;
  transition: opacity .15s ease-in;
}
.hide-child:hover  .child,
.hide-child:focus  .child,
.hide-child:active .child {
  opacity: 1;
  transition: opacity .15s ease-in;
}
```

## 前提知識

- **:hover・:focus・:active**: マウスやキーボードの操作の状態を表す疑似クラスです。乗せた、選んだ、押したの三つを、同じ反応として扱います。
- **親子の関係**: 子孫セレクタの空白は、中のどこにあっても対象になることを表します。深く入れ子になっていても、同じクラスで届きます。
- **opacity**: 透明度です。0 にすると見えなくなりますが、要素は場所を占めたままです。

## 何をしているか

### 1. 子を隠しておく

```css:line-numbers=63
.hide-child .child {
  opacity: 0;
  transition: opacity .15s ease-in;
}
```

親の中の `.child` は、普段は透明度 0 です。見えないけれど、レイアウトの場所は確保されています。

### 2. 親の状態で現す

```css:line-numbers=67
.hide-child:hover  .child,
.hide-child:focus  .child,
.hide-child:active .child {
  opacity: 1;
  transition: opacity .15s ease-in;
```

親が hover・focus・active の状態になると、子の透明度が 1 に変わります。キーボードでも、同じ操作で表示されます。

## ここがすごい

隠す指定と現す指定を、親と子に分けて書いているため、HTML の子の数が増えても、CSS は変わりません。乗せた瞬間に、すべての子がまとめて現れます。

説明や補足を常に出すと、画面が文字で埋まってしまいます。親の操作に応じて子を現すと、必要な情報だけを、その場で読めるようになります。隠した要素も場所は残るため、表示が切り替わってもレイアウトがずれません。HTML の子の数に関係なく、一つのクラスで全体を制御できる点も、この書き方の特徴です。

## まとめ

親の状態を条件にして子の透明度を変えると、必要なときだけ見える説明を、一つのクラスの組で作れます。
