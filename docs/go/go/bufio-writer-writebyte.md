---
title: "1 バイトを書き込む bufio.Writer.WriteByte。満杯なら先に Flush する"
description: "bufio.Writer の WriteByte。1 バイトをバッファの末尾に入れる。バッファに空きがなければ、先に Flush してから入れる。以前にエラーがあれば、それを返して書かない。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/bufio.go"
lines: [701, 711]
function: "WriteByte"
difficulty: 2
tags: [入出力, メモリ管理, 防御的プログラミング]
---

## ひとことで

`bufio.Writer` は、書き込みをバッファにためてから、まとめて下の writer に書きます。`WriteByte(c)` は、1 バイトだけを書く関数です。バッファがいっぱいなら、先に `Flush` でため込んだ分を吐き出してから、そのバイトを入れます。

## コード

```go:line-numbers=701
func (b *Writer) WriteByte(c byte) error {
	if b.err != nil {
		return b.err
	}
	if b.Available() <= 0 && b.Flush() != nil {
		return b.err
	}
	b.buf[b.n] = c
	b.n++
	return nil
}
```

## 前提知識

- **バッファ**: 書き込みをためておく領域です。ここでは、`b.buf` の配列を使います。
- **`b.n`**: 今バッファに入っているバイト数です。次に書く位置でもあります。
- **`Available()`**: バッファの空きのバイト数を返すメソッドです。
- **`b.err`**: 以前のエラーを覚えておく変数です。エラーがあれば、以後の書き込みはすべて失敗させます。

## 何をしているか

### 1. 以前にエラーがあれば止める

```go:line-numbers=702
	if b.err != nil {
		return b.err
	}
```

前の書き込みでエラーが起きていたら、それを返して終わります。壊れた状態にさらに書いてしまうのを防ぎます。

### 2. 満杯なら先に吐き出す

```go:line-numbers=705
	if b.Available() <= 0 && b.Flush() != nil {
		return b.err
	}
```

空きがなければ、`Flush` でバッファを空にします。`Flush` が失敗したら、そのエラーを返して、1 バイトも書きません。`&&` の順序が大事で、空きがあるときは `Flush` を呼ばずに済みます。

### 3. 1 バイトを末尾に入れる

```go:line-numbers=708
	b.buf[b.n] = c
	b.n++
	return nil
```

バッファの `b.n` の位置に 1 バイトを入れて、件数を 1 増やします。ここにはコピーもメモリの確保もありません。

## ここがすごい

- **1 バイトごとの書き込みを軽くする**: 1 バイトずつ下の writer に渡すと、システムの呼び出しが毎回起きます。バッファに入れるだけなので、とても軽い操作です。
- **条件の順序で無駄な呼び出しを避ける**: 空きがあるかを先に確かめるので、ほとんどの場合は `Flush` を呼びません。
- **エラーを早く返す**: 以前のエラーを最初に確かめるので、壊れた書き込みが続くことがありません。

## まとめ

- `WriteByte` は、1 バイトをバッファの末尾に入れます。
- 以前にエラーがあれば、その場で返します。
- バッファが満杯なら、先に `Flush` してから入れます。
- 大半の場合は、バッファに入れるだけで済みます。
