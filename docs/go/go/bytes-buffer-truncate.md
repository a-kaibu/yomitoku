---
title: "読み終えた部分を残したまま、先の未読部分だけを切り落とす Truncate"
description: "bytes.Buffer の Truncate は、まだ読んでいない部分のうち、先頭から n バイトだけを残して後ろを捨てます。読み取りの位置より前は変わりません。0 のときは全体を空にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [109, 119]
function: "(*Buffer).Truncate"
difficulty: 2
format: 2
tags: [入出力, メモリ管理, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`bytes.Buffer` は、書き込んだバイトをためておき、そこから読み出せるバッファです。`Truncate(n)` は、まだ読まれていない部分を先頭から `n` バイトだけ残し、後ろを捨てます。

たとえば、10 バイト書いて 3 バイト読んだあとに `Truncate(2)` を呼ぶと、読み取りの位置から先の 2 バイトだけが残ります。

## コード

```go:line-numbers=109
func (b *Buffer) Truncate(n int) {
	if n == 0 {
		b.Reset()
		return
	}
	b.lastRead = opInvalid
	if n < 0 || n > b.Len() {
		panic("bytes.Buffer: truncation out of range")
	}
	b.buf = b.buf[:b.off+n]
}
```

## 前提知識

- **`b.off`**: 読み取りの位置です。`off` より前のバイトは読み終えています。
- **`b.buf`**: 中身のバイトのスライスです。`len(b.buf)` は書き込んだ全体の長さです。
- **`b.Len()`**: まだ読んでいないバイトの数です。`len(b.buf) - b.off` で計算されます。
- **`lastRead`**: 直前の操作の種類を覚えている変数です。`Unread` などが、直前の読みに対してだけ働くようにするためのものです。

## 何をしているか

`buf = "abcdef"`、`off = 2`（`ab` を読み終えた）、`Truncate(2)` で追います。未読の部分は `"cdef"` です。

### 1. 0 の場合は全部捨てる

```go:line-numbers=110
	if n == 0 {
		b.Reset()
		return
	}
```

`n` が 0 なら、未読の部分をすべて捨てます。`Reset` は、バッファを空にして読み取りの位置も戻します。

### 2. 範囲を確かめる

```go:line-numbers=114
	b.lastRead = opInvalid
	if n < 0 || n > b.Len() {
		panic("bytes.Buffer: truncation out of range")
	}
```

負の数や、未読の長さより大きい値は、範囲外なので `panic` します。`n = 2` は未読の 4 バイトの範囲内です。

### 3. 末尾を切る

```go:line-numbers=118
	b.buf = b.buf[:b.off+n]
```

`b.off + n = 2 + 2 = 4` なので、`buf` は `"abcd"` になります。読み終えた `"ab"` はそのまま残り、未読の `"cd"` だけが残ります。

## ここがすごい

- **読み取りの位置を壊さない**: 切るのは末尾だけなので、読み終えた部分や、読み取りの位置は変わりません。後で続けて読めます。
- **0 を特別扱いする理由**: `buf[:off+0]` でも同じ結果になりそうですが、`Reset` にすると読み取りの位置も含めて初期化できます。空の状態を、きれいに作れます。
- **範囲外を panic で知らせる**: 不正な値は、黙って変な結果を返さず、すぐに `panic` します。バグを早く見つけられる設計です。

## まとめ

- バッファを切るときは、読み取りの位置より後ろだけを変えると、読みの続きに影響しない。
- 0 のような特別な値は、初期化の処理に任せると簡潔になる。
- 範囲外の値は、静かに直さず、すぐ知らせる。
