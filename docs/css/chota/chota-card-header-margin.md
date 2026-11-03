---
title: "カードの見出しの下に余白を入れる"
description: "Chota の .card header > * は、カードの header の直下の要素だけに上余白を 0、下余白を 1rem にする。見出しと本文の間隔を、子の指定で一度にそろえる。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_card.css
lines: [12, 15]
function: "\".card header > *\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Chota の `.card header > *` は、カードの見出し部分にある直下の要素の余白をそろえるルールです。見出しの下の間隔を、一つの指定で決めています。

## コード

```css:line-numbers=12
.card header > * {
  margin-top: 0;
  margin-bottom: 1rem;
}
```

## 前提知識

- **header 要素**: 記事やカードの上部を表す HTML の要素です。
- **子セレクタ `>`**: 直下の子だけを選ぶ書き方です。孫より深い要素は選びません。
- **`*` セレクタ**: 任意の要素を表します。`header > *` は、header の直下の全要素を選びます。

## 何をしているか

### 1. 直下の要素を選ぶ

```css:line-numbers=12
.card header > * {
```

header の中に置かれた要素を、種類を問わずまとめて選びます。見出しでも段落でも同じ扱いになります。

### 2. 上下の余白を決める

```css:line-numbers=13
  margin-top: 0;
  margin-bottom: 1rem;
```

上余白を 0 にして、下余白を 1rem に固定しています。見出しの直後の余白が、どのカードでも同じになります。

## ここがすごい

見出しの種類ごとに余白を書かなくてよくなります。`header` の中身が増えても、一つのルールで間隔がそろいます。

見出しを書く人が、余白の値を毎回決めなくてよいのが利点です。header の中に h1 や p を並べても、直下の要素はどれも同じ間隔で続きます。逆に、このルールがないと、見出しの種類ごとに余白を書く必要が出てきます。一つのセレクタで間隔をそろえる書き方は、カードの見た目を統一したいときに役立ちます。

## まとめ

`header > *` は、直下の要素をまとめて整える、簡潔なセレクタの使い方です。
