---
title: "hidden 属性は !important で必ず隠す"
description: "Bootstrap の Reboot は [hidden] に display: none !important を指定する。ほかのクラスで display を変えても、hidden 属性の要素は必ず見えなくなるように守る。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [849, 851]
function: "\"[hidden]\""
difficulty: 1
format: 2
tags: [防御的プログラミング, 設計パターン]
---
## ひとことで

HTML の `hidden` 属性が付いた要素を、必ず非表示にするルールです。`display: none !important` を指定しているので、ほかのクラスで `display: block` などを指定されても、この要素は隠れたままになります。

## コード

```css:line-numbers=849
  [hidden] {
    display: none !important;
  }
```

## 前提知識

- **hidden 属性**: 要素を表示しない HTML の属性です。JavaScript から付け外しして、表示と非表示を切り替えるのによく使われます。
- **display: none**: 要素を表示せず、場所も取らない指定です。
- **!important**: 他のどの指定よりも優先させる指定です。
- **詳細度とクラス**: クラスで `display: flex` などを指定すると、その要素の表示は変わります。`!important` は、その上書きよりも強く働きます。

## 何をしているか

### 1. hidden の要素を隠す

```css:line-numbers=849
  [hidden] {
    display: none !important;
  }
```

`[hidden]` という属性セレクタに一致する要素は、`display: none` になります。`!important` を付けているので、同じ要素に `display: flex` などのクラスが付いていても、非表示が勝ちます。

## ここがすごい

- `hidden` 属性の意味（隠す）を、ほかのクラスの指定から守っています。JavaScript が表示を切り替えるとき、クラスの指定に邪魔されないのが利点です。
- 一つのルールで、すべての要素の `hidden` を扱っています。どの要素にも、特別な書き方は要りません。
- 素直に `hidden` の要素を `display: none` だけで隠すと、クラスの `display` に負けることがあります。`!important` で、その逆転を防いでいます。
- `!important` は乱用するとほかの上書きが難しくなりますが、この一か所だけは、属性の意味を守るための例外です。

## まとめ

- `[hidden]` は属性セレクタで、属性を持つ要素だけに一致します。
- `display: none !important` で、ほかの表示の指定に負けずに隠せます。
- 属性の意味を守るための `!important` は、限られた場面で使うと効果的です。
