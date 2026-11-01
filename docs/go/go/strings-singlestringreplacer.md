---
title: "1 つの文字列だけを置き換える singleStringReplacer"
description: "strings.singleStringReplacer は、置き換える文字列が 1 つだけのときに使われる置換器です。一致した位置を探して、結果を Builder に順に書き足していきます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/replace.go"
lines: [389, 408]
function: "Replace"
difficulty: 2
format: 2
tags: [文字列処理, パース, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.NewReplacer("a", "b")` のように、置き換えるものが 1 種類だけのときは、この専用の置換器が使われます。一致する場所をすべて探して、置き換えた文字列を組み立てます。

## コード

```go:line-numbers=389
func (r *singleStringReplacer) Replace(s string) string {
	var buf Builder
	i, matched := 0, false
	for {
		match := r.finder.next(s[i:])
		if match == -1 {
			break
		}
		matched = true
		buf.Grow(match + len(r.value))
		buf.WriteString(s[i : i+match])
		buf.WriteString(r.value)
		i += match + len(r.finder.pattern)
	}
	if !matched {
		return s
	}
	buf.WriteString(s[i:])
	return buf.String()
}
```

## 前提知識

- **`strings.Replacer`**: 複数の置き換えをまとめて行う型です。組み合わせに応じて、いくつかの実装を使い分けます。
- **`stringFinder`**: 文字列の中から、特定の文字列を探す仕組みです。Boyer-Moore 法という、ずらして比べる方法を使います。
- **`strings.Builder`**: 文字列を少しずつ書き足して、最後に 1 つの文字列にします。コピーを減らせます。
- **一致しなかったときの扱い**: 1 つも一致しなければ、元の文字列をそのまま返します。

## 何をしているか

### 1. 作業用の変数を用意する

```go:line-numbers=390
	var buf Builder
	i, matched := 0, false
```

`buf` は結果を組み立てるための `Builder` です。`i` は、今どこまで読んだかを表す位置で、`matched` は 1 回でも一致したかを覚えます。

### 2. 次の一致を探して置き換える

```go:line-numbers=392
	for {
		match := r.finder.next(s[i:])
		if match == -1 {
			break
		}
		matched = true
		buf.Grow(match + len(r.value))
		buf.WriteString(s[i : i+match])
		buf.WriteString(r.value)
		i += match + len(r.finder.pattern)
	}
```

`r.finder.next(s[i:])` で、残りの文字列の中から次の一致位置を探します。見つからなければ止まります。見つかったら、一致の前の部分と、置き換える文字列を書き足します。`i` を一致の終わりまで進めて、続きを探します。

### 3. 結果を組み立てて返す

```go:line-numbers=403
	if !matched {
		return s
	}
	buf.WriteString(s[i:])
	return buf.String()
```

1 つも一致しなかったなら、元の `s` をそのまま返します。一致したなら、最後に残った部分を書き足して、結果の文字列を返します。

## ここがすごい

- **一致が無ければコピーしない**: 置き換えが起きない場合は、新しい文字列を作らず元の文字列を返します。
- **書き足しで無駄を減らす**: 結果を `Builder` に少しずつ書くので、文字列を何度も作り直しません。`Grow` で事前に大きさを用意することもできます。
- **探す仕事を専用の部品に任せる**: 一致位置の探索は `stringFinder` が担当します。この関数は、探索結果を組み立てることに集中しています。

## まとめ

- 一致位置を次々に探し、一致の前の部分と置き換える文字列を書き足していく。
- 一致が無ければ、元の文字列をそのまま返す。
- 探索は専用の部品に任せ、この関数は組み立てに集中する。
