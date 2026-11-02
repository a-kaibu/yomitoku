---
title: "後ろから部分文字列を探す strings.LastIndex と 4 つの近道"
description: "文字列の末尾側から部分一致を探す strings.LastIndex。長さ 0、1、同じ長さ、長すぎる場合を先に判定し、必要なときだけローリングハッシュで探す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [83, 99]
function: "LastIndex"
difficulty: 2
tags: [文字列処理, アルゴリズム]
---

## ひとことで

`strings.LastIndex(s, substr)` は、`s` の中で `substr` が最後に現れる位置（バイト単位の添字）を返します。見つからなければ `-1` です。例えば `strings.LastIndex("go gopher", "go")` は `3` です。

この関数の本体は短いですが、先頭の `switch` で「簡単に答えが分かる場合」を先に片づけています。本格的な探索は、その後の 1 行だけです。

## コード

```go:line-numbers=83
func LastIndex(s, substr string) int {
	n := len(substr)
	switch {
	case n == 0:
		return len(s)
	case n == 1:
		return bytealg.LastIndexByteString(s, substr[0])
	case n == len(s):
		if substr == s {
			return 0
		}
		return -1
	case n > len(s):
		return -1
	}
	return bytealg.LastIndexRabinKarp(s, substr)
}
```

## 前提知識

- **部分文字列**: ある文字列の中に含まれる、連続した一部分の文字列です。
- **バイト単位の添字**: Go の文字列は UTF-8 のバイト列です。`LastIndex` の戻り値は、文字数ではなくバイト数で数えた位置です。
- **`switch` 文（式なしの形）**: `switch { case 条件: ... }` の形で、条件を上から順に調べます。最初に成り立ったものだけが実行されます。
- **ローリングハッシュ（Rabin-Karp）**: 文字列の一部分の「ハッシュ値（数に変換したもの）」を、1 文字ずつずらしながら高速に更新して比べる探索法です。

## 何をしているか

### 1. 部分文字列が空なら末尾の位置

```go:line-numbers=84
	n := len(substr)
	switch {
	case n == 0:
		return len(s)
```

空の文字列は、どこにでも含まれると考えます。そのため、最後の位置である `len(s)` を返します。

### 2. 1 バイトなら専用の探索を使う

```go:line-numbers=88
	case n == 1:
		return bytealg.LastIndexByteString(s, substr[0])
```

探すものが 1 バイトだけなら、後ろから 1 バイトずつ比べる単純な方法で十分です。専用の関数が、CPU の命令を活用して速く探します。

### 3. 同じ長さか、長すぎる場合は比べるだけ

```go:line-numbers=90
	case n == len(s):
		if substr == s {
			return 0
		}
		return -1
	case n > len(s):
		return -1
```

`substr` と `s` の長さが同じなら、位置は 0 か見つからないかの 2 通りしかありません。ここでは `==` で比べるだけで答えが出ます。`substr` が `s` より長い場合は、絶対に見つからないので `-1` です。

### 4. それ以外はローリングハッシュで探す

```go:line-numbers=98
	return bytealg.LastIndexRabinKarp(s, substr)
```

ここまで来ると、`substr` は `s` より短く、2 バイト以上あります。そこで、ローリングハッシュを使った `LastIndexRabinKarp` に任せます。1 文字ずつずらしながらハッシュ値を比べるので、長い文字列でも比較の回数が抑えられます。

## ここがすごい

- **よくある場合を先に返す**: 空の検索、1 バイトの検索、長すぎる検索は、実際によく使われます。それぞれ専用の答えを返すことで、本格的な探索を避けています。
- **分けるほど速くなる**: 1 バイト用の探索は、ハッシュの計算より安く済みます。場合分けで、それぞれに一番合った方法を選んでいます。
- **同じ `switch` で読みやすい**: 条件が上から順に並んでいるので、どの場合に何が起きるかを上から読めます。

## まとめ

- `LastIndex` は、空・1 バイト・同じ長さ・長すぎる、の 4 つを先に判定します。
- 1 バイトの場合は専用の探索を使い、本格的な探索はローリングハッシュに任せます。
- 戻り値は文字数ではなく、UTF-8 のバイト位置です。
- 見つからなければ `-1` を返します。
