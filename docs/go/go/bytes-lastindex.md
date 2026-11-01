---
title: "後ろから部分列を探す bytes.LastIndex"
description: "bytes.LastIndex は、バイト列の中で部分列が最後に現れる位置を返します。区切りの長さで場合分けし、長さが 1 のときは専用の探索、それ以外はローリングハッシュを使います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [104, 120]
function: "LastIndex"
difficulty: 3
format: 2
tags: [文字列処理, ハッシュ, 最適化, 標準ライブラリ]
---

## ひとことで

`bytes.LastIndex([]byte("a/b/c"), []byte("/"))` は `3` を返します。部分列が最後に出てくる位置です。見つからなければ `-1` を返します。

## コード

```go:line-numbers=104
func LastIndex(s, sep []byte) int {
	n := len(sep)
	switch {
	case n == 0:
		return len(s)
	case n == 1:
		return bytealg.LastIndexByte(s, sep[0])
	case n == len(s):
		if Equal(s, sep) {
			return 0
		}
		return -1
	case n > len(s):
		return -1
	}
	return bytealg.LastIndexRabinKarp(s, sep)
}
```

## 前提知識

- **部分列の探索**: 長いバイト列の中から、短い並びを探す処理です。前から探す方法と、後ろから探す方法があります。
- **ローリングハッシュ**: 窓をずらしながら、ハッシュ値を少しの計算で更新する方法です。Rabin-Karp 法がこの仕組みを使います。
- **空の区切り**: 空の並びは、どこにでも見つかるとみなします。そのため、長さの最大位置を返します。
- **`bytealg`**: 標準ライブラリの内部で、バイト列の探索を速くする補助パッケージです。

## 何をしているか

### 1. 空の区切りを扱う

```go:line-numbers=105
	n := len(sep)
	switch {
	case n == 0:
		return len(s)
```

区切りの長さが 0 なら、どこにでもあるとみなします。最後の位置、つまり `len(s)` を返します。

### 2. 1 バイトの区切りは専用の探索

```go:line-numbers=109
	case n == 1:
		return bytealg.LastIndexByte(s, sep[0])
```

区切りが 1 バイトなら、`bytealg.LastIndexByte` で後ろから 1 バイトを探します。比べるだけの処理なので、最も単純で速い方法です。

### 3. 区切りが長すぎる、または同じ長さの場合

```go:line-numbers=111
	case n == len(s):
		if Equal(s, sep) {
			return 0
		}
		return -1
	case n > len(s):
		return -1
	}
```

区切りが `s` と同じ長さなら、中身が等しいかだけを比べます。区切りの方が長ければ、見つかるはずがないので `-1` を返します。

### 4. それ以外はローリングハッシュで探す

```go:line-numbers=119
	return bytealg.LastIndexRabinKarp(s, sep)
```

それ以外の場合は、`bytealg.LastIndexRabinKarp` に任せます。窓のハッシュを比べて候補を絞り、一致を後ろから確かめるので、長い区切りでも速く動きます。

## ここがすごい

- **場合ごとに道を変える**: 単純な場合は単純な方法で処理し、一般の場合だけ複雑な方法を使います。
- **ハッシュで候補を絞る**: 全位置で中身を比べるのを避け、ハッシュの一致だけを詳しく確かめます。
- **境界の場合を先に返す**: 空や長すぎる区切りを、探索の前に処理するので、探索の中で配列の範囲外を見ることがありません。

## まとめ

- 区切りの長さで、専用の探索とローリングハッシュを使い分ける。
- 空の区切りは末尾、長すぎる区切りは `-1` と先に決める。
- 一般の場合は、ハッシュで候補を絞ってから、中身を確かめる。
