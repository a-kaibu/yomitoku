---
title: "複数の書き込み先へ同時に書く io.multiWriter.Write"
description: "io.MultiWriter が返す multiWriter の Write は、渡された書き込み先に順に同じデータを書きます。途中で失敗すれば、そこで止めてエラーを返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/multi.go"
lines: [85, 97]
function: "Write"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, 設計パターン]
---

## ひとことで

`io.MultiWriter(file, os.Stdout)` で作った Writer に書くと、ファイルと標準出力の両方に同じ内容が届きます。ログを複数の場所に残すときに便利です。

## コード

```go:line-numbers=85
func (t *multiWriter) Write(p []byte) (n int, err error) {
	for _, w := range t.writers {
		n, err = w.Write(p)
		if err != nil {
			return
		}
		if n != len(p) {
			err = ErrShortWrite
			return
		}
	}
	return len(p), nil
}
```

## 前提知識

- **`Writer` インターフェース**: `Write` を持つ型で、データを書く先を抽象化します。
- **短い書き込み**: `Write` が要求した量より少ししか書けないことがあります。その場合は、エラーとして扱います。
- **`ErrShortWrite`**: 書き込み量が足りなかったことを表すエラーの値です。
- **名前付きの戻り値**: `n` と `err` に名前があるので、途中で `return` しても結果が返ります。

## 何をしているか

### 1. 書き込み先へ順に書く

```go:line-numbers=86
	for _, w := range t.writers {
		n, err = w.Write(p)
		if err != nil {
			return
		}
```

`writers` を先頭から順に見て、それぞれに `p` を書きます。エラーが出たら、その時点で戻ります。後ろの書き込み先には書きません。

### 2. 書いた量を確かめる

```go:line-numbers=91
		if n != len(p) {
			err = ErrShortWrite
			return
		}
```

書けた量が `p` の長さと違えば、`ErrShortWrite` を返します。一部しか書けていない状態を、見過ごさないためです。

### 3. 全部書けたら成功を返す

```go:line-numbers=96
	return len(p), nil
```

すべての書き込み先に書けたら、`len(p)` と `nil` を返します。

## ここがすごい

- **1 回の呼び出しで複数に届く**: 呼び出し側は、書き込み先が何か所あるかを意識せずに済みます。
- **失敗を隠さない**: 途中で失敗したら止まり、エラーを返すので、どこまで書けたかが分かります。
- **短い書き込みを見逃さない**: 書けた量を確かめるので、内容の欠けが静かに起きません。

## まとめ

- 書き込み先に、先頭から順に同じデータを書く。
- 途中で失敗したら止めて、エラーを返す。
- 書いた量が足りなければ `ErrShortWrite` を返す。
