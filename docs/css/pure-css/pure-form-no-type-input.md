---
title: "type がない入力欄も同じ見た目にする"
description: "Pure CSS の .pure-form input:not([type]) は、type 属性を書いていない input にも、他の入力欄と同じ余白、枠、角丸を当てる。古い IE 向けに別のルールに分けた理由も含む。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/forms/css/forms.css
lines: [38, 44]
function: "\".pure-form input:not([type])\""
difficulty: 2
format: 2
tags: [フォーム, 移植性]
---
## ひとことで

Pure CSS は、`type` を書いていない `input` にも、他の入力欄と同じ見た目を当てています。書き忘れがあっても、フォームの外観が崩れないようにするためです。

## コード

```css:line-numbers=38
.pure-form input:not([type]) {
    padding: 0.5em 0.6em;
    display: inline-block;
    border: 1px solid #ccc;
    box-shadow: inset 0 1px 3px #ddd;
    border-radius: 4px;
    box-sizing: border-box;
```

## 前提知識

- **input の既定の型**: `type` を省略した `input` は、テキスト欄として扱われます。見た目が違うと、フォームがばらつきます。
- **:not([type])**: 属性がない要素だけを選ぶ書き方です。`not` の中に属性名だけを書けば、属性の有無で選べます。
- **古いブラウザ**: 古い IE は、疑似クラスを含むセレクタを読めませんでした。そのため Pure は、この書き方を前のルールから分けています。

## 何をしているか

### 1. 型のない欄を選ぶ

```css:line-numbers=38
.pure-form input:not([type]) {
```

`type` 属性を持たない input を選びます。前のルールの型指定から漏れた欄を、受け止めるための書き方です。

### 2. 他の欄と同じ見た目にする

```css:line-numbers=39
    padding: 0.5em 0.6em;
    display: inline-block;
    border: 1px solid #ccc;
    box-shadow: inset 0 1px 3px #ddd;
    border-radius: 4px;
    box-sizing: border-box;
```

余白、表示の形、枠、影、角丸、箱の大きさの計算を、型指定のある欄と同じにしています。どの入力欄も、同じ見た目を持ちます。

## ここがすごい

`:not()` を別のルールに分けることで、古いブラウザでも、他の宣言が読めなくなる事故を防いでいます。互換性への配慮が、コメントと構造の両方に表れています。

## まとめ

型のない入力も同じ見た目に揃えることで、フォームの統一が崩れません。古い環境のための分け方も、読みどころです。
