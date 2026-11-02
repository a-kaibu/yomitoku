---
title: "バッファの確保済みの大きさを返す bytes.Buffer.Cap"
description: "bytes.Buffer.Cap は、バッファの内部の配列が確保している大きさを返します。書き込んだ量ではなく、配列の容量を表すので、再確保が起きるかの見積もりに使えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [101, 101]
function: "Cap"
difficulty: 1
format: 2
tags: [メモリ管理, 入出力, 標準ライブラリ]
---

## ひとことで

`buf.Cap()` は、バッファが今いくつ分の領域を確保しているかを返します。書き込んだ量を表す `Len` とは違い、配列そのものの大きさを表します。

## コード

```go:line-numbers=101
func (b *Buffer) Cap() int { return cap(b.buf) }
```

## 前提知識

- **長さと容量**: `len` は要素の数、`cap` は配列の確保された大きさです。
- **`bytes.Buffer` の内部**: バイトは `buf` のスライスに入ります。`buf` の容量が、`Cap` の値です。
- **再確保**: 容量を超えて書くと、新しい配列を作ってコピーします。その回数を減らすのが、容量管理の目的です。
- **`Available` との関係**: 空いている領域は、容量から長さを引いた値です。

## 何をしているか

### 1. スライスの容量を返す

```go:line-numbers=101
func (b *Buffer) Cap() int { return cap(b.buf) }
```

組み込みの `cap` で、内部のスライス `b.buf` の容量を求めて返します。読み取り位置の影響は受けません。

## ここがすごい

- **書き込み量と分けて見られる**: `Len` は書いた量、`Cap` は確保した量を表すので、両方を比べて状態を把握できます。
- **計算が 1 行で済む**: 内部の配列の大きさを、そのまま返すだけです。
- **見積もりに使える**: 大きなデータを書く前に容量を確認すると、再確保の回数を予想できます。

## まとめ

- `Cap` は、内部の配列が確保している大きさを返す。
- 書き込み量を表す `Len` とは別の値である。
- 再確保の見積もりに使える。
