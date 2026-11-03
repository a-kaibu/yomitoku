---
title: "バイト列の先頭が一致したら、残りを返す cutPrefix"
description: "math/rand/v2 の cutPrefix。バイト列 s が prefix で始まるかを調べる。一致すれば接頭辞を除いた残りと true を、一致しなければ元の s と false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/v2/chacha8.go"
lines: [87, 92]
function: "cutPrefix"
difficulty: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`cutPrefix(s, prefix)` は、バイト列 `s` が `prefix` で始まるかを調べます。始まるなら、接頭辞を取り除いた残りを返します。始まらないなら、元の `s` をそのまま返します。

## コード

```go:line-numbers=87
func cutPrefix(s, prefix []byte) (after []byte, found bool) {
	if len(s) < len(prefix) || string(s[:len(prefix)]) != string(prefix) {
		return s, false
	}
	return s[len(prefix):], true
}
```

## 前提知識

- **接頭辞（prefix）**: 文字列やバイト列の先頭に付いている部分です。
- **スライス**: 配列の一部分を指す、長さが変わる見方です。`s[n:]` で、先頭 n 個を除いた部分を指せます。
- **`string(...)` の比較**: バイト列を文字列に変えて比べると、中身が同じかどうかを簡単に調べられます。

## 何をしているか

### 1. 長さと先頭を確かめる

```go:line-numbers=88
	if len(s) < len(prefix) || string(s[:len(prefix)]) != string(prefix) {
		return s, false
	}
```

`s` が `prefix` より短いか、先頭が `prefix` と違うなら、一致しません。その場合は、元の `s` と `false` を返します。`len(s) < len(prefix)` を先に確かめるので、`s[:len(prefix)]` が範囲外になることはありません。

### 2. 残りを返す

```go:line-numbers=91
	return s[len(prefix):], true
```

一致したら、先頭の `prefix` の部分を除いた残りと、`true` を返します。

## ここがすごい

- **範囲を先に確かめる**: 長さを確かめてから切り出すので、短い入力でもパニックしません。
- **元の値をそのまま返せる**: 一致しないときも `s` を返すので、呼び出し側は、同じ変数で結果を受けられます。

## まとめ

- `cutPrefix` は、先頭が `prefix` と一致するかを調べます。
- 一致したら残りを、一致しなければ元の `s` を返します。
- 長さの確認を先にするので、範囲外の読み出しを避けられます。
