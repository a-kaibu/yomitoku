---
title: "UTF-8 の 1 文字を読み、読んだ量を返す bytes.Buffer.ReadRune"
description: "bytes.Buffer.ReadRune は、バッファの先頭から 1 文字ぶんの rune を読み出し、そのバイト数も返します。ASCII の文字は速い道で処理し、それ以外は utf8 パッケージに任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [391, 407]
function: "ReadRune"
difficulty: 2
format: 2
tags: [入出力, Unicode, 標準ライブラリ, 最適化]
---

## ひとことで

`buf.ReadRune()` は、バッファの先頭にある 1 文字を、`rune` として読み出します。同時に、その文字が何バイトだったかも返します。読むものがないときは `io.EOF` を返します。

## コード

::: code-group

```go:line-numbers=391 [日本語訳]
func (b *Buffer) ReadRune() (r rune, size int, err error) {
	if b.empty() {
		// バッファが空なので、領域を取り戻すために Reset する。
		b.Reset()
		return 0, 0, io.EOF
	}
	c := b.buf[b.off]
	if c < utf8.RuneSelf {
		b.off++
		b.lastRead = opReadRune1
		return rune(c), 1, nil
	}
	r, n := utf8.DecodeRune(b.buf[b.off:])
	b.off += n
	b.lastRead = readOp(n)
	return r, n, nil
}
```

```go:line-numbers=391 [原文]
func (b *Buffer) ReadRune() (r rune, size int, err error) {
	if b.empty() {
		// Buffer is empty, reset to recover space.
		b.Reset()
		return 0, 0, io.EOF
	}
	c := b.buf[b.off]
	if c < utf8.RuneSelf {
		b.off++
		b.lastRead = opReadRune1
		return rune(c), 1, nil
	}
	r, n := utf8.DecodeRune(b.buf[b.off:])
	b.off += n
	b.lastRead = readOp(n)
	return r, n, nil
}
```

:::

## 前提知識

- **`rune`**: Go で 1 文字を表す整数の型です。日本語の文字も、1 つの `rune` になります。
- **UTF-8 の可変長**: 1 文字は 1 バイトから 4 バイトまでの長さになります。ASCII の文字は、先頭が 0 で始まる 1 バイトだけです。
- **`utf8.RuneSelf`**: ASCII の上限（0x80）です。これより小さいバイトは 1 バイトの文字です。
- **`io.EOF`**: 読み終わったことを表すエラーの値です。

## 何をしているか

### 1. 空なら EOF を返す

```go:line-numbers=392
	if b.empty() {
		// バッファが空なので、領域を取り戻すために Reset する。
		b.Reset()
		return 0, 0, io.EOF
```

バッファが空なら、読めるものがありません。`Reset` で内部の領域を整えてから、`io.EOF` を返します。`Reset` は、読み尽くしたバッファの領域を次の書き込みに使えるようにするためのものです。

### 2. ASCII は速い道で処理する

```go:line-numbers=397
	c := b.buf[b.off]
	if c < utf8.RuneSelf {
		b.off++
		b.lastRead = opReadRune1
		return rune(c), 1, nil
	}
```

先頭のバイトが `utf8.RuneSelf` より小さいなら、1 バイトの文字です。`rune(c)` に変換して、読み取り位置を 1 つだけ進めます。ほとんどの文字は ASCII なので、この道が速く動きます。

### 3. 多バイトの文字は utf8 に任せる

```go:line-numbers=403
	r, n := utf8.DecodeRune(b.buf[b.off:])
	b.off += n
	b.lastRead = readOp(n)
	return r, n, nil
```

それ以外は、`utf8.DecodeRune` で 1 文字ぶんを読み出します。戻り値の `n` は、その文字が使ったバイト数です。読み取り位置を `n` だけ進め、`lastRead` には `readOp(n)` で、何バイト読んだかを記録します。

## ここがすごい

- **よく使う場合を先に処理する**: ASCII の文字は、1 バイトを見るだけで済みます。複雑な復号を毎回行わず、必要なときだけ行います。
- **読んだ量を返す**: 呼び出し側は、読んだ文字のバイト数を知ることができます。読み戻しや、位置の計算にそのまま使えます。
- **空の場合に後始末をする**: 読み尽くしたら `Reset` して領域を戻すので、長く使うバッファが無駄に大きくなりにくくなります。

## まとめ

- ASCII の 1 バイトは速い道で処理し、それ以外は `utf8.DecodeRune` に任せる。
- 戻り値は文字と、そのバイト数の組である。
- 空のときは `io.EOF` を返し、領域を整えてから終わる。
