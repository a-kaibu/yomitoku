---
title: "空白で単語に分ける前に、まず数える。1 回で済ませる確保の工夫"
description: "文字列を空白で区切って単語のスライスにする strings.Fields。最初に単語の数を数えて結果の配列を 1 回で確保し、ASCII かどうかの判定も同時に済ませます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [365, 412]
function: "Fields"
difficulty: 2
tags: [文字列処理, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`strings.Fields("  foo bar  baz ")` は `["foo", "bar", "baz"]` を返します。
連続する空白（スペース、タブ、改行など）を区切りとして、文字列を単語に分ける関数です。

この関数は **2 回の走査** を行います。1 回目で単語の数を数え、2 回目で切り出します。最初に数を知っているので、結果を入れる配列をちょうどの大きさで 1 回だけ確保できます。

## コード

```go:line-numbers=365
func Fields(s string) []string {
	// First count the fields.
	// This is an exact count if s is ASCII, otherwise it is an approximation.
	n := 0
	wasSpace := 1
	// setBits is used to track which bits are set in the bytes of s.
	setBits := uint8(0)
	for i := 0; i < len(s); i++ {
		r := s[i]
		setBits |= r
		isSpace := int(asciiSpace[r])
		n += wasSpace & ^isSpace
		wasSpace = isSpace
	}

	if setBits >= utf8.RuneSelf {
		// Some runes in the input string are not ASCII.
		return FieldsFunc(s, unicode.IsSpace)
	}
	// ASCII fast path
	a := make([]string, n)
	na := 0
	fieldStart := 0
	i := 0
	// Skip spaces in the front of the input.
	for i < len(s) && asciiSpace[s[i]] != 0 {
		i++
	}
	fieldStart = i
	for i < len(s) {
		if asciiSpace[s[i]] == 0 {
			i++
			continue
		}
		a[na] = s[fieldStart:i]
		na++
		i++
		// Skip spaces in between fields.
		for i < len(s) && asciiSpace[s[i]] != 0 {
			i++
		}
		fieldStart = i
	}
	if fieldStart < len(s) { // Last field might end at EOF.
		a[na] = s[fieldStart:]
	}
	return a
}
```

`asciiSpace` は 358 行目で `var asciiSpace = [256]uint8{'\t': 1, '\n': 1, '\v': 1, '\f': 1, '\r': 1, ' ': 1}` と定義されています。空白文字の位置だけ 1、ほかは 0 の表です。

## 前提知識

- **文字列とバイト**: Go の文字列はバイトの並びです。`s[i]` は i 番目の **バイト**（0〜255）を返します。日本語のような ASCII 以外の文字は、UTF-8 という方式で複数バイトに分けて保存されています。
- **`utf8.RuneSelf`**: 値は 128 です。128 未満のバイトは ASCII 文字そのもの、128 以上は複数バイト文字の一部です。
- **スライス**: 可変長の配列のようなものです。`make([]string, n)` で長さ `n` のスライスを作ります。
- **部分文字列 `s[a:b]`**: a バイト目から b バイト目の手前までを取り出します。**コピーは作らず** 元の文字列を共有するので、とても安く作れます。
- **`^`（単項）**: ビットをすべて反転します。`^isSpace` は 0 なら -1（全ビット 1）、1 なら -2 です。

## 何をしているか

### 1. 単語の数を数える（368〜378 行目）

`wasSpace` は「直前の文字が空白だったか」で、最初は 1（空白の後と同じ扱い）です。
376 行目の `n += wasSpace & ^isSpace` は、**「直前が空白」かつ「今が空白でない」** ときだけ 1 を足します。これは単語の始まりの数、つまり単語数です。

`"a bc"` なら、`a`（直前は空白扱い、今は非空白 → +1）、スペース、`b`（+1）、`c`（直前が非空白なので +0）で、`n = 2` です。

`if` を使わずにビット演算で書いているので、ループの中に分岐がありません。

### 2. ASCII だけかを同時に調べる（374, 380〜383 行目）

`setBits |= r` で、全バイトの OR を取っています。どれか 1 つでも 128 以上のバイトがあれば、`setBits` の最上位ビットが立ち、`setBits >= 128` になります。
その場合は、全角スペースなど Unicode の空白も扱える汎用版 `FieldsFunc` に任せます。

### 3. ASCII 専用の速い切り出し（385〜411 行目）

先頭の空白を飛ばし（390 行目）、空白でない間は進み、空白に当たったら `s[fieldStart:i]` を結果に入れます。最後の単語が文字列の終わりで終わる場合は 408 行目で拾います。

## ここがすごい

- **数えてから確保**: 単語を見つけるたびにスライスに追加（`append`）すると、容量が足りなくなるたびに確保とコピーが起きます。先に数えておけば、確保は `make` の 1 回だけです。
- **判定のついで集め**: 1 回目のループで、単語数と「ASCII だけか」を **同時に** 調べています。1 バイトごとに `|=` を 1 回するだけで、別のループは要りません。
- **表引きで空白判定**: `asciiSpace[r]` は配列を 1 回読むだけです。`r == ' ' || r == '\t' || ...` と 6 回比べるより速く、分岐もありません。
- **速い道と正しい道の両立**: よくある ASCII の入力は速い専用ルートで、それ以外は汎用ルートで正しく処理します。

## まとめ

- 結果の個数が先にわかるなら、数えてから 1 回で確保するとメモリ確保が減る。
- 1 回の走査で複数の情報を同時に集めると無駄がない。
- 条件分岐はビット演算や表引きに置き換えられることがある。
- よくある入力のための速い道（ファストパス）と、一般の場合の正しい道を分けて書く。
