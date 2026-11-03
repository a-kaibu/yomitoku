---
title: "インラインのコードは折り返し、ブロックは横スクロール"
description: "code・kbd・samp に pre-wrap を指定して、文中の長いコードを行の中で折り返す。ブロックの pre とは違う扱いを、同じファイルの中で両立させる書き方。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [137, 142]
function: "\"code, kbd, samp\""
difficulty: 2
format: 2
tags: [文字列処理, 可読性]
---
## ひとことで

文の中に書かれた `code`、`kbd`、`samp` の要素に、余白と背景色を付け、空白を保ったまま折り返すルールです。段落の途中で書かれたコードは、行の終わりで折り返して読めるようにします。ブロックのコードは横スクロールと使い分けています。

## コード

```css:line-numbers=137
code, kbd, samp {
  font-size: 0.9em;
  padding: 0 0.5em;
  background-color: #f1f1f1;
  white-space: pre-wrap;
}
```

## 前提知識

- **インライン要素**: 文の流れの中に置かれる要素です。改行をせずに、前後の文字と同じ行に並びます。
- **pre-wrap**: 空白と改行は保ち、行が幅を超えたときは折り返す指定です。
- **kbd 要素**: キーボードのキーの入力を表す HTML 要素です。`Ctrl` などを表示するときに使われます。
- **padding: 0 0.5em**: 上下の余白はゼロで、左右だけ文字の大きさの半分の余白を取る指定です。

## 何をしているか

### 1. 左右の余白と背景色

```css:line-numbers=137
code, kbd, samp {
  font-size: 0.9em;
  padding: 0 0.5em;
  background-color: #f1f1f1;
```

`padding: 0 0.5em` で、文の中のコードの左右に余白を入れます。背景色の `#f1f1f1` は、周りの文字とコードを区別するための薄い灰色です。

### 2. 空白を保ったまま折り返す

```css:line-numbers=141
  white-space: pre-wrap;
```

`white-space: pre-wrap` は、空白と改行を残しつつ、幅を超えたら次の行へ回します。文の中のコードが長くても、横スクロールせずに読めます。

## ここがすごい

- 同じ見た目のルールを、`code`、`kbd`、`samp` の三つにまとめています。キーの表示とプログラムの出力も、同じ書き方で揃います。
- ブロックの `pre` は横スクロール、文中の `code` は折り返し、と役割を分けています。読み手が一番読みやすい方法を、場所ごとに選んでいます。
- 素直に `code` の折り返しを `normal` にすると、スペースを含むコードが途中で不自然に区切られます。`pre-wrap` は、空白を残す点で安全です。
- `font-size: 0.9em` を指定しているので、文の中でもコードが少し小さく見えて、本文と区別できます。

## まとめ

- `pre-wrap` は、空白を保ったまま行の中で折り返す値です。
- 文中のコードは折り返し、ブロックは横スクロールと使い分けると読みやすくなります。
- 背景色と左右の余白で、文中のコードが目立ちます。
- 同じ見た目を複数の要素にまとめると、書き方が揃います。
