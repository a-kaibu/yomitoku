---
title: "誤りに配列の添字を書き加える wrapWithArrayIndex。位置の経路を後ろへ足していく"
description: "encoding/json/jsontext の wrapWithArrayIndex。エラーに、配列の何番目で起きたかという情報を付ける。既に位置の情報を持つエラーなら、その末尾に添字を足す。持たなければ新しく包む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/jsontext/errors.go"
lines: [194, 201]
function: "wrapWithArrayIndex"
difficulty: 2
tags: [エラー処理, 文字列処理, パース]
---

## ひとことで

`wrapWithArrayIndex(err, index)` は、エラーに「配列の何番目か」という情報を付け加えます。例えば `/items/3` のように、JSON Pointer と呼ばれる書き方で、場所を表すためです。

入れ子のデータでは、奥で起きた誤りに、外側の場所を順に付けていくことがあります。この関数は、その一段分を付け加えます。

## コード

```go:line-numbers=194
func wrapWithArrayIndex(err error, index int64) error {
	serr, _ := err.(*pointerSuffixError)
	if serr == nil {
		serr = &pointerSuffixError{error: err}
	}
	serr.reversePointer = strconv.AppendUint(append(serr.reversePointer, '/'), uint64(index), 10)
	return serr
}
```

## 前提知識

- **JSON Pointer**: JSON の中の場所を、`/` で区切ったパスで表す書き方です。配列の番号は、そのまま数字で書きます。
- **`pointerSuffixError`**: 位置の経路を持つエラーの型です。`reversePointer` に、後ろから付け足していく経路を覚えます。
- **型アサーション**: `err.(*pointerSuffixError)` で、エラーがその型かを調べます。
- **`AppendUint`**: 整数を文字として、バイト列の末尾に追加する関数です。

## 何をしているか

### 1. 既存の位置情報を取り出すか、新しく作る

```go:line-numbers=195
	serr, _ := err.(*pointerSuffixError)
	if serr == nil {
		serr = &pointerSuffixError{error: err}
	}
```

エラーが既に `pointerSuffixError` なら、それを使います。違えば、元のエラーを包んだ新しい値を作ります。

### 2. 添字を経路の末尾に足す

```go:line-numbers=199
	serr.reversePointer = strconv.AppendUint(append(serr.reversePointer, '/'), uint64(index), 10)
	return serr
```

経路に `/` を付け、続けて添字の数字を書き足します。経路は、奥から外へ向かって積まれていきます。最後に、更新したエラーを返します。

## ここがすごい

- **同じエラーに足していく**: 包まれたエラーが既にあれば、新しく作らず、末尾に一段ずつ足します。何段の入れ子でも、同じ仕組みで処理できます。
- **経路を後ろから積む**: 奥の添字から書き足すので、経路は「奥から外へ」の順に並びます。名前の `reverse` は、この並び順を表しています。
- **数字を直接書き込む**: 添字を文字列に変えてから足すのではなく、`AppendUint` で直接バイト列に書きます。無駄なメモリを使いません。

## まとめ

- `wrapWithArrayIndex` は、エラーに配列の添字を付け加えます。
- 既に位置の情報があれば、その末尾に足します。
- 添字は奥から外へ向かって積まれます。
