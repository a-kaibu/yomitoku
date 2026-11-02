---
title: "複数の文字表のどれかに含まれるかを判定する unicode.IsOneOf"
description: "unicode.IsOneOf。Unicode の文字の表（RangeTable）を複数受け取り、文字 r がそのどれかに含まれるかを順に調べる。最初に見つかった時点で true を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/unicode/graphic.go"
lines: [59, 66]
function: "IsOneOf"
difficulty: 1
tags: [Unicode, 標準ライブラリ, 設計パターン]
---

## ひとことで

`unicode.IsOneOf(ranges, r)` は、文字 `r` が、渡された複数の `RangeTable` のどれか 1 つに入っているかを判定します。例えば「英字か、ギリシャ文字か、キリル文字か」のように、複数の文字の集まりをまとめて調べられます。

## コード

```go:line-numbers=59
func IsOneOf(ranges []*RangeTable, r rune) bool {
	for _, inside := range ranges {
		if Is(inside, r) {
			return true
		}
	}
	return false
}
```

## 前提知識

- **`unicode.RangeTable`**: 文字の集まりを表す表です。`unicode.Latin` や `unicode.Greek` のように、文字の種類ごとに用意されています。
- **`unicode.Is`**: 1 つの表に、文字 `r` が含まれるかを調べる関数です。
- **スライスで複数の表を渡す**: `[]*RangeTable` の形で、表の一覧を受け取ります。
- **「どれか」の判定**: 1 つでも当てはまれば真になる判定です。論理和（OR）のように振る舞います。

## 何をしているか

### 1. 表を順に調べる

```go:line-numbers=60
	for _, inside := range ranges {
		if Is(inside, r) {
			return true
		}
	}
```

渡された表を先頭から 1 つずつ取り出して、`Is` で `r` が含まれるかを調べます。どれか 1 つで含まれていれば、その時点で `true` を返します。残りの表は調べません。

### 2. どれにも無ければ false

```go:line-numbers=65
	return false
```

すべての表を調べても含まれなければ、`false` を返します。表が 1 つも渡されなければ、ループは回らず、`false` になります。

## ここがすごい

- **早く止まる**: 含まれていると分かった時点で終わるので、表の数が多くても、無駄な探索が少なくなります。
- **表の組み合わせを自由に**: 呼び出し側は、必要な文字の集まりを自由に組み合わせられます。新しい判定の関数を作らずに済みます。
- **空の一覧も安全**: 表が 0 個でも、正しく `false` を返します。特別な場合分けが要りません。

## まとめ

- `IsOneOf` は、文字がいくつかの表のどれかに含まれるかを判定します。
- 表を先頭から順に調べ、見つかった時点で `true` を返します。
- どの表にも含まれなければ、`false` を返します。
- 表の一覧を渡すだけで、文字の集まりを組み合わせて判定できます。
