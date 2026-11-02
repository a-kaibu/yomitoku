---
title: "サロゲートペアが何語になるかを判定する utf16.RuneLen"
description: "UTF-16 で 1 文字が何語（16 ビット）になるかを返す utf16.RuneLen。範囲の比較を 3 つだけにまとめ、サロゲートの範囲を飛ばしてから判定している。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/unicode/utf16/utf16.go"
lines: [57, 66]
function: "RuneLen"
difficulty: 2
tags: [Unicode, 型システム]
---

## ひとことで

`utf16.RuneLen(r)` は、文字 `r` を UTF-16 でエンコードしたときに、何個の 16 ビット単位（語）になるかを返します。BMP（基本多言語面）の文字は 1 語、それ以外（絵文字など）は 2 語で、範囲外の値は `-1` です。例えば `'あ'` は 1、`'😀'` は 2 です。

## コード

```go:line-numbers=57
func RuneLen(r rune) int {
	switch {
	case 0 <= r && r < surr1, surr3 <= r && r < surrSelf:
		return 1
	case surrSelf <= r && r <= maxRune:
		return 2
	default:
		return -1
	}
}
```

## 前提知識

- **UTF-16**: 文字を 16 ビット（2 バイト）の単位で表す方式です。Windows の内部や JavaScript の文字列で使われています。
- **BMP（基本多言語面）**: Unicode のうち、最も一般的な文字を収めた範囲です。U+0000 から U+FFFF までで、1 語で表せます。
- **サロゲートペア**: BMP の外の文字を、2 語の組で表す仕組みです。前半は U+D800〜U+DBFF、後半は U+DC00〜U+DFFF の範囲にあります。
- **サロゲートの範囲**: U+D800〜U+DFFF は、文字そのものとしては使えない（単独では意味を持たない）予約された範囲です。
- **`switch` で範囲を比べる**: `case 条件1, 条件2:` と書くと、どちらかが成り立てばその節が実行されます。

## 何をしているか

### 1. 1 語で表せる範囲を判定する

```go:line-numbers=59
	case 0 <= r && r < surr1, surr3 <= r && r < surrSelf:
		return 1
```

`surr1` は U+D800、`surr3` は U+E000、`surrSelf` は U+10000 を表す定数です。`0 <= r && r < surr1` は、サロゲートより前の範囲です。`surr3 <= r && r < surrSelf` は、サロゲートの後から BMP の最後までの範囲です。どちらも 1 語で表せるので、`return 1` です。

2 つの条件を `,` で並べているので、どちらかが成り立てば同じ節に入ります。

### 2. サロゲートペアで 2 語になる範囲

```go:line-numbers=61
	case surrSelf <= r && r <= maxRune:
		return 2
```

U+10000 から U+10FFFF（Unicode の最大値 `maxRune`）までは、サロゲートペアで 2 語になります。絵文字や一部の漢字は、この範囲です。

### 3. それ以外は不正な値

```go:line-numbers=63
	default:
		return -1
```

負の値や、U+10FFFF より大きい値、そしてサロゲートの範囲（U+D800〜U+DFFF）は、文字として表せません。そのため、`-1` を返して不正であることを伝えます。

## ここがすごい

- **定数の名前で意味が分かる**: `surr1` や `surrSelf` のような名前が付いているので、数字の羅列を読まなくても、どの境界かが分かります。
- **条件を 3 つにまとめる**: 1 語、2 語、不正の 3 通りだけなので、`switch` の 3 つの節で全部を網羅しています。
- **サロゲートの範囲を明示的に除く**: 「範囲に入っていないか」を暗黙に信じるのではなく、サロゲートを 1 語にも 2 語にも入れない形で、不正な値を見つけています。

## まとめ

- `RuneLen` は、UTF-16 で 1 文字が何語になるかを返します。
- BMP の文字は 1 語、BMP の外の文字は 2 語です。
- サロゲートの範囲と、範囲外の値は `-1` で不正を示します。
- `switch` の複数条件と、名前の付いた定数で、境界を読みやすく書いています。
