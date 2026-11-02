---
title: "GMT の後ろに付く時差を読み飛ばす time.parseGMT"
description: "時刻の文字列の「GMT+9」のような表記を読むとき、GMT の 3 文字を取り除き、残りに時差があれば、符号付きの時差を読んで合計の秒数を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [1496, 1503]
function: "parseGMT"
difficulty: 2
tags: [日時, パース, 文字列処理]
---

## ひとことで

`time.Parse` で、`GMT+9` や `GMT` のような表記の時刻を読むとき、その文字の後ろに時差が続くことがあります。`parseGMT(value)` は、先頭の `GMT` の 3 文字を取り除き、残りの時差を読んで、合計の文字数を返します。時差がなければ `3` を返します。

## コード

```go:line-numbers=1496
func parseGMT(value string) int {
	value = value[3:]
	if len(value) == 0 {
		return 3
	}

	return 3 + parseSignedOffset(value)
}
```

## 前提知識

- **`GMT`**: グリニッジ標準時を表す、英語の名前です。時差が付くこともあるので、後ろに `+9` のような数字が続くことがあります。
- **`parseSignedOffset`**: 符号付きの時差（`+0900` や `-05:00` など）を読む関数です。読んだ文字数を含めて返します。
- **文字数で返す理由**: 呼び出し側は、読んだ文字数だけ入力を先へ進めるので、「どれだけ読んだか」を返す必要があります。
- **`value[3:]`**: 先頭の 3 文字を取り除いた残りです。

## 何をしているか

### 1. GMT の 3 文字を取り除く

```go:line-numbers=1497
	value = value[3:]
	if len(value) == 0 {
		return 3
	}
```

`GMT` の 3 文字を、入力の先頭から取り除きます。残りが空なら、読んだのは 3 文字だけなので、`3` を返します。

### 2. 残りの時差を読んで足す

```go:line-numbers=1502
	return 3 + parseSignedOffset(value)
```

残りの文字列は、時差の形をしているはずです。`parseSignedOffset` が、その時差の文字数を返します。それに、先頭の `GMT` の 3 文字を足したものが、全体の文字数です。

## ここがすごい

- **読んだ量で返す**: 読み取りの位置を進めるために、消費した文字数を返します。値そのものでなく、文字数で次の処理を正しく続けられます。
- **時差がなくても正しく動く**: `GMT` だけの表記なら、3 を返すだけで済みます。特別な場合分けを増やさずに、両方を扱えています。
- **役割を分ける**: 符号付きの時差の読み方は、`parseSignedOffset` に任せています。この関数は、GMT の部分だけに集中できます。

## まとめ

- `parseGMT` は、`GMT` の後ろに時差があれば、それを含めて読んだ文字数を返します。
- 先頭の 3 文字を取り除き、残りが空なら 3 を返します。
- 残りに時差があれば、その文字数を足します。
- 符号付きの時差は、別の関数に任せています。
