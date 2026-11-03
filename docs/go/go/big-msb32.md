---
title: "多倍長の数の最上位の 32 ビットを返す msb32"
description: "math/big の msb32。nat の最上位の語から、上位 32 ビットを取り出す。語が 32 ビットならそのまま、64 ビットなら上位の半分を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/float.go"
lines: [697, 712]
function: "msb32"
difficulty: 3
tags: [ビット演算, 数値計算, 移植性]
---

## ひとことで

`msb32(x)` は、多倍長の数 `x` の最上位の語から、上位 32 ビットを取り出して返します。`x` が空のときは、0 を返します。

## コード

```go:line-numbers=697
func msb32(x nat) uint32 {
	i := len(x) - 1
	if i < 0 {
		return 0
	}
	if debugFloat && x[i]&(1<<(_W-1)) == 0 {
		panic("x not normalized")
	}
	switch _W {
	case 32:
		return uint32(x[i])
	case 64:
		return uint32(x[i] >> 32)
	}
	panic("unreachable")
}
```

## 前提知識

- **nat**: `math/big` が多倍長の自然数を表すために使う型です。語の並びで数を持ちます。
- **語（Word）**: 数を分けて持つときの一つの単位です。その大きさは、環境の `_W` で決まります。
- **最上位の語**: 並びの一番後ろにある語です。数の最も大きい位置を表します。
- **`debugFloat`**: デバッグのときだけ真になる定数です。正規化されていない数を見つけるために使います。

## 何をしているか

### 1. 空なら 0 を返す

```go:line-numbers=698
	i := len(x) - 1
	if i < 0 {
		return 0
	}
```

`len(x)-1` が最上位の語の位置です。`x` が空なら位置が負になるので、0 を返します。

### 2. デバッグ時の確認

```go:line-numbers=702
	if debugFloat && x[i]&(1<<(_W-1)) == 0 {
		panic("x not normalized")
	}
```

デバッグのときだけ、最上位のビットが立っているかを確かめます。立っていなければ、正規化されていないと判断してパニックさせます。

### 3. 語の大きさで取り出し方を変える

```go:line-numbers=705
	switch _W {
	case 32:
		return uint32(x[i])
	case 64:
		return uint32(x[i] >> 32)
	}
	panic("unreachable")
```

語が 32 ビットなら、その値をそのまま返します。64 ビットなら、右に 32 ビットずらして、上位の半分を取り出します。どちらでもない環境は、ここまで来ないはずなので、パニックにします。

## ここがすごい

- **同じ式で環境を切り替える**: `_W` の値で式を切り替えるので、32 ビットでも 64 ビットでも、上位の 32 ビットを同じ意味で取り出せます。
- **想定外を明示する**: 到達しないはずの場所は `panic` で止めるので、思わぬ環境で誤った値を返すことがありません。

## まとめ

- `msb32` は、最上位の語から上位 32 ビットを返します。
- 空の数は 0 として扱います。
- 語の大きさで取り出し方を変え、想定外の環境は止めます。
