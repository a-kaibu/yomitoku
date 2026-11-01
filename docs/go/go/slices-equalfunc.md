---
title: "要素の型が違っても比べられる slices.EqualFunc"
description: "slices.EqualFunc は、2 つのスライスの長さが同じで、各要素の組を比べる関数が true を返すなら等しいとみなします。要素の型が違っても、比べ方を関数で渡せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [37, 48]
function: "EqualFunc"
difficulty: 2
format: 2
tags: [ジェネリクス, 型システム, 標準ライブラリ]
---

## ひとことで

`slices.EqualFunc(names, lengths, func(n string, l int) bool { return len(n) == l })` は、名前の長さと数値が一致するかを判定します。型が違うスライスどうしでも、比べ方を決めれば比べられます。

## コード

```go:line-numbers=37
func EqualFunc[S1 ~[]E1, S2 ~[]E2, E1, E2 any](s1 S1, s2 S2, eq func(E1, E2) bool) bool {
	if len(s1) != len(s2) {
		return false
	}
	for i, v1 := range s1 {
		v2 := s2[i]
		if !eq(v1, v2) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **型パラメータが 2 組**: `S1` と `E1`、`S2` と `E2` で、それぞれのスライスと要素の型を別々に指定できます。
- **`eq` 関数**: 2 つの要素を受け取り、等しいかを `bool` で返す関数です。
- **`Equal` との違い**: `Equal` は、同じ型の要素を `==` で比べます。`EqualFunc` は、比べ方を呼び出し側が決めます。
- **長さが違えば不等**: 長さを先に比べるので、長さが違えば比べ直す必要がありません。

## 何をしているか

### 1. 長さを先に比べる

```go:line-numbers=38
	if len(s1) != len(s2) {
		return false
	}
```

長さが違えば、等しいはずがありません。そのまま `false` を返して、中身の比較を省きます。

### 2. 対応する要素を順に比べる

```go:line-numbers=41
	for i, v1 := range s1 {
		v2 := s2[i]
		if !eq(v1, v2) {
			return false
		}
	}
```

`s1` の要素を先頭から取り出し、同じ添字の `s2` の要素と、`eq` で比べます。どれか 1 組でも等しくなければ、すぐに `false` を返します。

### 3. すべて等しければ true

```go:line-numbers=47
	return true
```

すべての組が等しかったら、`true` を返します。

## ここがすごい

- **型の違いを越えて比べる**: 比べ方を関数に任せるので、型の変換をしなくても比べられます。
- **早く終わる**: 長さの確認と、最初の不一致で止まる作りなので、無駄な比較が少なくなります。
- **比べ方の自由度**: 大文字小文字を無視する、誤差を許すなど、用途に合わせた比べ方を書けます。

## まとめ

- 長さが違えば、すぐに不等とする。
- 対応する要素を、渡された関数で順に比べる。
- 型が違っても、比べ方を決めれば比べられる。
