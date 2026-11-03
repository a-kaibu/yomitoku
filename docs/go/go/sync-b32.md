---
title: "真偽の値を 1 か 0 の uint32 に変える sync/atomic の b32"
description: "sync/atomic パッケージの b32。bool の値を、真なら 1、偽なら 0 の uint32 に変える。アトミックな操作の中で、真偽の値を整数として扱うために使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sync/atomic/type.go"
lines: [33, 38]
function: "b32"
difficulty: 1
tags: [並行処理, 数値計算]
---

## ひとことで

`b32(b)` は、真偽の値 `b` を、`uint32` の 1 か 0 に変えます。`true` なら 1、`false` なら 0 を返します。

## コード

```go:line-numbers=33
func b32(b bool) uint32 {
	if b {
		return 1
	}
	return 0
}
```

## 前提知識

- **アトミック操作**: 複数の処理が同時に触っても、途中の状態を見られない操作です。`sync/atomic` が提供します。
- **uint32**: 32 ビットの符号なし整数です。アトミックな操作は、整数に対して行うのが基本です。
- **bool**: 真か偽の値です。整数の操作に混ぜられないので、変換が必要になります。

## 何をしているか

### 1. 真なら 1 を返す

```go:line-numbers=34
	if b {
		return 1
	}
```

`b` が `true` なら、`1` を返します。

### 2. 偽なら 0 を返す

```go:line-numbers=37
	return 0
```

`b` が `false` なら、`0` を返します。

結果の型は `uint32` なので、`uint32` を扱う操作の引数として、そのまま使えます。真偽の値を、整数の形に揃えるための小さな変換です。

関数の本体は、四行ほどの分岐だけです。それでも、アトミックな操作の中で真偽の値を扱うには欠かせない役目を持ちます。変換を一か所にまとめておくと、真偽と整数の対応を、どこで決めたかが分かりやすくなります。

## ここがすごい

- **整数の操作に渡せる**: 真偽の値を整数に変えるので、整数向けのアトミックな操作の中で使えます。
- **二つの戻り値だけ**: 分岐は一つだけで、結果は 1 か 0 に限られるので、読みやすい関数です。

## まとめ

- `b32` は、真偽の値を 1 か 0 の `uint32` に変えます。
- 真なら 1、偽なら 0 を返します。
- アトミックな操作の中で、整数として扱うために使われます。
