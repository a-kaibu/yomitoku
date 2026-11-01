---
title: "文字列を 1 文字ずつに分ける strings.explode"
description: "strings.explode は、文字列を rune の単位で n 個に分けます。文字数を先に数えて、残りは最後の 1 個にまとめるので、分割の数が文字数を超えることはありません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [23, 38]
function: "explode"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.explode("あいう", -1)` は、`あ` と `い` と `う` の 3 つに分けます。`strings.Split` で区切り文字が空のときに、この関数が使われます。

## コード

```go:line-numbers=23
func explode(s string, n int) []string {
	l := utf8.RuneCountInString(s)
	if n < 0 || n > l {
		n = l
	}
	a := make([]string, n)
	for i := 0; i < n-1; i++ {
		_, size := utf8.DecodeRuneInString(s)
		a[i] = s[:size]
		s = s[size:]
	}
	if n > 0 {
		a[n-1] = s
	}
	return a
}
```

## 前提知識

- **文字数と `len`**: `len(s)` はバイト数です。文字の数は `utf8.RuneCountInString` で数えます。
- **`utf8.DecodeRuneInString`**: 先頭の 1 文字と、そのバイト数を返します。
- **スライス式 `s[:size]`**: 文字列の先頭から `size` バイトを、コピーせずに切り出します。
- **負の `n`**: 「すべて」を意味します。この関数では、文字数を上限として扱います。

## 何をしているか

### 1. 分割の数を決める

```go:line-numbers=24
	l := utf8.RuneCountInString(s)
	if n < 0 || n > l {
		n = l
	}
```

まず、文字数 `l` を数えます。`n` が負か、文字数より大きいときは、`n` を `l` に合わせます。これで、用意する要素が多すぎることはありません。

### 2. 先頭から切り出す

```go:line-numbers=28
	a := make([]string, n)
	for i := 0; i < n-1; i++ {
		_, size := utf8.DecodeRuneInString(s)
		a[i] = s[:size]
		s = s[size:]
	}
```

`n-1` 個までは、先頭の 1 文字を `s[:size]` で切り出して、`a[i]` に入れます。切り出したら、`s = s[size:]` で残りを進めます。

### 3. 残りを最後の要素にまとめる

```go:line-numbers=34
	if n > 0 {
		a[n-1] = s
	}
	return a
```

最後の要素には、残りの文字列をそのまま入れます。`n` 個目の要素は、残りすべてになるので、切り捨てられた文字はありません。`n` が 0 のときは、何も入れず空のスライスを返します。

## ここがすごい

- **文字の境界を必ず守る**: 切り出しは `DecodeRuneInString` のバイト数に従うので、日本語などの途中で切れることがありません。
- **大きすぎる `n` を安全に扱う**: 文字数で上限を決めているので、要素が足りないまま配列を確保することがありません。
- **残りを最後にまとめる**: 「最後だけ残り全部」にすると、分割の数と配列の長さが一致し、ループの終わりを簡単に書けます。

## まとめ

- 文字数を数えて、分割の数を文字数以下に抑える。
- 1 文字ずつ `DecodeRuneInString` で切り出し、残りを進める。
- 最後の要素に残り全部を入れるので、文字は取りこぼさない。
