---
title: "受け取るデータの長さを安全に読む gob の getLength。大きすぎる長さを拒否する"
description: "encoding/gob の decoderState.getLength。データの長さを表す整数を読み、負の値、残りのバイトより大きい値、上限を超える値を拒否する。読み込み前に、確保するメモリの量を決められるようにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/decode.go"
lines: [184, 190]
function: "getLength"
difficulty: 2
tags: [防御的プログラミング, パース, 入出力]
---

## ひとことで

`state.getLength()` は、gob のデータの中に書かれた「長さ」を読みます。その値が本当に使える長さかを確かめてから、呼び出し側に返します。

長さを書いたデータは、悪意のある値が入っていることがあります。大きすぎる長さを信じてメモリを確保すると、プログラムが止まってしまいます。この関数は、その入り口で危ない値を弾きます。

## コード

```go:line-numbers=184
func (state *decoderState) getLength() (int, bool) {
	n := int(state.decodeUint())
	if n < 0 || state.b.Len() < n || tooBig <= n {
		return 0, false
	}
	return n, true
}
```

## 前提知識

- **gob**: Go の値を、バイト列にして送るための形式です。データの前に、続く長さを書く決まりがあります。
- **`decodeUint`**: 符号なしの整数を、バイト列から読む関数です。
- **`state.b.Len()`**: まだ読んでいない残りのバイトの数です。長さがこれを超えていれば、データが足りません。
- **`tooBig`**: 扱ってよい長さの上限を表す定数です。これより大きい値は、拒否します。

## 何をしているか

### 1. 長さを読む

```go:line-numbers=185
	n := int(state.decodeUint())
```

まず、符号なしの整数を読んで、`int` に変えて `n` に入れます。この時点では、値はまだ信用されていません。

### 2. 範囲を三つの条件で確かめる

```go:line-numbers=186
	if n < 0 || state.b.Len() < n || tooBig <= n {
		return 0, false
	}
	return n, true
```

`n` が負なら、長さとして無意味です。残りのバイトより大きければ、データが途中で切れています。上限以上であれば、大きすぎるとして拒否します。三つのどれにも当たらなければ、`n` を有効な長さとして返します。

## ここがすごい

- **確保の前に確かめる**: 長さに従ってメモリを作る前に、この関数で判断します。大きな値で一気にメモリを使い切る攻撃を防ぎます。
- **残りのデータと比べる**: 残りのバイトより大きい長さは、読み切れないのでそもそも拒否します。データの形と整合を取ります。
- **成否を真偽値で返す**: 失敗は `false` で伝えるので、呼び出し側は読み取りを続けずに止められます。

## まとめ

- `getLength` は、データの長さを読み、安全な範囲かを確かめます。
- 負の値、残りより大きい値、上限を超える値は拒否します。
- 安全な長さだけを返すので、メモリの確保が暴走しません。
