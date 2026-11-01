---
title: "ぴったりの量を読むまで続ける io.ReadFull"
description: "io.ReadFull は、バッファの長さぶんのデータを読み切るまで、Reader から読み続けます。ReadAtLeast の特別な場合で、最低量をバッファの長さに合わせたものです。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [353, 355]
function: "ReadFull"
difficulty: 1
format: 2
tags: [入出力, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`io.ReadFull(r, buf)` は、`buf` がちょうど埋まるまで `r` から読みます。1 回の `Read` では足りないことが多いので、その面倒を隠してくれる関数です。

## コード

```go:line-numbers=353
func ReadFull(r Reader, buf []byte) (n int, err error) {
	return ReadAtLeast(r, buf, len(buf))
}
```

## 前提知識

- **`Read` の性質**: `Read` は、要求した量より少ない量しか返さないことがあります。読めた分だけ返し、残りは次の呼び出しに任せます。
- **`ReadAtLeast`**: 最低限読むべき量を指定して、それ以上になるまで読み続けます。
- **`len(buf)`**: バッファの長さです。ここでは、読みたい量の全体になります。
- **`io.ErrUnexpectedEOF`**: 必要な量に届く前に入力が終わったときの、エラーの値です。

## 何をしているか

### 1. 最低量をバッファの長さにする

```go:line-numbers=354
	return ReadAtLeast(r, buf, len(buf))
```

`ReadAtLeast` に、バッファと同じ長さを最低量として渡します。つまり、バッファがいっぱいになるまで読むことを求めます。

### 2. 読み切りの仕組みに任せる

```go:line-numbers=354
	return ReadAtLeast(r, buf, len(buf))
```

実際に読み続ける処理は、`ReadAtLeast` が担当します。`ReadFull` は、その引数を決めるだけの薄い関数です。

## ここがすごい

- **呼び出し側が楽になる**: 何度も `Read` を呼んで数を数える必要がなくなります。
- **役割を一つに絞る**: 読み続ける仕組みは `ReadAtLeast` に一つだけ置き、`ReadFull` はその特別な場合として定義されています。
- **不足を知らせる**: 途中で入力が終わったら、エラーで伝えるので、読み残しに気づけます。

## まとめ

- 最低量をバッファの長さにして、`ReadAtLeast` を呼ぶ。
- 読み続ける仕組みは、`ReadAtLeast` が担当する。
- バッファを埋めきれなければ、エラーで知らせる。
