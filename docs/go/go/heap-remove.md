---
title: "任意の位置の要素を取り除く heap.Remove"
description: "heap.Remove は、ヒープの i 番目の要素を取り除きます。末尾の要素と入れ替えてから、入れ替えた要素を上か下へ動かして、ヒープの形を直します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/heap/heap.go"
lines: [68, 77]
function: "Remove"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`heap.Remove(h, i)` は、ヒープの `i` 番目の要素を取り出して返します。最後の要素と入れ替えてから末尾を外すことで、途中の要素を、ヒープの形を保ったまま取り除きます。

## コード

```go:line-numbers=68
func Remove(h Interface, i int) any {
	n := h.Len() - 1
	if n != i {
		h.Swap(i, n)
		if !down(h, i, n) {
			up(h, i)
		}
	}
	return h.Pop()
}
```

## 前提知識

- **ヒープ**: 親が子より小さい（または大きい）という順序を保つ木です。最小値を先頭に置くことが多くなります。
- **`heap.Interface`**: `Len`、`Less`、`Swap`、`Push`、`Pop` を持つ型です。ヒープの操作は、この型の関数を通して行われます。
- **`down` と `up`**: 要素を、子の方向と親の方向へ動かして、順序を直す関数です。
- **`Pop`**: 末尾の要素を取り除いて返します。

## 何をしているか

### 1. 末尾と入れ替える

```go:line-numbers=69
	n := h.Len() - 1
	if n != i {
		h.Swap(i, n)
```

`n` は、末尾の要素の位置です。取り除きたい位置 `i` が末尾でないときは、`i` と `n` を入れ替えます。こうすると、取り除きたい要素が末尾に移ります。

### 2. 入れ替えた要素の置き場所を直す

```go:line-numbers=72
		if !down(h, i, n) {
			up(h, i)
		}
```

入れ替えたあとの要素は、元の位置では順序が合わないかもしれません。まず `down` で下へ動かせるかを試し、動かなければ `up` で上へ動かします。どちらかで、ヒープの順序が元に戻ります。

### 3. 末尾を取り除いて返す

```go:line-numbers=76
	return h.Pop()
```

末尾には、取り除きたかった要素があります。`h.Pop()` で、それを外して返します。

## ここがすごい

- **末尾の取り出しを速く済ませる**: 途中の要素を消すと、配列の穴を詰める必要があります。末尾から取り除けば、詰める作業が要りません。
- **動かす向きを 1 回だけ決める**: `down` が動いたかを見て、動かなかったときだけ `up` を試します。両方を毎回行うより無駄がありません。
- **順序の決まりを壊さない**: 入れ替えたあとに、必ず上か下のどちらかへ直すので、残りの要素はヒープの条件を保ちます。

## まとめ

- 取り除く要素を末尾と入れ替え、入れ替えた要素の位置を直す。
- `down` で動かなければ `up` を試し、順序を保つ。
- 末尾を `Pop` で外し、取り除いた要素を返す。
