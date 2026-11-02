---
title: "輪のすべての値を順に処理する ring.Do"
description: "container/ring の Do は、輪の各要素の Value に、与えられた関数を順に適用します。現在の要素から始めて 1 周し、元の要素で止まります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [129, 136]
function: "Do"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`r.Do(func(v any) { fmt.Println(v) })` は、輪の値をすべて表示します。現在の要素から始めて、1 周したら止まります。

## コード

```go:line-numbers=129
func (r *Ring) Do(f func(any)) {
	if r != nil {
		f(r.Value)
		for p := r.Next(); p != r; p = p.next {
			f(p.Value)
		}
	}
}
```

## 前提知識

- **`func(any)`**: 値を 1 つ受け取り、何も返さない関数です。`any` は任意の型を表します。
- **1 周**: 輪の中のすべての要素を、一度ずつ訪れることです。
- **`nil` の輪**: `r` が `nil` なら、何もせずに戻ります。
- **`Next` による進み方**: 次の要素をたどって、元の要素に戻るまで繰り返します。

## 何をしているか

### 1. nil なら何もしない

```go:line-numbers=130
	if r != nil {
```

`r` が `nil` の場合、処理する要素がありません。判定を先に行い、何もせずに終わります。

### 2. 最初の要素の値を渡す

```go:line-numbers=131
		f(r.Value)
```

現在の要素の値を、関数に渡します。ここから 1 周が始まります。

### 3. 次々に進めて、元に戻ったら止める

```go:line-numbers=132
		for p := r.Next(); p != r; p = p.next {
			f(p.Value)
		}
```

`p` を次の要素へ進めながら、その値を関数に渡します。`p` が最初の要素 `r` に戻ったら、1 周が終わったので止まります。

## ここがすごい

- **終わりを自然に決める**: 末尾がないので、元の要素に戻ったことで 1 周を判断できます。
- **処理を関数で渡す**: 何をするかは呼び出し側が決めます。値の表示でも、集計でも同じ形で書けます。
- **`nil` に強い**: 空の輪を渡しても、パニックせずに終わります。

## まとめ

- `nil` の輪は、何もせずに終わる。
- 現在の要素から始めて、値を関数に順に渡す。
- 元の要素に戻ったところで止まる。
