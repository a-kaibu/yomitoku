---
title: "月を英語の名前にする time.Month.String"
description: "time.Month.String は、月の値を \"January\" などの英語の名前にします。範囲の外の値は、\"%!Month(13)\" のように、誤りだと分かる形で書きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [342, 349]
function: "String"
difficulty: 1
format: 2
tags: [日時, 文字列処理, 標準ライブラリ]
---

## ひとことで

`time.March.String()` は、`"March"` を返します。`time.Month` は整数の型ですが、表示のときは、この関数で名前に変わります。

## コード

```go:line-numbers=342
func (m Month) String() string {
	if January <= m && m <= December {
		return longMonthNames[m-1]
	}
	buf := make([]byte, 20)
	n := fmtInt(buf, uint64(m))
	return "%!Month(" + string(buf[n:]) + ")"
}
```

## 前提知識

- **`Month` 型**: `January` が 1、`December` が 12 の整数の型です。
- **`longMonthNames`**: 月の英語の名前を並べた配列です。添字は、月の値から 1 を引いた値を使います。
- **`fmt` の書式**: `%!` で始まる表示は、書式の誤りを示すときに `fmt` が使う目印です。
- **`fmtInt`**: 整数を文字の並びにする内部の関数です。

## 何をしているか

### 1. 範囲の中なら名前を返す

```go:line-numbers=343
	if January <= m && m <= December {
		return longMonthNames[m-1]
```

月の値が `January` から `December` の間なら、配列の `m-1` 番目の名前を返します。1 月は 1 なので、添字は 0 になります。

### 2. 範囲の外なら誤りの形で書く

```go:line-numbers=346
	buf := make([]byte, 20)
	n := fmtInt(buf, uint64(m))
	return "%!Month(" + string(buf[n:]) + ")"
```

範囲の外の値は、20 バイトのバッファに数を書き、`"%!Month(数)"` の形にして返します。`panic` にせず、表示を見れば誤りが分かるようにしています。

## ここがすごい

- **整数を読みやすくする**: 数の値を、人が読める名前に変えるので、ログや表示が分かりやすくなります。
- **誤りを隠さない**: 範囲外の値を、正しい名前に見せかけません。`%!Month(13)` という形で、誤りをそのまま示します。
- **余計な割り当てを抑える**: 範囲の中の大多数の場合は、配列を返すだけで済みます。

## まとめ

- 範囲の中なら、英語の名前を配列から返す。
- 範囲の外は、誤りと分かる `%!Month(数)` の形で返す。
- 表示の処理は、`panic` せずに済ませる。
