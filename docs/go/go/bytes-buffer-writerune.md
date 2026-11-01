---
title: "文字を UTF-8 にして書き足す bytes.Buffer.WriteRune"
description: "bytes.Buffer.WriteRune は、rune を UTF-8 のバイト列にしてバッファの末尾へ書き足します。ASCII はバイトを 1 つ書くだけで済ませ、それ以外は書き込み先の領域を確保してから追加します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [317, 330]
function: "WriteRune"
difficulty: 2
format: 2
tags: [入出力, Unicode, 標準ライブラリ, 最適化]
---

## ひとことで

`buf.WriteRune('あ')` は、文字 `あ` を UTF-8 の 3 バイトにして、バッファの末尾へ書き足します。戻り値は、書き足したバイト数です。

## コード

::: code-group

```go:line-numbers=317 [日本語訳]
func (b *Buffer) WriteRune(r rune) (n int, err error) {
	// uint32 として比べ、負の rune も正しく扱えるようにする。
	if uint32(r) < utf8.RuneSelf {
		b.WriteByte(byte(r))
		return 1, nil
	}
	b.lastRead = opInvalid
	m, ok := b.tryGrowByReslice(utf8.UTFMax)
	if !ok {
		m = b.grow(utf8.UTFMax)
	}
	b.buf = utf8.AppendRune(b.buf[:m], r)
	return len(b.buf) - m, nil
}
```

```go:line-numbers=317 [原文]
func (b *Buffer) WriteRune(r rune) (n int, err error) {
	// Compare as uint32 to correctly handle negative runes.
	if uint32(r) < utf8.RuneSelf {
		b.WriteByte(byte(r))
		return 1, nil
	}
	b.lastRead = opInvalid
	m, ok := b.tryGrowByReslice(utf8.UTFMax)
	if !ok {
		m = b.grow(utf8.UTFMax)
	}
	b.buf = utf8.AppendRune(b.buf[:m], r)
	return len(b.buf) - m, nil
}
```

:::

## 前提知識

- **`rune`**: 1 文字を表す整数です。`'あ'` は、Unicode の番号を値に持つ `rune` です。
- **UTF-8 のバイト数**: ASCII は 1 バイト、日本語の多くは 3 バイトです。`utf8.UTFMax` は、1 文字の最大バイト数で、4 です。
- **`utf8.RuneSelf`**: ASCII の上限（0x80）です。
- **領域の確保**: 末尾に書くには、バッファの中に十分な空きが必要です。足りなければ、`grow` で広げます。

## 何をしているか

### 1. ASCII はバイトとして書く

```go:line-numbers=319
	if uint32(r) < utf8.RuneSelf {
		b.WriteByte(byte(r))
		return 1, nil
```

値が `utf8.RuneSelf` より小さいなら、1 バイトの文字です。`WriteByte` を呼ぶだけで済み、戻り値は `1` です。ASCII が多い文字列では、この速い道がよく使われます。

### 2. 書く前に空きを確保する

```go:line-numbers=323
	b.lastRead = opInvalid
	m, ok := b.tryGrowByReslice(utf8.UTFMax)
	if !ok {
		m = b.grow(utf8.UTFMax)
	}
```

`lastRead` を `opInvalid` にして、読み戻しを無効にします。そのあと、`tryGrowByReslice` で、今ある領域の中に 4 バイトぶんの空きがあるかを試します。無ければ、`grow` で領域を広げます。

### 3. UTF-8 にして追加する

```go:line-numbers=328
	b.buf = utf8.AppendRune(b.buf[:m], r)
	return len(b.buf) - m, nil
```

`utf8.AppendRune` は、`rune` を UTF-8 のバイト列にして、与えられたスライスの末尾へ追加します。書いたバイト数は、追加の前後の長さの差で求めています。

## ここがすごい

- **1 バイトの文字を特別扱いする**: ASCII の文字は、変換の仕組みを通さず、1 バイトを書くだけです。
- **空きを先に確保する**: 最大の 4 バイトぶんを先に確保するので、書いている途中で領域が足りなくなる心配がありません。
- **書いたバイト数を返す**: 戻り値で、どれだけ増えたかを呼び出し側に伝えます。文字によって長さが違うので、これは役に立ちます。

## まとめ

- ASCII は 1 バイトとして書き、それ以外は UTF-8 に変換して追加する。
- 書く前に、最大 4 バイトぶんの空きを確保する。
- 戻り値は、書き足したバイト数である。
