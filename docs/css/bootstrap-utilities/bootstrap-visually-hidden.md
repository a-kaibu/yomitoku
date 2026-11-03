---
title: "画面には出さず、読み上げには残す .visually-hidden"
description: "Bootstrap の .visually-hidden は、1px の箱に縮め、clip と overflow で中身を見えなくするが、スクリーンリーダーには読ませる。見えない説明文を書くための定番のクラス。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [806, 816]
function: "\".visually-hidden, .visually-hidden-focusable:not(:focus, :focus-within)\""
difficulty: 3
format: 2
tags: [アクセシビリティ, ハック]
---
## ひとことで

画面からは見えないけれど、スクリーンリーダー（画面の読み上げソフト）には読まれる文字を作るユーティリティです。`display: none` で隠すと、読み上げにも消えてしまうので、この方法を使います。箱を 1px に縮め、中身を切り抜いて、見えないようにしています。

## コード

```css:line-numbers=806
  .visually-hidden,
  .visually-hidden-focusable:not(:focus, :focus-within) {
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
```

## 前提知識

- **スクリーンリーダー**: 画面の内容を音声で読み上げるソフトです。`display: none` や `visibility: hidden` で隠した要素は、読まれないことがあります。
- **clip と rect()**: 要素の見える範囲を切り抜く指定です。`rect(0, 0, 0, 0)` は、見える範囲をゼロにします。
- **overflow: hidden**: 箱からはみ出した中身を隠す指定です。
- **!important**: 他の指定より優先させる指定です。ここでは、部品の見た目を確実に隠すために付いています。

## 何をしているか

### 1. 箱を 1px に縮める

```css:line-numbers=808
    width: 1px !important;
    height: 1px !important;
```

`width` と `height` を 1px にして、箱をほぼ点にします。`margin: -1px` は、点にした箱の分の場所を、周りに残さないようにする調整です。

### 2. 中身を切り抜いて見えなくする

```css:line-numbers=810
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
```

`padding` と `border` をゼロにし、`overflow: hidden` と `clip: rect(0, 0, 0, 0)` で、中身が見えないようにします。`white-space: nowrap` で、文字が折り返されて箱が伸びるのを防ぎます。

### 3. フォーカスで現れる版

```css:line-numbers=807
  .visually-hidden-focusable:not(:focus, :focus-within) {
```

`visually-hidden-focusable` は、キーボードでフォーカスしたときに、通常の見た目に戻るためのクラスです。画面の上にある「本文へ進む」リンクのように、キーボードの利用者だけが見つけられる部品に使われます。

## ここがすごい

- 見えなくするが、読み上げには残すという、矛盾しそうな要求を、サイズと切り抜きの組み合わせで両立させています。
- フォーカスで見える版を同じルールに含めて、キーボードの利用者にも役立つ仕組みになっています。
- 素直に `display: none` で隠すと、読み上げにも消えて、情報が失われます。`visually-hidden` なら、情報は残ります。
- 「見えない文字」を使う目的（ラベルの補足や、ボタンの説明）が、このクラス名で伝わります。

## まとめ

- `display: none` は読み上げにも消えるので、見えないが読まれる方法を選びます。
- 箱を 1px に縮めて切り抜くと、画面からは見えなくなります。
- フォーカスで見える版を用意すると、キーボードの利用者にも役立ちます。
