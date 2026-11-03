---
title: "入れ子の番号付きリストで数字の種類を変える"
description: "ul の中の ol は小文字のローマ数字、さらにその中の ol は小文字のアルファベットにする。入れ子の深さで番号の種類を切り替えて、どの階層の項目かを見分けやすくする。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [460, 470]
function: "\".markdown-body ul ol\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

Markdown で書かれたリストが入れ子になったとき、番号の種類を階層ごとに変えるルールです。`ol` の中の `ol` は小文字のローマ数字、さらに深い `ol` は小文字のアルファベットになります。階層の深さが、番号の形だけで伝わります。

## コード

```css:line-numbers=460
.markdown-body ul ol {
  list-style-type: lower-roman;
}

.markdown-body ul ul ol,
.markdown-body ul ol ol,
.markdown-body ol ul ol,
.markdown-body ol ol ol {
  list-style-type: lower-alpha;
}

```

## 前提知識

- **ol と ul**: 番号付きのリストと、記号付きのリストです。
- **list-style-type**: リストの項目の前に付く記号や番号の種類を決めるプロパティです。`lower-roman` は小文字のローマ数字、`lower-alpha` は小文字のアルファベットです。
- **子孫セレクタ**: `A B C` のように、祖先の関係をつないで対象を選ぶ書き方です。`ul ol` は、ul の中の ol に一致します。
- **カンマ区切りのセレクタ**: 複数の組み合わせに、同じ宣言を当てる書き方です。

## 何をしているか

### 1. ローマ数字の階層

```css:line-numbers=460
.markdown-body ul ol {
  list-style-type: lower-roman;
}
```

`ul ol` と `ol ol` の中の `ol` は、`lower-roman`（i, ii, iii …）になります。リストの中のリストは、まず番号の形を変えるだけで、親の項目とは別の階層だと見分けられます。

### 2. アルファベットの階層

```css:line-numbers=463

.markdown-body ul ul ol,
.markdown-body ul ol ol,
.markdown-body ol ul ol,
.markdown-body ol ol ol {
  list-style-type: lower-alpha;
}

```

さらに深い入れ子では、`lower-alpha`（a, b, c …）になります。四つの組み合わせをカンマで並べて、ul と ol が混ざった入れ子でも同じ規則が当たるようにしています。

## ここがすごい

- 番号の種類だけで階層の深さが伝わるので、読み手は入れ子を数えなくても、どこにいるかを把握できます。
- 「ul の中の ol」「ol の中の ol」など、入れ子の組み合わせを一つずつ書いて、どの場合も取りこぼさないようにしています。
- 素直に、階層ごとにクラスを付けると、Markdown から生成される HTML にはクラスがないので、使えません。セレクタの親子関係で決めるほうが、Markdown の書き方に沿います。
- 一番深いところまで同じ規則が続くわけではなく、三段階で止めています。深すぎる入れ子は、読みにくさの原因になるため、見た目の上でも区切っています。

## まとめ

- `list-style-type` で、番号の種類を変えられます。
- 子孫セレクタを組み合わせると、入れ子の階層ごとに規則を分けられます。
- Markdown のように、クラスを付けられない場所では、親子の関係で見た目を決めます。
