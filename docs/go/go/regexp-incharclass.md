---
title: "文字の範囲の並びに文字が含まれるかを二分探索で調べる inCharClass"
description: "正規表現の文字クラスの判定 inCharClass。範囲の組（下限と上限）が昇順に並んだ配列から、sort.Find で 2 分探索し、文字 r がどれかの範囲に入るかを求める。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [1964, 1976]
function: "inCharClass"
difficulty: 2
tags: [正規表現, アルゴリズム, 探索]
---

## ひとことで

`[a-zA-Z0-9]` のような文字クラスは、内部では範囲の組の並びとして保存されています。`inCharClass(r, class)` は、文字 `r` がその中のどれかの範囲に入るかを判定します。範囲は昇順に並んでいるので、二分探索で素早く調べられます。

## コード

```go:line-numbers=1964
func inCharClass(r rune, class []rune) bool {
	_, ok := sort.Find(len(class)/2, func(i int) int {
		lo, hi := class[2*i], class[2*i+1]
		if r > hi {
			return +1
		}
		if r < lo {
			return -1
		}
		return 0
	})
	return ok
}
```

## 前提知識

- **範囲の組**: `[lo, hi]` の 2 つの値の組で、その間の文字をすべて含みます。`class` は、この組を `lo, hi, lo, hi, ...` と平らに並べた配列です。
- **`sort.Find`**: 並んだ要素から、比較の関数 `cmp` が 0 を返す位置を探す関数です。見つかったかどうかを、2 番目の値で返します。
- **比較の返り値の意味**: `cmp(i)` が `+1` なら「探す値は、i より後ろにある」、`-1` なら「前にある」、`0` なら「一致」です。
- **`len(class)/2`**: 範囲の組の数です。

## 何をしているか

### 1. 範囲の組ごとに比べる関数を作る

```go:line-numbers=1966
		lo, hi := class[2*i], class[2*i+1]
		if r > hi {
			return +1
		}
		if r < lo {
			return -1
		}
		return 0
```

`i` 番目の範囲 `[lo, hi]` を取り出します。`r` が `hi` より大きければ、この範囲より後ろを探すべきなので `+1`。`r` が `lo` より小さければ、前を探すべきなので `-1`。範囲の中なら `0` を返して、一致を知らせます。

### 2. 二分探索で範囲を探す

```go:line-numbers=1965
	_, ok := sort.Find(len(class)/2, func(i int) int {
```

`sort.Find` に組の数と比較関数を渡すと、範囲の中に `r` があるかを二分探索します。戻り値の `ok` が、見つかったかどうかです。

### 3. 結果を返す

```go:line-numbers=1975
	return ok
```

見つかったときだけ `true` を返します。

## ここがすごい

- **範囲どうしは重ならない**: 文字クラスの範囲は、昇順に並んで重ならないように作られています。だから、大小だけで左右を決める二分探索が正しく働きます。
- **比較の関数で探索を表す**: `sort.Find` に比べる関数だけを渡すので、範囲の形を知らない探索の仕組みを、そのまま使えます。
- **長さは組の数で扱う**: 配列の要素数ではなく、組の数で探索するので、`lo` と `hi` の添字の計算を、比較関数の中に閉じ込められます。

## まとめ

- `inCharClass` は、文字 `r` が文字クラスの範囲のどれかに入るかを調べます。
- 範囲は昇順で重ならないので、二分探索が使えます。
- 比較関数は、`r` が範囲より大きい、小さい、中にある、の 3 通りを返します。
- 見つかれば `true` を返します。
