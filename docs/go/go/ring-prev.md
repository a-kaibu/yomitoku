---
title: "輪の前の要素へ戻る ring.Prev"
description: "container/ring の Prev は、輪の上で現在の要素の前を返します。Next と対になる関数で、まだ輪になっていない要素では自分だけの輪を作ってから返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [33, 38]
function: "Prev"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`r.Prev()` は、輪の中で `r` のすぐ前の要素を返します。最初の要素の前は、最後の要素になります。`Next` を逆向きにたどる関数です。

## コード

```go:line-numbers=33
func (r *Ring) Prev() *Ring {
	if r.next == nil {
		return r.init()
	}
	return r.prev
}
```

## 前提知識

- **`Ring`**: 要素が輪のようにつながったデータ構造です。
- **`prev` の役割**: 各要素が、前の要素への参照を持っています。
- **未初期化の要素**: `next` が `nil` なら、まだ輪に入っていません。
- **`Next` との対**: `Next` は次へ、`Prev` は前へ進みます。

## 何をしているか

### 1. 輪に入っていなければ準備する

```go:line-numbers=34
	if r.next == nil {
		return r.init()
	}
```

`next` が `nil` なら、`init` で自分だけの輪を作ってから、その要素を返します。`Next` と同じ準備です。

### 2. 前の要素を返す

```go:line-numbers=37
	return r.prev
```

輪になっていれば、`prev` の指す要素を返します。

## ここがすごい

- **逆向きにも簡単に進める**: 前への参照を持つので、前へ戻るのも一度の参照で済みます。
- **準備の仕組みをそろえる**: `Next` と `Prev` で、同じ準備を行うので、動きが対称になります。
- **1 周を逆向きにできる**: `for p := r.Prev(); p != r; p = p.Prev()` と書くと、逆向きに 1 周できます。

## まとめ

- 前の要素は、`prev` の指す先である。
- 未初期化の要素は、自分だけの輪にしてから返す。
- `Next` と対になり、逆向きに進める。
