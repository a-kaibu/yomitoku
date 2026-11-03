---
title: "カードの最後の段落の下余白を消す"
description: "Chota の .card p:last-child は、カードの最後の段落の margin を 0 にする。カードの下端に余白が二重に付くのを防ぐ、子要素の選び方。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_card.css
lines: [8, 10]
function: "\".card p:last-child\""
difficulty: 1
format: 2
tags: [レイアウト]
---
## ひとことで

Chota の `.card p:last-child` は、カードの中で最後に来る段落の余白を消すルールです。カードの下にだけ余白が二重に付くのを防ぎます。

## コード

```css:line-numbers=8
.card p:last-child {
  margin: 0;
}
```

## 前提知識

- **margin**: 要素の外側に取る余白です。段落には、上下に標準の余白が付きます。
- **:last-child**: 親の中で最後の子要素だけを選ぶ疑似クラスです。
- **セレクタの組み合わせ**: `.card p:last-child` は、`.card` の中の `p` のうち、最後の子だけを選びます。

## 何をしているか

### 1. 最後の段落を選ぶ

```css:line-numbers=8
.card p:last-child {
```

`.card` の中にある段落のうち、最後の子だけを選んでいます。

### 2. 余白を消す

```css:line-numbers=9
  margin: 0;
```

`margin: 0` で、段落の上下の余白をなくします。カードの padding が余白の役割を果たすので、段落の余白は要りません。

## ここがすごい

HTML を書き換えなくても、カードの中身の最後だけを特別扱いできます。段落の数が変わっても、ルールは正しく働きます。

カードは、中身の最後の余白を外側の padding が担う設計になっています。段落の下に余白が残ると、カードの下端が不自然に広がって見えます。このルールは、その二重の余白を消すための、最も小さな指定です。段落が一つだけのカードでも、最後の段落が最初でもあるため、同じルールで正しく働きます。

## まとめ

`:last-child` で「最後だけ」を選ぶ、短くて実用的な書き方です。
