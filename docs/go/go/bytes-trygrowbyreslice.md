---
title: "空きがあればバッファを伸ばす tryGrowByReslice。確保し直さない"
description: "bytes パッケージの Buffer.tryGrowByReslice。バッファの容量に余裕があれば、新しい領域を確保せずに、長さだけを n 増やす。増やす前の長さと、成功したかを返す。余裕がなければ失敗を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/buffer.go"
lines: [133, 139]
function: "tryGrowByReslice"
difficulty: 2
tags: [メモリ管理, 最適化, 入出力]
---

## ひとことで

`b.tryGrowByReslice(n)` は、バッファの長さを `n` だけ増やせるかを試します。容量に空きがあれば、長さだけを増やし、増える前の長さと `true` を返します。空きがなければ、`0` と `false` を返します。

`bytes.Buffer` は、データを追加し続けるための入れ物です。追加のたびに領域を作り直すと遅くなるので、まず既存の容量で間に合うかを試します。

## コード

```go:line-numbers=133
func (b *Buffer) tryGrowByReslice(n int) (int, bool) {
	if l := len(b.buf); n <= cap(b.buf)-l {
		b.buf = b.buf[:l+n]
		return l, true
	}
	return 0, false
}
```

## 前提知識

- **長さ（len）と容量（cap）**: 長さは今使っている部分、容量は確保してある全体の大きさです。容量に余裕があれば、長さを伸ばすだけで領域が使えます。
- **再スライス（reslice）**: 既存の配列の中で、長さを変えたスライスを作ることです。新しい配列は作られません。
- **バッファの追加**: `Buffer` に書き込むとき、まず既存の容量に収まるかを見ます。収まらなければ、別の方法で大きくします。
- **戻り値の意味**: 最初の値は、増やす前の長さです。書き込み先の位置として使えます。

## 何をしているか

### 1. 容量に余裕があるかを確かめる

```go:line-numbers=134
	if l := len(b.buf); n <= cap(b.buf)-l {
```

今の長さ `l` を取り出して、残りの容量 `cap - l` が `n` 以上かを調べます。余裕があれば、ここから先に進みます。

### 2. 長さだけを伸ばす

```go:line-numbers=135
		b.buf = b.buf[:l+n]
		return l, true
```

容量の中で、長さを `l+n` まで伸ばします。新しい配列は作りません。増える前の長さ `l` を、書き込み位置として返します。

### 3. 余裕がなければ失敗を返す

```go:line-numbers=138
	return 0, false
```

容量が足りなければ、ここで `0` と `false` を返します。呼び出し側は、別の方法で領域を用意してから、もう一度試します。

## ここがすごい

- **確保をしない近道**: 既存の容量で足りれば、メモリの確保もコピーも起きません。追加が続く場面で、大きな効果があります。
- **失敗を値で返す**: 足りないときは、無理に確保せず、`false` で伝えます。何をすべきかを、呼び出し側が決められます。
- **書き込み位置も一緒に返す**: 増える前の長さを返すので、呼び出し側は、どこに書けばよいかをすぐに知ることができます。

## まとめ

- `tryGrowByReslice` は、既存の容量で長さを `n` 伸ばせるかを試します。
- 余裕があれば、新しい領域を作らずに長さだけを伸ばします。
- 増える前の長さと成功の有無を返します。
