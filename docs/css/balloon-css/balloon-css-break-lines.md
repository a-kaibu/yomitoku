---
title: "改行を残すかどうかを data-balloon-break で切り替える"
description: "data-balloon-break の属性で white-space を pre に変え、吹き出しの中の改行をそのまま表示する。長い文字の折り返し方も一緒に決める。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [49, 53]
function: "\"[data-balloon-break]:after\""
difficulty: 2
format: 2
tags: [文字列処理, 可読性]
---
## ひとことで

`data-balloon-break` という属性が付いた吹き出しだけ、改行をそのまま表示させるルールです。吹き出しの既定は一行で、改行を無視します。この属性を付けると、`white-space: pre` で改行と空白が残ります。さらに `data-balloon-length` も付いている場合は、`pre-line` と `word-break` で折り返し方を整えます。

## コード

```css:line-numbers=49
  [aria-label][data-balloon-pos][data-balloon-break]:after {
    white-space: pre; }
  [aria-label][data-balloon-pos][data-balloon-break][data-balloon-length]:after {
    white-space: pre-line;
    word-break: break-word; }
```

## 前提知識

- **white-space**: 空白と改行をどう扱うかを決めるプロパティです。`normal` は改行を空白として扱い、`pre` は改行をそのまま残します。
- **pre-line**: 改行は残し、連続する空白は一つにまとめる値です。
- **word-break**: 単語の途中で改行してよいかを決めるプロパティです。`break-word` は、はみ出す長い単語を強制的に折り返します。
- **属性セレクタ**: `[data-balloon-break]` のように、属性の有無で要素を選ぶ書き方です。

## 何をしているか

### 1. 改行をそのまま残す

```css:line-numbers=49
  [aria-label][data-balloon-pos][data-balloon-break]:after {
    white-space: pre; }
```

`data-balloon-break` が付いた吹き出しでは、`white-space: pre` で改行と空白がそのまま表示されます。複数行の説明を書くときに使います。

### 2. 幅の指定があるときは、折り返し方を整える

```css:line-numbers=51
  [aria-label][data-balloon-pos][data-balloon-break][data-balloon-length]:after {
    white-space: pre-line;
    word-break: break-word; }
```

`data-balloon-length` も付いているときは、幅が決まっているので、折り返しの処理が必要になります。`pre-line` は改行を残しつつ、連続する空白を詰めます。`word-break: break-word` は、長い単語が幅を超えても、途中で折り返すようにします。

## ここがすごい

- 「改行を残す」と「幅で折り返す」を、属性の組み合わせだけで切り替えられます。JavaScript を使わずに、表示の方法を変えられます。
- 2 つ目のセレクタが、1 つ目より強い条件になっています。両方の属性があるときだけ、折り返しの指定が上書きされます。
- 素直に、改行を HTML の `br` で書くと、読み上げでも改行が意味を持ってしまいます。CSS で改行を扱うと、本文の文字は変わりません。
- 長い URL や単語が吹き出しからはみ出す問題も、`break-word` で防いでいます。

## まとめ

- `white-space: pre` で、改行と空白をそのまま残せます。
- 幅がある場合は、`pre-line` と `break-word` で読みやすく折り返せます。
- 属性を組み合わせて、表示の挙動を切り替えられます。
- 長い単語の扱いも、同じルールの中で決めています。
