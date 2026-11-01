---
title: "ASCII 以外の rune を UTF-8 にして追加する appendRuneNonASCII"
description: "utf8.appendRuneNonASCII は、ASCII 以外の rune を 2 から 4 バイトの UTF-8 にして、スライスの末尾へ追加します。値の範囲ごとに、先頭のバイトの印と、続きの下位ビットを組み立てます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [418, 430]
function: "appendRuneNonASCII"
difficulty: 3
format: 2
tags: [Unicode, ビット演算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`utf8.AppendRune` は、ASCII の文字は 1 バイトで書きます。それ以外の文字は、この関数が担当します。`あ`（0x3042）なら、先頭の印と続きの 2 バイトを組み立てて 3 バイトにします。

## コード

::: code-group

```go:line-numbers=418 [日本語訳]
func appendRuneNonASCII(p []byte, r rune) []byte {
	// 負の値は誤りなので、uint32 にして扱えないようにする。
	switch i := uint32(r); {
	case i <= rune2Max:
		return append(p, t2|byte(r>>6), tx|byte(r)&maskx)
	case i < surrogateMin, surrogateMax < i && i <= rune3Max:
		return append(p, t3|byte(r>>12), tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
	case i > rune3Max && i <= MaxRune:
		return append(p, t4|byte(r>>18), tx|byte(r>>12)&maskx, tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
	default:
		return append(p, runeErrorByte0, runeErrorByte1, runeErrorByte2)
	}
}
```

```go:line-numbers=418 [原文]
func appendRuneNonASCII(p []byte, r rune) []byte {
	// Negative values are erroneous. Making it unsigned addresses the problem.
	switch i := uint32(r); {
	case i <= rune2Max:
		return append(p, t2|byte(r>>6), tx|byte(r)&maskx)
	case i < surrogateMin, surrogateMax < i && i <= rune3Max:
		return append(p, t3|byte(r>>12), tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
	case i > rune3Max && i <= MaxRune:
		return append(p, t4|byte(r>>18), tx|byte(r>>12)&maskx, tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
	default:
		return append(p, runeErrorByte0, runeErrorByte1, runeErrorByte2)
	}
}
```

:::

## 前提知識

- **UTF-8 の形**: 2 バイトの文字は `110xxxxx 10xxxxxx`、3 バイトは `1110xxxx 10xxxxxx 10xxxxxx` のように、先頭の印と続きの印を持ちます。
- **ビットずらし `r>>6`**: 値を右へ 6 ビットずらすと、上位のビットが下の位置に来ます。`byte(...)` で下位 8 ビットだけを取り出します。
- **`maskx`**: 続きのバイトから、下位 6 ビットだけを取り出すためのマスクです。
- **`uint32` への変換**: 負の値が、大きな正の数として扱われるようにします。

## 何をしているか

### 1. 2 バイトの文字を組み立てる

```go:line-numbers=420
	switch i := uint32(r); {
	case i <= rune2Max:
		return append(p, t2|byte(r>>6), tx|byte(r)&maskx)
```

値が `rune2Max` 以下なら、2 バイトです。先頭のバイトには、上位のビットを入れて、印の `t2` を付けます。続きのバイトには、下位の 6 ビットを入れて、印の `tx` を付けます。

### 2. 3 バイトと 4 バイトの文字を組み立てる

```go:line-numbers=423
	case i < surrogateMin, surrogateMax < i && i <= rune3Max:
		return append(p, t3|byte(r>>12), tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
	case i > rune3Max && i <= MaxRune:
		return append(p, t4|byte(r>>18), tx|byte(r>>12)&maskx, tx|byte(r>>6)&maskx, tx|byte(r)&maskx)
```

3 バイトの場合は、先頭に上位 4 ビットを入れます。サロゲートの範囲は文字として使えないので、この条件から外しています。4 バイトの場合も同じ考え方で、上位 3 ビットを先頭に入れます。

### 3. 範囲の外は代替の文字にする

```go:line-numbers=427
	default:
		return append(p, runeErrorByte0, runeErrorByte1, runeErrorByte2)
```

どの範囲にも入らない値は、置き換え文字（U+FFFD）の 3 バイトを追加します。これで、壊れた値を入れても、出力は必ず正しい UTF-8 になります。

## ここがすごい

- **範囲ごとに組み立てを分ける**: 2、3、4 バイトのそれぞれに、決まった先頭の印があります。範囲で場合分けすれば、ビットを正しく並べられます。
- **負の値を正直に扱う**: `uint32` に変換すると、負の値は大きな数になるので、範囲の判定から外れます。そのため、特別な分岐を増やさずに済みます。
- **壊れた値を出力しない**: 無効な値は置き換え文字になるので、後の処理が壊れた UTF-8 を読むことがありません。

## まとめ

- 値の範囲ごとに、先頭の印と続きの印を付けて、ビットを並べる。
- サロゲートや範囲外の値は、置き換え文字にする。
- 負の値は `uint32` にして、範囲の判定から外す。
