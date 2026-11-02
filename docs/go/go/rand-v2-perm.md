---
title: "0 から n-1 の順列をランダムに作る rand.Perm。シャッフルを使って並べ替える"
description: "math/rand/v2 の Rand.Perm。0 から n-1 までの整数を入れた配列を作り、Shuffle で並び替えてランダムな順列を返す。配列を先に作り、ランダムに並べ替えるという 2 段階で組み立てている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/v2/rand.go"
lines: [234, 241]
function: "Perm"
difficulty: 1
tags: [乱数, イディオム, アルゴリズム]
---

## ひとことで

`r.Perm(n)` は、0 から `n-1` までの整数を、ランダムな順番に並べたスライスを返します。例えば `Perm(4)` は `[2, 0, 3, 1]` のような並びです。

同じ数が 2 回出ることはなく、すべての並びが同じ確率で現れるように作られています。くじ引きの順番や、データの並びを混ぜるときに役立ちます。

## コード

```go:line-numbers=234
func (r *Rand) Perm(n int) []int {
	p := make([]int, n)
	for i := range p {
		p[i] = i
	}
	r.Shuffle(len(p), func(i, j int) { p[i], p[j] = p[j], p[i] })
	return p
}
```

## 前提知識

- **順列（permutation）**: 同じ要素を一度ずつ使って並べた並びです。0 から `n-1` を並べ替えたものが、ここで作られる順列です。
- **`Shuffle`**: 配列の要素を、ランダムな順番に並べ替える関数です。`Shuffle(n, swap)` の形で、`swap` 関数を受け取ります。
- **クロージャ**: 関数の中で、外側の変数 `p` を使う無名関数です。ここでは、`Shuffle` が配列を並べ替えるための入れ替え処理として使われます。
- **`make([]int, n)`**: 長さ `n` の `int` のスライスを作る組み込み関数です。

## 何をしているか

### 1. 0 から n-1 を順に入れる

```go:line-numbers=235
	p := make([]int, n)
	for i := range p {
		p[i] = i
	}
```

長さ `n` の配列を作り、先頭から順に `0`、`1`、`2` … と値を入れます。この時点では、まだ並びは整っています。

### 2. ランダムに並べ替える

```go:line-numbers=239
	r.Shuffle(len(p), func(i, j int) { p[i], p[j] = p[j], p[i] })
```

`Shuffle` に、配列の長さと、2 つの位置を入れ替える関数を渡します。`Shuffle` は、この入れ替え関数を使って、配列の並びをランダムにします。配列の中身の入れ替えは、ここで渡したクロージャが行います。

### 3. 並べた配列を返す

```go:line-numbers=240
	return p
```

並べ替えが終わった配列を返します。値は 0 から `n-1` の全部を含み、重複はありません。

## ここがすごい

- **2 段階で組み立てる**: まず並びを作り、次にそれを混ぜるという、単純な 2 段階です。どちらも小さな処理なので、理解しやすくなっています。
- **入れ替えを外から渡す**: 並べ替えの仕組みは `Shuffle` に任せ、`Perm` は「どう入れ替えるか」だけを渡します。役割がはっきり分かれています。
- **一様な確率**: `Shuffle` は、すべての並びが同じ確率で出るように設計されています。偏りのない順列を、簡単に作れます。

## まとめ

- `Perm` は、0 から `n-1` を並べたランダムな順列を返します。
- 配列を作って、`Shuffle` で並べ替える、という 2 段階で作ります。
- 入れ替えの処理を、クロージャとして `Shuffle` に渡します。
