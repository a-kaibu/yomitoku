---
title: "項目と項目の間に 0.25em の隙間を入れる"
description: ".markdown-body の li+li に margin-top を .25em だけ付けて、リストの項目どうしを少しだけ離す。隣接セレクタを使って、最初の項目には隙間を入れない書き方。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [677, 679]
function: "\".markdown-body li+li\""
difficulty: 1
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

リストの項目が二つ以上あるとき、二つ目以降の項目の上に小さな余白を入れるルールです。`li+li` は、直前に別の `li` がある `li` だけに一致します。一番上の項目には余白が付かないので、リストの先頭が本文とずれません。

## コード

```css:line-numbers=677
.markdown-body li+li {
  margin-top: .25em;
}
```

## 前提知識

- **隣接兄弟セレクタ（+）**: `A+B` の形で、直前に A がある B に一致するセレクタです。
- **li 要素**: リストの一つ一つの項目です。
- **em 単位**: 現在の文字の大きさを基準にする単位です。`.25em` は、文字の大きさの 4 分の 1 です。
- **margin-top**: 要素の上の余白です。

## 何をしているか

### 1. 二つ目以降の項目だけに余白を付ける

```css:line-numbers=678
  margin-top: .25em;
```

`li+li` の `li` は、直前に別の `li` が置かれている項目だけに一致します。最初の項目は対象にならないので、リストの頭の位置がほかの本文と揃ったままです。

### 2. 余白を文字の大きさに合わせる

```css:line-numbers=678
  margin-top: .25em;
```

`margin-top: .25em` は、項目の文字の大きさの 4 分の 1 の余白です。文字を大きくすると、隙間も比例して広がります。

## ここがすごい

- 最初の項目を除いて余白を付ける、という条件を、隣接セレクタの一つで書いています。`:first-child` を使う書き方より、意図が明確です。
- 余白を `em` で書いているので、リストの文字の大きさが変わっても、比率が保たれます。
- 素直に `li { margin-top: 4px; }` と書くと、最初の項目にも余白が付き、リストの頭だけが本文から離れます。
- 余白は小さな値ですが、項目どうしの区別が生まれて、長いリストでも読みやすくなります。

## まとめ

- `li+li` は、直前に項目がある項目だけを選ぶ隣接セレクタです。
- 最初の項目の余白を消すと、リストの頭が本文と揃います。
- `em` で余白を決めると、文字の大きさに合わせて比率が保たれます。
