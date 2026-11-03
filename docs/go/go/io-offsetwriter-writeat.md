---
title: "基点を足して書き込む OffsetWriter.WriteAt。負の位置は拒否する"
description: "io パッケージの OffsetWriter.WriteAt。書き込み位置 off に基点 base を足して、元の WriteAt に渡す。off が負なら errOffset を返し、書き込まない。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/io/io.go"
lines: [588, 595]
function: "WriteAt"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`o.WriteAt(p, off)` は、書き込み位置 `off` を、基点 `base` の分だけずらして、元の書き込み先に書きます。負の位置は、書かずに拒否します。

## コード

```go:line-numbers=588
func (o *OffsetWriter) WriteAt(p []byte, off int64) (n int, err error) {
	if off < 0 {
		return 0, errOffset
	}

	off += o.base
	return o.w.WriteAt(p, off)
}
```

## 前提知識

- **OffsetWriter**: 書き込み先の、ある位置を基点にして書けるようにする型です。
- **基点（base）**: 位置の起点です。`off` は、この基点からの相対位置になります。
- **WriteAt**: 位置を指定して書き込むメソッドです。元の書き込み先が持っています。

## 何をしているか

### 1. 負の位置を拒否する

```go:line-numbers=589
	if off < 0 {
		return 0, errOffset
	}
```

`off` が負なら、基点より前を指すことになります。その場合は、何も書かずに `errOffset` を返します。

### 2. 基点を足して、元の書き込み先に渡す

```go:line-numbers=593
	off += o.base
	return o.w.WriteAt(p, off)
```

`off` に基点 `base` を足して、絶対の位置にします。その位置で、元の `o.w` の `WriteAt` を呼び、結果をそのまま返します。

たとえば、基点が 100 のとき、呼び出し側が `WriteAt(p, 4)` を呼ぶと、実際には 104 の位置に書かれます。呼び出し側は、ファイルの途中の一部だけを、先頭から数えた位置で扱えます。書き込みの本体は元の書き込み先が担うので、この関数は位置の変換だけを行います。

## ここがすごい

- **相対の位置を絶対に変える**: 呼び出し側は、基点を気にせず、0 からの位置で書けます。
- **不正な位置を最初に止める**: 負の位置を先に弾くので、元の書き込み先に、おかしな位置を渡しません。

## まとめ

- `WriteAt` は、基点を足した位置に書き込みます。
- 負の位置は、書かずに拒否します。
- 実際の書き込みは、元の書き込み先に任せます。
