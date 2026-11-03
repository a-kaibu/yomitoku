---
title: "省略語を一回り小さく大文字で表す .initialism"
description: "Bootstrap の .initialism は、font-size を小さな変数の値にし、text-transform: uppercase で大文字にする。頭字語や略語を、本文の中で目立ちすぎずに示すためのクラス。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [574, 577]
function: "\".initialism\""
difficulty: 1
format: 2
tags: [文字列処理, 可読性]
---
## ひとことで

`initialism` というクラスを付けた要素（主に `abbr` や `small` を想定）を、小さめの文字で大文字にするルールです。頭字語（HTML や CSS のような、頭文字をつないだ語）を、本文の中で少し控えめに見せるための指定です。

## コード

```css:line-numbers=574
  .initialism {
    font-size: var(--bs-initialism-font-size, var(--bs-font-size-xs));
    text-transform: uppercase;
  }
```

## 前提知識

- **頭字語（initialism）**: 単語の頭文字をつないで作った語です。HTML、CSS、URL などが例です。
- **text-transform**: 文字の大文字と小文字を、見た目の上で変えるプロパティです。HTML の中身は変わりません。
- **uppercase**: 文字をすべて大文字で表す値です。
- **var() のフォールバック**: 変数が定義されていなければ、後ろに書いた値を使う仕組みです。

## 何をしているか

### 1. 文字の大きさを変数で決める

```css:line-numbers=575
    font-size: var(--bs-initialism-font-size, var(--bs-font-size-xs));
```

`font-size` は、`--bs-initialism-font-size` という変数があればその値を、なければ `--bs-font-size-xs` の値を使います。二段のフォールバックで、ライブラリの既定と、利用者の調整の両方に対応しています。

### 2. 大文字にする

```css:line-numbers=576
    text-transform: uppercase;
```

`text-transform: uppercase` で、表示だけを大文字にします。HTML に書かれた文字は変わらないので、コピーや読み上げには元の綴りが残ります。

## ここがすごい

- 文字の大きさを、変数の二段のフォールバックで決めているので、テーマの調整も既定の値も、同じ書き方で扱えます。
- 大文字は `text-transform` で表すので、HTML の綴りを変えずに済みます。検索や読み上げで、元の語がそのまま使われます。
- 素直に `font-size: 0.8em` と固定すると、テーマで文字サイズを変えたときに、略語だけがずれてしまいます。変数にしておくと、全体の調子と揃います。
- 大文字にするという見た目は、本文の中の略語を目立たせる、控えめな工夫です。

## まとめ

- `text-transform: uppercase` で、表示だけを大文字にできます。
- フォールバックを重ねると、既定の値と利用者の調整を両立できます。
- 見た目の変更は、元の文字の綴りを変えません。
