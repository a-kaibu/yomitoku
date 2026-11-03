---
title: "入力欄の枠と影を一つの書き方でそろえる"
description: "Pure CSS の .pure-form は、テキスト・日付・メール・数値・選択・複数行の入力欄に同じ余白、細い枠、内側の影、角丸を与える。フォームの見た目を統一する基本の箱。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/forms/css/forms.css
lines: [24, 32]
function: "\".pure-form textarea, .pure-form select\""
difficulty: 2
format: 2
tags: [フォーム, 配色]
---
## ひとことで

Pure CSS は、フォームの入力欄の見た目を、ひとつの宣言のまとまりで揃えています。テキスト、日付、メール、数値、選択、複数行の欄が、同じ余白と枠を持ちます。

## コード

```css:line-numbers=24
.pure-form textarea {
    padding: 0.5em 0.6em;
    display: inline-block;
    border: 1px solid #ccc;
    box-shadow: inset 0 1px 3px #ddd;
    border-radius: 4px;
    vertical-align: middle;
    box-sizing: border-box;
}
```

## 前提知識

- **inset の影**: 要素の内側に落ちる影です。枠の内側がわずかに沈んで見え、入力欄らしい見た目になります。
- **box-sizing: border-box**: 幅の指定に、余白と枠線を含める指定です。幅を決めた欄が、はみ出さなくなります。
- **inline-block と vertical-align**: 文字と並べて置くための指定です。ラベルと入力欄を同じ行に揃えるときに使います。

## 何をしているか

### 1. 余白と枠を決める

```css:line-numbers=25
    padding: 0.5em 0.6em;
    display: inline-block;
    border: 1px solid #ccc;
```

上下の余白を 0.5em、左右を 0.6em にし、細い灰色の枠を付けています。文字の周りに適度な空間ができるので、読みやすくなります。

### 2. 影と角丸を付ける

```css:line-numbers=28
    box-shadow: inset 0 1px 3px #ddd;
    border-radius: 4px;
```

内側の薄い影と、4px の角丸を付けています。枠だけの欄よりも、少しだけ立体感が出ます。

### 3. 行の中で揃える

```css:line-numbers=30
    vertical-align: middle;
    box-sizing: border-box;
```

vertical-align と box-sizing を指定して、並べたときに高さと幅が崩れないようにしています。

## ここがすごい

セレクタを一つにまとめているので、新しい入力の種類が増えても、一か所に書き足せば済みます。種類ごとに同じ宣言を繰り返す必要がありません。

## まとめ

入力欄の見た目を一つの宣言にまとめると、フォーム全体が同じ手触りになります。
