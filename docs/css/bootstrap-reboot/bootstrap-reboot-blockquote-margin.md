---
title: "引用の中の段落の上下余白を消す"
description: "blockquote の直下の子要素の margin-block を 0 にして、引用文の中の段落や見出しの余白が外側に広がらないようにする。論理プロパティで上下の余白をまとめて消す。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [609, 611]
function: "\"blockquote > *\""
difficulty: 2
format: 2
tags: [移植性, 可読性]
---
## ひとことで

引用ブロック `blockquote` の直下にある要素の、上下の余白をゼロにするルールです。引用の中に段落を入れると、段落の余白が引用の箱の外まで広がってしまいます。その余白を消して、引用の箱の中に収めています。

## コード

```css:line-numbers=609
  blockquote > * {
    margin-block: 0;
  }
```

## 前提知識

- **blockquote 要素**: 引用を表す HTML 要素です。ブラウザは既定で、左右に字下げと余白を付けます。
- **margin-block**: ブロック方向（横書きなら上と下）の余白をまとめて指定する論理プロパティです。
- **直下の子（>）**: `>` は、直接の子要素だけを選ぶ子セレクタです。
- **余白の広がり**: 子要素の余白が親の外まで伸びることを、余白の相殺や広がりと呼びます。

## 何をしているか

### 1. 直下の子の上下余白をゼロにする

```css:line-numbers=609
  blockquote > * {
    margin-block: 0;
  }
```

`blockquote > *` は、引用の直下の要素に一致します。`margin-block: 0` で、上と下の余白をまとめてゼロにします。引用の中の段落の余白が、引用の箱の外に出なくなります。

## ここがすごい

- 直下の子だけを対象にしているので、引用の中のさらに深い要素の余白は、そのまま残ります。
- `margin-block` と論理的に書いているので、縦書きでも、ブロック方向の余白が正しく消えます。
- 素直に `blockquote p { margin: 0; }` と書くと、段落以外の要素（リストや表）の余白が残ります。`>` で直下の要素をまとめて扱う方が、取りこぼしがありません。
- 引用の見た目は、外側の余白で作ります。中身の余白を消すことで、その見た目が崩れずに済みます。

## まとめ

- `>` で直下の子だけを選べます。
- `margin-block: 0` は、上と下の余白をまとめて消す論理プロパティです。
- 引用の中の余白を消すと、引用の箱がきれいに収まります。
