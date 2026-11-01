---
title: "条件に合う最初の要素の位置を探す slices.IndexFunc"
description: "slices.IndexFunc は、スライスを先頭から見て、条件の関数が true を返す最初の要素の添字を返します。見つからなければ -1 を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [107, 114]
function: "IndexFunc"
difficulty: 1
format: 2
tags: [探索, ジェネリクス, 標準ライブラリ]
---

## ひとことで

`slices.IndexFunc(users, func(u User) bool { return u.Admin })` は、管理者の最初の位置を返します。比べる値の型が複雑でも、条件を関数で書けます。

## コード

```go:line-numbers=107
func IndexFunc[S ~[]E, E any](s S, f func(E) bool) int {
	for i := range s {
		if f(s[i]) {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **`slices.Index` との違い**: `Index` は値の一致で探します。`IndexFunc` は、関数の条件で探します。
- **条件の関数**: 要素を受け取り、真偽を返す関数です。
- **線形探索**: 先頭から 1 つずつ見る探し方です。
- **`-1` の意味**: 見つからなかったことを表します。添字は 0 以上なので、区別できます。

## 何をしているか

### 1. 先頭から順に見る

```go:line-numbers=108
	for i := range s {
		if f(s[i]) {
```

添字 `i` を先頭から回し、`f(s[i])` を調べます。条件を満たした要素が見つかれば、その位置で止まります。

### 2. 条件を満たせば位置を返す

```go:line-numbers=110
			return i
```

条件に合う要素が見つかったら、その添字 `i` を返します。

### 3. 見つからなければ -1

```go:line-numbers=113
	return -1
```

最後まで条件を満たす要素が無ければ、`-1` を返します。

## ここがすごい

- **比べ方を選べる**: 値の等しさではなく、任意の条件で探せます。構造体のフィールドなどでも使えます。
- **型の制約が少ない**: `comparable` が要らないので、比べられない型の要素も探せます。
- **最初の一致で止まる**: 必要な分だけ走査するので、無駄がありません。

## まとめ

- 先頭から要素を見て、条件を満たす最初の添字を返す。
- 見つからなければ `-1` を返す。
- 値の比較ではなく、関数の条件で探せるので、型の制約が少ない。
