---
title: "行末の \\r を取り除く bufio.dropCR"
description: "bufio.dropCR は、Windows の改行に含まれる \\r を、データの末尾から 1 つだけ取り除きます。行を切り出したあとに呼び出して、\\r\\n の改行を \\n と同じ扱いにします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bufio/scan.go"
lines: [345, 350]
function: "dropCR"
difficulty: 1
format: 2
tags: [入出力, 文字列処理, 標準ライブラリ]
---

## ひとことで

`bufio.ScanLines` は、改行で行を切り出したあと、`\r\n` の `\r` を取り除きます。この関数がその作業を行うので、Windows で作られたファイルも、同じ扱いで読めます。

## コード

```go:line-numbers=345
func dropCR(data []byte) []byte {
	if len(data) > 0 && data[len(data)-1] == '\r' {
		return data[0 : len(data)-1]
	}
	return data
}
```

## 前提知識

- **改行の違い**: Unix は `\n`、Windows は `\r\n` で行を終えます。
- **`bufio.Scanner`**: 入力を、決められた区切りで順に切り出す仕組みです。`ScanLines` は、その区切りの 1 つです。
- **スライスの切り出し**: `data[0 : len(data)-1]` は、末尾の 1 バイトを除いた部分を、コピーせずに指します。
- **文字 `'\r'`**: キャリッジリターンのバイトです。

## 何をしているか

### 1. 末尾が \r かを確かめる

```go:line-numbers=346
	if len(data) > 0 && data[len(data)-1] == '\r' {
```

データが空でなく、最後のバイトが `'\r'` なら、取り除く対象です。空のデータを扱うために、長さの確認を先に行っています。

### 2. 末尾の 1 バイトを外す

```go:line-numbers=347
		return data[0 : len(data)-1]
```

`data[0 : len(data)-1]` は、末尾の 1 バイトを除いたスライスです。コピーは作らず、同じ配列の先頭側を指します。

### 3. そのまま返す

```go:line-numbers=349
	return data
```

末尾が `\r` でないときは、データを変えずに返します。`\n` だけで終わる行は、この処理で何も変わりません。

## ここがすごい

- **コピーを作らない**: 切り出しは、スライスの範囲を縮めるだけです。大きな入力でも、余分な領域を使いません。
- **1 バイトだけ取り除く**: 途中の `\r` には触れません。行の末尾だけを対象にするので、文字列の中身は壊れません。
- **改行の違いを隠す**: 呼び出し側は、どの OS で作られたファイルかを気にせず、行を扱えます。

## まとめ

- 行末の `\r` が 1 つあれば、取り除く。
- スライスの範囲を縮めるだけなので、コピーは起きない。
- Unix と Windows の改行を、同じ扱いにできる。
