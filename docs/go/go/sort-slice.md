---
title: "any 型の配列を less で並べ替える sort.Slice"
description: "sort パッケージの Slice。任意のスライス x と比較関数 less を受け取り、reflectlite で要素を入れ替える関数を作って、pdqsort でスライスを並べ替える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sort/slice.go"
lines: [24, 30]
function: "Slice"
difficulty: 2
tags: [ソート, 標準ライブラリ]
---

## ひとことで

`sort.Slice(x, less)` は、どんなスライスでも、比較関数 `less` を使って並べ替えます。並べ替えの型を、呼び出し側が決める必要はありません。

## コード

```go:line-numbers=24
func Slice(x any, less func(i, j int) bool) {
	rv := reflectlite.ValueOf(x)
	swap := reflectlite.Swapper(x)
	length := rv.Len()
	limit := bits.Len(uint(length))
	pdqsort_func(lessSwap{less, swap}, 0, length, limit)
}
```

## 前提知識

- **any**: どんな型の値でも入る型です。`x` には、任意のスライスを渡せます。
- **less**: 「`i` の要素が `j` の要素より前か」を返す関数です。並べ替えの順序を決めます。
- **reflectlite**: 実行時に値の型や長さを調べる、内部のパッケージです。

## 何をしているか

### 1. 値の情報と入れ替える関数を作る

```go:line-numbers=25
	rv := reflectlite.ValueOf(x)
	swap := reflectlite.Swapper(x)
```

`x` を反射の値として扱い、二つの要素を入れ替える関数 `swap` を作ります。型を知らなくても、要素の入れ替えができます。

### 2. 長さと深さの上限を決めて並べ替える

```go:line-numbers=27
	length := rv.Len()
	limit := bits.Len(uint(length))
	pdqsort_func(lessSwap{less, swap}, 0, length, limit)
```

長さを求め、その桁数から、再帰の深さの上限 `limit` を決めます。`pdqsort_func` は、`less` と `swap` を使って、長さの範囲を並べ替えます。

## ここがすごい

- **型を問わない並べ替え**: 反射で入れ替えを作るので、呼び出し側は、スライスの型ごとに関数を書かなくて済みます。
- **深さの上限で止まる**: 再帰の深さを上限で抑えるので、最悪の入力でも計算量が暴れにくくなります。

## まとめ

- `sort.Slice` は、任意のスライスを `less` の順に並べ替えます。
- 反射で要素の入れ替えを作ります。
- 並べ替えの本体は、`pdqsort_func` に任せます。
