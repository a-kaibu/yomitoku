---
title: "読んだ位置を進めて、先頭のバイトを返す bytes.Buffer.Next"
description: "bytes.Buffer.Next は、まだ読んでいないバイトの先頭から n バイトを取り出します。コピーを作らず内部のスライスをそのまま返し、読み取り位置をその分だけ進めます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [358, 370]
function: "Next"
difficulty: 1
format: 2
tags: [入出力, 標準ライブラリ, 最適化]
---

## ひとことで

`buf.Next(3)` は、まだ読んでいないバイトの先頭から 3 つを返します。返すのはコピーではなく、バッファの内部の配列を指すスライスです。読み取り位置は、返した分だけ先へ進みます。

## コード

```go:line-numbers=358
func (b *Buffer) Next(n int) []byte {
	b.lastRead = opInvalid
	m := b.Len()
	if n > m {
		n = m
	}
	data := b.buf[b.off : b.off+n]
	b.off += n
	if n > 0 {
		b.lastRead = opRead
	}
	return data
}
```

## 前提知識

- **`bytes.Buffer`**: 可変長のバイト列で、末尾へ書き足し、先頭から読み出せます。読んだ位置は `off` という整数で覚えています。
- **スライス式 `b[x:y]`**: 配列の一部を、コピーせずに指す新しいスライスを作ります。
- **`len` と切りつめ**: 残りの量より多く頼まれたら、残りの量だけにします。
- **`lastRead`**: 直前に何を読んだかを覚えておく欄です。`UnreadByte` などが、読み戻せるかを判断するのに使います。

## 何をしているか

### 1. 残りの量で切りつめる

```go:line-numbers=359
	b.lastRead = opInvalid
	m := b.Len()
	if n > m {
		n = m
	}
```

まず、残っているバイト数 `m` を求めます。頼まれた `n` がそれより多いときは、`n` を `m` に切りつめます。残りより多く読もうとしても、パニックにならず、残りの全部を返すための仕組みです。

### 2. 内部のスライスをそのまま切り出す

```go:line-numbers=364
	data := b.buf[b.off : b.off+n]
	b.off += n
```

`b.buf[b.off : b.off+n]` は、読み取り位置から `n` バイトぶんのスライスです。データはコピーされず、同じ配列を指しています。そのあと `b.off` を `n` だけ進めて、次に読む位置を動かします。

### 3. 直前の操作を記録する

```go:line-numbers=366
	if n > 0 {
		b.lastRead = opRead
	}
	return data
```

`n > 0` のときだけ、`lastRead` を `opRead` にします。何も読めなかったときは `opInvalid` のままにして、読み戻しの対象にしないようにしています。

## ここがすごい

- **コピーしない**: 返すのは内部のスライスなので、大きなデータでも余分なメモリを使いません。ただし、返されたスライスの中身を書き換えると、バッファの中身も変わります。
- **範囲外を切りつめる**: 頼まれた量が多すぎても、エラーにせず残りを返します。呼び出し側は、足りない場合を `len` の結果で確かめられます。
- **直前の操作を覚える**: `lastRead` に記録しておくことで、直後に読み戻しを呼ばれたときに、正しく戻れるかを判断できます。

## まとめ

- `Next` は、残りを切りつめてから、内部のスライスを切り出して返す。
- 読んだ位置は `off` で覚え、次の読み出しに備える。
- 返すスライスはコピーではないので、中身を変えるときは注意が必要である。
