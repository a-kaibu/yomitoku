---
title: "pre の中の code から背景と余白を消す"
description: "pre > code で、コードブロックの中にある code 要素の余白と背景色、折り返しの指定を打ち消す。外側の pre の見た目と、中身の code の見た目を分けて扱う書き方。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [144, 149]
function: "\"pre > code\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`pre` の直下にある `code` 要素の見た目を、外側の `pre` に任せて打ち消すルールです。`code` は、本文の中では小さな背景付きの箱ですが、コードブロックの中では、背景も余白も不要です。このルールで、二重の箱になるのを防いでいます。

## コード

```css:line-numbers=144
pre > code {
  padding: 0;
  background-color: transparent;
  white-space: pre;
  font-size: 1em;
}
```

## 前提知識

- **code 要素**: コードの文字を表す HTML 要素です。文の中の短い単語にも、ブロック全体にも使えます。
- **子セレクタ `>`**: 直接の子要素だけを対象にするセレクタです。`pre > code` は、pre の直下の code だけに一致します。
- **white-space: pre**: 空白と改行をそのまま表示し、折り返さない指定です。
- **二重の箱**: 外側の箱（pre）と内側の箱（code）がそれぞれ背景や余白を持つと、枠が二重に見えてしまう状態のことです。

## 何をしているか

### 1. 背景と余白をなくす

```css:line-numbers=145
  padding: 0;
  background-color: transparent;
```

`padding: 0` で、中の code の余白をゼロにします。`background-color: transparent` で、code の背景を透明にします。これで、外側の `pre` の背景が、そのまま全体に見えます。

### 2. 折り返しと文字の大きさを決める

```css:line-numbers=147
  white-space: pre;
  font-size: 1em;
```

`white-space: pre` は、コードの空白と改行を保ちます。`font-size: 1em` は、外側の `pre` の文字サイズに合わせる指定です。`code` 単独の 0.9em を上書きして、ブロックの中で統一します。

## ここがすごい

- 同じ `code` 要素でも、文中と `pre` の中で見た目を変えられます。セレクタの親子関係で、文脈に応じた書き分けをしています。
- `white-space: pre` を指定しているので、ひとつ前の `code, kbd, samp` の `pre-wrap` を上書きできます。ルールの優先順位を理解して書かれています。
- 素直に `pre` の中の `code` にクラスを付けて打ち消すと、HTML を書く人が毎回気を配る必要があります。CSS で文脈を判定すれば、書き忘れがなくなります。
- 文字サイズを 1em にしているので、ブロックの中のコードだけ、大きさが親に揃います。

## まとめ

- 子セレクタ `>` で、直接の子だけを対象にできます。
- 外側の箱に見た目を任せると、二重の箱を防げます。
- 同じ要素でも、親の文脈で見た目を分けられます。
- `white-space: pre` で、コードの空白を崩さずに保てます。
