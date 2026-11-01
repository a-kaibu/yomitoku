---
title: "読まずに捨てる量を、バッファを埋めながら数える bufio.Reader.Discard"
description: "bufio.Reader の Discard は、指定した量のバイトを読まずに捨てます。バッファの中にあるぶんは位置を進めるだけで済ませ、足りなければ読み込みを繰り返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bufio/bufio.go"
lines: [177, 207]
function: "(*Reader).Discard"
difficulty: 2
format: 2
tags: [入出力, 最適化, 標準ライブラリ]
---

## ひとことで

`bufio.Reader` は、入力をまとめて読んで、一時的にためておくバッファを持ちます。`Discard(n)` は、そこから `n` バイトを読まずに捨てます。読み取りの位置だけを進めるので、データを外へ出す必要はありません。

たとえば、ファイルの先頭 100 バイトを飛ばしたいときに使えます。

## コード

```go:line-numbers=177
func (b *Reader) Discard(n int) (discarded int, err error) {
	if n < 0 {
		return 0, ErrNegativeCount
	}
	if n == 0 {
		return
	}

	b.lastByte = -1
	b.lastRuneSize = -1

	remain := n
	for {
		skip := b.Buffered()
		if skip == 0 {
			b.fill()
			skip = b.Buffered()
		}
		if skip > remain {
			skip = remain
		}
		b.r += skip
		remain -= skip
		if remain == 0 {
			return n, nil
		}
		if b.err != nil {
			return n - remain, b.readErr()
		}
	}
}
```

## 前提知識

- **バッファ**: 入力を一度にまとめて読み、その中から少しずつ取り出すための領域です。
- **`b.Buffered()`**: バッファに、まだ読んでいないデータが何バイトあるかを返します。
- **`b.fill()`**: 入力元から読んで、バッファを埋めます。
- **`b.r`**: バッファの中の読み取りの位置です。これを進めると、その分のデータが捨てられます。

## 何をしているか

`n = 10`、バッファに 4 バイトあり、残りは入力元にあるとして追います。

### 1. 負の数や 0 は先に返す

```go:line-numbers=178
	if n < 0 {
		return 0, ErrNegativeCount
	}
	if n == 0 {
		return
	}
```

負の数はエラーを返します。0 なら、何もせずに戻ります。

### 2. バッファにあるぶんを進める

```go:line-numbers=190
		skip := b.Buffered()
		if skip == 0 {
			b.fill()
			skip = b.Buffered()
		}
		if skip > remain {
			skip = remain
		}
		b.r += skip
		remain -= skip
```

まず、バッファにあるデータの量 `skip = 4` を見ます。`remain = 10` より小さいので、そのまま 4 だけ進めます。`remain` は 6 になります。バッファが空なら、`fill` で入力元から読み込んでから数えます。

### 3. 足りなければ繰り返す

```go:line-numbers=200
		if remain == 0 {
			return n, nil
		}
		if b.err != nil {
			return n - remain, b.readErr()
		}
```

`remain` が 0 になったら、すべて捨てたので `n` を返します。まだ残っていて、エラーもなければ、ループの先頭に戻って、もう一度バッファを埋めます。エラーがあれば、捨てられた量と、そのエラーを返します。

## ここがすごい

- **データを移さない**: 捨てるだけなので、バイトをどこかにコピーしません。読み取りの位置を進めるだけで済みます。
- **残りが少ないときに切り詰める**: バッファにあるぶんが `remain` より多ければ、`remain` まで。少なければ全部。この 1 行で、余分に進みすぎることを防いでいます。
- **途中で止まっても量が分かる**: エラーで途中終了した場合も、実際に捨てられた量 `n - remain` を返します。呼び出し側は、どこまで進んだかが分かります。

## まとめ

- 読み捨ては、バッファの中の位置を進めるだけで済ませられる。
- 残りの量とバッファの量を比べて、進む量を決める。
- 途中で止まったときは、実際に進んだ量を返すと、呼び出し側が状況を判断できる。
