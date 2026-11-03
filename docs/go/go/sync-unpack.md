---
title: "二つの位置を一つの uint64 から取り出す poolDequeue.unpack"
description: "sync パッケージの poolDequeue.unpack。先頭の位置 head と末尾の位置 tail を一つにまとめた uint64 から、二つの値を取り出す。ビットのずらしとマスクで、上位と下位を分ける。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2019 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sync/poolqueue.go"
lines: [65, 70]
function: "unpack"
difficulty: 3
tags: [ビット演算, 並行処理]
---

## ひとことで

`d.unpack(ptrs)` は、二つの位置を一つにまとめた `uint64` の値から、先頭の位置 `head` と末尾の位置 `tail` を取り出します。

## コード

```go:line-numbers=65
func (d *poolDequeue) unpack(ptrs uint64) (head, tail uint32) {
	const mask = 1<<dequeueBits - 1
	head = uint32((ptrs >> dequeueBits) & mask)
	tail = uint32(ptrs & mask)
	return
}
```

## 前提知識

- **poolDequeue**: `sync.Pool` の中で使われる、両端から出し入れできる待ち行列です。並行して動くため、位置の情報をまとめて持ちます。
- **パック（pack）**: 複数の値を、一つの整数の異なるビットに詰めることです。一度に読み書きできるようにするためです。
- **マスク**: 必要なビットだけを残すための値です。`&` で使います。

## 何をしているか

### 1. 定数のマスクを作る

```go:line-numbers=66
	const mask = 1<<dequeueBits - 1
```

`dequeueBits` の幅のビットを、全て 1 にした値をマスクとして作ります。このマスクで、片方の位置だけを取り出せます。

### 2. 上位の位置を取り出す

```go:line-numbers=67
	head = uint32((ptrs >> dequeueBits) & mask)
```

`ptrs` を `dequeueBits` の分だけ右にずらして、上位の位置を下ろします。そのうえで、マスクで余分なビットを消して、`head` に入れます。

### 3. 下位の位置を取り出す

```go:line-numbers=68
	tail = uint32(ptrs & mask)
	return
```

マスクだけで、下位の位置を取り出して `tail` に入れます。最後に、名前付きの戻り値をそのまま返します。

## ここがすごい

- **一つの値で二つを表す**: 二つの位置を、一つの整数にまとめるので、一度の読み込みで両方の状態が分かります。
- **同じマスクを使い回す**: 上位にも下位にも同じマスクを使うので、規則が見やすく、間違えにくくなっています。

## まとめ

- `unpack` は、一つの `uint64` から、先頭と末尾の位置を取り出します。
- 上位はずらしてからマスク、下位はマスクだけで取り出します。
- 二つの位置を一つにまとめるので、並行しても一度に読めます。
