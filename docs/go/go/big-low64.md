---
title: "多倍長の数の下位 64 ビットを返す low64"
description: "math/big の low64。nat の最下位の語から、下位 64 ビットを uint64 として返す。語が 32 ビットのときは、二つの語を組み合わせて 64 ビットにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/int.go"
lines: [500, 509]
function: "low64"
difficulty: 2
tags: [ビット演算, 移植性]
---

## ひとことで

`low64(x)` は、多倍長の数 `x` の下位 64 ビットを `uint64` として返します。`x` が空なら 0 を返します。

## コード

```go:line-numbers=500
func low64(x nat) uint64 {
	if len(x) == 0 {
		return 0
	}
	v := uint64(x[0])
	if _W == 32 && len(x) > 1 {
		return uint64(x[1])<<32 | v
	}
	return v
}
```

## 前提知識

- **nat**: 多倍長の自然数を、語の並びで表す型です。並びの先頭が最下位の語です。
- **語（Word）**: 数を分けて持つときの単位です。環境によって 32 ビットか 64 ビットになります。
- **論理和 `|`**: 二つの値のビットを合わせます。上位と下位を並べるときに使います。

## 何をしているか

### 1. 空なら 0 を返す

```go:line-numbers=501
	if len(x) == 0 {
		return 0
	}
```

語が一つもなければ、数は 0 です。

### 2. 最下位の語を取り出す

```go:line-numbers=504
	v := uint64(x[0])
```

最下位の語を `uint64` に広げて、`v` に入れます。

### 3. 語が 32 ビットなら二つ組み合わせる

```go:line-numbers=505
	if _W == 32 && len(x) > 1 {
		return uint64(x[1])<<32 | v
	}
```

語が 32 ビットで、二つ目の語があるときは、二つの語を合わせて 64 ビットにします。二つ目の語を 32 ビットずらして上位に置き、`|` で下位と合わせます。

### 4. それ以外は最下位の語だけを返す

```go:line-numbers=508
	return v
```

語が 64 ビットなら、最下位の語だけで 64 ビットになるので、そのまま返します。

## ここがすごい

- **環境の差を一か所に閉じる**: 32 ビットと 64 ビットの違いは、この関数の中で吸収します。呼び出し側は、常に 64 ビットの値を受け取れます。
- **二つ目の語は必要なときだけ読む**: 語が一つしかないときや、64 ビットの環境では、余計な読み出しをしません。

## まとめ

- `low64` は、数の下位 64 ビットを返します。
- 32 ビットの環境では、二つの語を合わせます。
- 空の数は 0 として扱います。
