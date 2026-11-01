---
title: "輪から続く n 個を取り外す ring.Unlink"
description: "container/ring の Unlink は、リングの現在の要素の次から n 個を輪から外し、外した部分を新しいリングとして返します。Move で位置を進めてから、つなぎ直します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [107, 112]
function: "Unlink"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`r.Unlink(2)` は、`r` の次の 2 つの要素を輪から外して返します。外れた 2 つは、それ自身で輪を作っています。

## コード

```go:line-numbers=107
func (r *Ring) Unlink(n int) *Ring {
	if n <= 0 {
		return nil
	}
	return r.Link(r.Move(n + 1))
}
```

## 前提知識

- **`Ring`**: 要素が環のようにつながったデータ構造です。最後の要素の次は、最初の要素に戻ります。
- **`Move(n)`**: 環の上で、`n` 個先の要素を返す関数です。負の数なら逆向きに進みます。
- **`Link`**: 2 つの環をつなぎ、つなぐ前の要素の次を返す関数です。環を分けたり、つないだりできます。
- **`n <= 0` の扱い**: 外す数が 0 以下なら、外すものはありません。`nil` を返します。

## 何をしているか

### 1. 外せない場合は nil を返す

```go:line-numbers=108
	if n <= 0 {
		return nil
	}
```

`n` が 0 以下なら、外すものが無いので `nil` を返します。

### 2. 外す範囲の先頭を求める

```go:line-numbers=111
	return r.Link(r.Move(n + 1))
```

`r.Move(n + 1)` は、`r` から `n+1` 個先の要素です。この要素が、外す部分の後ろに来る要素になります。

### 3. つなぎ直して、外した部分を返す

```go:line-numbers=111
	return r.Link(r.Move(n + 1))
```

`r.Link(...)` は、`r` と、後ろの要素の間を付け替えます。外れた `n` 個は、つながりを切られた形で返されます。

## ここがすごい

- **1 回の付け替えで済む**: 要素を 1 つずつ外すのではなく、範囲をまとめて切り離します。
- **外した部分が環になる**: 外れた部分は、単独の環として使えるので、そのまま別の操作に渡せます。
- **Move と Link の組み合わせ**: 位置を進める関数と、つなぐ関数を組み合わせるだけで、外す処理が書けます。

## まとめ

- 外す数が 0 以下なら、`nil` を返す。
- `Move` で範囲の終わりを求め、`Link` でつなぎ直す。
- 外した部分は、単独の環として返される。
