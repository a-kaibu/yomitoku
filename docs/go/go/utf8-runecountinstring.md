---
title: "文字数を数えるのに、わざわざデコードしない `for range`"
description: "utf8.RuneCountInString は、文字列の中に文字（ルーン）がいくつあるかを数えます。値を使わない `for range` だけで、UTF-8 のバイトを文字の単位に分けて数えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [447, 452]
function: "RuneCountInString"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 標準ライブラリ]
---

## ひとことで

`utf8.RuneCountInString(s)` は、文字列 `s` に **文字（ルーン）がいくつ含まれるか** を返します。`len(s)` はバイト数を返すので、日本語が混ざると違う値になります。

たとえば `"あい"` は、`len` では 6 バイトですが、`RuneCountInString` では 2 文字です。

## コード

```go:line-numbers=447
func RuneCountInString(s string) (n int) {
	for range s {
		n++
	}
	return n
}
```

## 前提知識

- **バイトと文字（ルーン）**: 文字列は UTF-8 のバイトの並びです。ASCII の文字は 1 バイト、日本語の多くは 3 バイトで表されます。Go では 1 文字を `rune` と呼びます。
- **`for range s`**: 文字列を `range` で回すと、バイトではなく **1 文字ずつ** 取り出されます。値を受け取らなければ、文字の中身を使わずに、位置だけを進めることになります。
- **名前付き戻り値 `(n int)`**: 戻り値に名前を付けると、関数の中で `n` を普通の変数として使えます。`return n` と書かなくても、最後に `n` が返されます。

## 何をしているか

`s = "aあ"`（`a` は 1 バイト、`あ` は 3 バイト）で追います。

### 1. 文字ごとに数える

```go:line-numbers=448
	for range s {
		n++
	}
```

`range` は、先頭の `a`（1 バイト）を 1 文字として取り出し、次の `あ`（3 バイト）へ進みます。その間、ループは 2 回回ります。`n` は 2 になります。

### 2. 結果を返す

```go:line-numbers=451
	return n
```

2 を返します。`len(s)` の 4 とは違う値です。

## ここがすごい

- **デコードの結果を捨てている**: `range` は、内部で UTF-8 のデコードをして、次の文字の位置を求めます。この関数は文字の値は使わないので、その過程だけを使って数えます。文字の値を変数に入れる必要がないので、余計な処理が増えません。
- **メモリを確保しない**: 文字列を `[]rune` に変換すると、新しい配列が作られます。この方法は新しいメモリを作らず、文字列をそのまま読み進めます。
- **正しさは `range` の仕様が保証する**: 不正な UTF-8 のバイトも、1 バイトを 1 文字（置換文字）として数えるよう、言語の仕様で決まっています。関数は細かい例外処理を書かずに済みます。

## まとめ

- 文字数とバイト数は違うので、用途に合わせて `len` と使い分ける。
- `for range` で値を使わなければ、文字の境界を見つける処理だけを使える。
- 新しいメモリを作らずに、文字列を 1 文字単位で読める。
