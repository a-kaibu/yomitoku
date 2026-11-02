---
title: "追加で書ける空きの大きさを返す bytes.Buffer.Available"
description: "bytes.Buffer.Available は、再確保せずに書き足せるバイト数を返します。容量から長さを引いた値で、書き込み前に空きを確かめるのに使えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [104, 104]
function: "Available"
difficulty: 1
format: 2
tags: [メモリ管理, 入出力, 標準ライブラリ]
---

## ひとことで

`buf.Available()` は、今の配列の中に、まだ空いている場所の大きさを返します。この大きさまでなら、新しい配列を作らずに書き足せます。

## コード

```go:line-numbers=104
func (b *Buffer) Available() int { return cap(b.buf) - len(b.buf) }
```

## 前提知識

- **容量と長さの差**: 容量は確保された大きさ、長さは今使っている大きさです。その差が空きです。
- **`cap` と `len`**: どちらも組み込みの関数で、スライスの大きさを返します。
- **再確保**: 空きを超えて書くと、新しい配列を作ってコピーします。
- **読み取りの影響**: 読み出しは `off` を動かすだけなので、空きの計算には影響しません。
- **空きを使い切ると再確保**: 空きより大きな書き込みが来ると、新しい配列を確保して中身をコピーします。空きの大きさを知っておくと、この再確保の回数を見積もれます。
- **`Cap` との違い**: `Cap` は配列全体の大きさ、`Available` はそのうち書き足せる部分です。両方を見ると、今の状態が分かります。

## 何をしているか

### 1. 容量から長さを引く

```go:line-numbers=104
func (b *Buffer) Available() int { return cap(b.buf) - len(b.buf) }
```

`cap(b.buf)` は確保された大きさ、`len(b.buf)` は書き込んだ量です。その差が、まだ書き足せる空きになります。

## ここがすごい

- **空きを先に確かめられる**: 書く前に空きの大きさを知ると、再確保が必要かを判断できます。
- **式が単純**: 2 つの組み込みの関数の差だけで、空きが求まります。
- **読み取りに左右されない**: 読んだ分は空きに含めないので、書き込みの余地を正しく表します。

## まとめ

- 空きは、容量から長さを引いた値である。
- 空きを超える書き込みは、再確保を伴う。
- 書く前に空きを確かめると、判断がしやすい。
