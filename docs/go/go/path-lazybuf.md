---
title: "書き換えが無ければコピーを作らない path.lazybuf"
description: "path.lazybuf は、パスを正規化するときに使われる内部の作業用の型です。出力が入力と同じ並びなら、新しいバイト列を作らず、元の文字列をそのまま指し続けます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/path/path.go"
lines: [33, 44]
function: "append"
difficulty: 3
format: 2
tags: [文字列処理, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`path.Clean` は、`a//b/../c` のような不要な部分を取り除いた、きれいなパスを返します。途中の出力が元の文字列と同じなら、新しい領域を作らずに済ませるのが `lazybuf` です。

## コード

```go:line-numbers=33
func (b *lazybuf) append(c byte) {
	if b.buf == nil {
		if b.w < len(b.s) && b.s[b.w] == c {
			b.w++
			return
		}
		b.buf = make([]byte, len(b.s))
		copy(b.buf, b.s[:b.w])
	}
	b.buf[b.w] = c
	b.w++
}
```

## 前提知識

- **`path.Clean`**: `.` や `..`、連続する `/` を整理する関数です。結果は、元と同じ文字列のことが多くあります。
- **書き込み位置 `w`**: 出力の、次に書く位置です。
- **遅延確保**: 本当に書き換える必要が出るまで、メモリを確保しない方法です。
- **元の文字列 `s`**: 読み取り専用で、比べる相手として使います。

## 何をしているか

### 1. 元と同じなら確保しない

```go:line-numbers=34
	if b.buf == nil {
		if b.w < len(b.s) && b.s[b.w] == c {
			b.w++
			return
		}
```

まだ確保していない（`buf` が `nil`）あいだは、書こうとしている文字が、元の文字列の同じ位置と一致するかを確かめます。一致すれば、書き込み位置を 1 つ進めるだけで済ませます。

### 2. 違いが出たら初めて確保する

```go:line-numbers=39
		b.buf = make([]byte, len(b.s))
		copy(b.buf, b.s[:b.w])
```

元と違う文字を書く必要が出たときに、初めて `buf` を確保します。そして、それまで一致していた部分を、コピーで移します。

### 3. 文字を書き込む

```go:line-numbers=42
	b.buf[b.w] = c
	b.w++
```

`buf` の書き込み位置に文字を書き、位置を 1 つ進めます。確保のあとは、この道だけを通ります。

## ここがすごい

- **多くの場合にコピーが起きない**: 正規化で変わらないパスは、新しい領域を一切作りません。
- **変わった時点から正確に動く**: 違いが出るまでの一致部分を、まとめてコピーするので、結果は必ず正しくなります。
- **二つの道を一つの型で扱う**: 呼び出し側は、確保の有無を意識せず、`append` を呼ぶだけで済みます。

## まとめ

- 出力が元と同じであるあいだは、確保せず位置だけを進める。
- 違う文字が必要になったら、そこで初めて確保し、一致部分をコピーする。
- 変わらないパスなら、確保ゼロで整理が終わる。
