---
title: "長さを先に数えて 1 回で確保する strings.Join"
description: "文字列の配列を区切り文字でつなぐ strings.Join。最終的な長さを先に計算して、strings.Builder の領域を 1 回だけ確保する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [468, 498]
function: "Join"
difficulty: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.Join(elems, sep)` は、文字列のスライス `elems` を区切り文字 `sep` でつないで、1 つの文字列にして返します。例えば `strings.Join([]string{"a", "b", "c"}, ", ")` は `"a, b, c"` です。

文字列は Go では変更できないので、つなぐたびに新しい文字列を作ると、途中の文字列が大量に作られてしまいます。この関数は **最後の長さを先に計算してから、1 回だけ領域を確保して書き込む** という方法を取っています。

## コード

```go:line-numbers=468
func Join(elems []string, sep string) string {
	switch len(elems) {
	case 0:
		return ""
	case 1:
		return elems[0]
	}

	var n int
	if len(sep) > 0 {
		if len(sep) >= maxInt/(len(elems)-1) {
			panic("strings: Join output length overflow")
		}
		n += len(sep) * (len(elems) - 1)
	}
	for _, elem := range elems {
		if len(elem) > maxInt-n {
			panic("strings: Join output length overflow")
		}
		n += len(elem)
	}

	var b Builder
	b.Grow(n)
	b.WriteString(elems[0])
	for _, s := range elems[1:] {
		b.WriteString(sep)
		b.WriteString(s)
	}
	return b.String()
}
```

## 前提知識

- **文字列の不変性**: Go の `string` は作ったあと書き換えられません。文字列を連結すると、新しい文字列の領域が作られます。
- **`strings.Builder`**: 文字列を少しずつ書き足すための型です。内部でバイト列を持ち、最後に `String()` で文字列にします。
- **`Grow(n)`**: あらかじめ `n` バイト分の領域を確保しておく操作です。ここに書き足すとき、途中でメモリを取り直さなくて済みます。
- **`maxInt`**: `int` で表せる最大の値です。長さの計算が溢れていないかを確かめるために使われます。
- **`panic`**: 回復できないエラーで、プログラムを止める命令です。ここでは「出力が大きすぎて表せない」場合に使われます。

## 何をしているか

### 1. 要素が 0 個か 1 個のときは計算しない

```go:line-numbers=469
	switch len(elems) {
	case 0:
		return ""
	case 1:
		return elems[0]
	}
```

要素がないなら空文字列、1 個だけなら区切り文字は不要なので、その要素をそのまま返します。ここで早く抜けるのは、後の計算が「区切りが 1 個以上ある」前提で書かれているからです。

### 2. 最終的な長さを先に計算する

```go:line-numbers=476
	var n int
	if len(sep) > 0 {
		if len(sep) >= maxInt/(len(elems)-1) {
			panic("strings: Join output length overflow")
		}
		n += len(sep) * (len(elems) - 1)
	}
	for _, elem := range elems {
		if len(elem) > maxInt-n {
			panic("strings: Join output length overflow")
		}
		n += len(elem)
	}
```

区切り文字は要素の間に `要素数 - 1` 回入ります。そこで `len(sep) * (len(elems) - 1)` を足します。そのあと、各要素の長さを足していきます。

`maxInt` との比較は、結果が `int` に収まらなくなる（溢れる）場合を防ぐためです。掛け算の前に `maxInt/(len(elems)-1)` と比べているのは、掛け算そのものが溢れないようにするためです。

### 3. 1 回だけ確保して書き込む

```go:line-numbers=490
	var b Builder
	b.Grow(n)
	b.WriteString(elems[0])
	for _, s := range elems[1:] {
		b.WriteString(sep)
		b.WriteString(s)
	}
	return b.String()
```

`Grow(n)` で、必要な長さ `n` の領域を一度に確保します。そのあと、先頭の要素を書き、残りは「区切り、要素」の順に書き足していきます。途中で領域を取り直すことがないので、無駄なコピーが起きません。

`String()` は、内部のバイト列を文字列として返します。このとき追加のコピーが起きないように作られています。

## ここがすごい

- **先に長さを計算する**: 文字列の連結を素朴に繰り返すと、要素数だけ新しい文字列を作ってコピーすることになります。長さを先に求めておけば、確保は 1 回で済みます。
- **溢れを防ぐ順番**: 掛け算の前に割り算で上限と比べるのは、大量のデータに対して結果の長さを正しく扱うための防御策です。
- **`Builder` の再利用**: 内部でも `strings.Builder` を使っているので、標準ライブラリ全体で同じ仕組みを共有しています。

## まとめ

- 文字列は変更できないので、連結のたびに新しい領域ができるのが普通です。
- 最終的な長さを先に計算すると、領域の確保を 1 回に減らせます。
- 長さの計算では、`int` の溢れを防ぐために上限と比べています。
- 要素が 0 個と 1 個の場合は、特別扱いで早く返します。
