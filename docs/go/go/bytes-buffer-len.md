---
title: "読み残しのバイト数を返す bytes.Buffer.Len"
description: "bytes.Buffer.Len は、まだ読んでいないバイトの数を返します。バッファ全体の長さから、読み取り位置 off を引いた値です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [97, 97]
function: "Len"
difficulty: 1
format: 2
tags: [入出力, データ構造, 標準ライブラリ]
---

## ひとことで

`buf.Len()` は、まだ読んでいないバイトの数を返します。書き込んだ量ではなく、これから読める量を表すので、読み終わったかの判定に使えます。

## コード

```go:line-numbers=97
func (b *Buffer) Len() int { return len(b.buf) - b.off }
```

## 前提知識

- **`bytes.Buffer` の内部**: 書き込んだバイトは `buf` に入り、読んだ位置は `off` で覚えています。
- **読み残し**: `off` より後ろにあるバイトが、まだ読んでいない部分です。
- **`len`**: スライスの要素数を返す組み込みの関数です。
- **読み出しで変わる値**: `Read` などを呼ぶと、`off` が進むので、`Len` の値は減ります。

## 何をしているか

### 1. 全体の長さから読んだ分を引く

```go:line-numbers=97
func (b *Buffer) Len() int { return len(b.buf) - b.off }
```

`len(b.buf)` は、書き込まれた全体の長さです。そこから `b.off` を引くと、読んでいない部分の長さになります。

## ここがすごい

- **計算が一行で済む**: 別に読んだ量を数えて持つ必要がありません。`off` だけで読み残しが分かります。
- **読むたびに自然に減る**: 読み出しの関数は `off` を進めるだけなので、`Len` の値は常に正しく保たれます。
- **空の判定に使える**: `Len() == 0` なら、読めるものが無いと分かります。

## まとめ

- 書き込まれた全体の長さから、読み取り位置を引く。
- 読み残しのバイト数が、1 行の計算で得られる。
- 読み出しで `off` が進むので、値は自然に減る。
