---
title: "256 要素の表 1 つで UTF-8 の先頭バイトを分類する"
description: "UTF-8 を 1 文字ぶん解読する decodeRuneSlow。先頭バイトから「何バイトの文字か」と「2 バイト目に許される範囲」を表引き 1 回で求め、不正なバイト列も分岐を減らして処理します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [171, 209]
function: "decodeRuneSlow"
difficulty: 3
tags: [Unicode, パース, ビット演算, 最適化, 標準ライブラリ]
---

## ひとことで

`decodeRuneSlow` は、`utf8.DecodeRune` の「遅い道」で、ASCII 以外の文字を含む UTF-8 のバイト列から **先頭の 1 文字を正しく取り出す** 関数です。
不正なバイト列なら `(RuneError, 1)`（置換文字 U+FFFD と 1 バイト）を返します。

中心にあるのは `first` という **256 要素の表** です。先頭バイトの値で表を引くだけで、「この文字は何バイトか」と「2 バイト目に許される値の範囲」が一度にわかります。

## コード

```go:line-numbers=171
func decodeRuneSlow(p []byte) (r rune, size int) {
	n := len(p)
	if n < 1 {
		return RuneError, 0
	}
	p0 := p[0]
	x := first[p0]
	if x >= as {
		// The following code simulates an additional check for x == xx and
		// handling the ASCII and invalid cases accordingly. This mask-and-or
		// approach prevents an additional branch.
		mask := rune(x) << 31 >> 31 // Create 0x0000 or 0xFFFF.
		return rune(p[0])&^mask | RuneError&mask, 1
	}
	sz := int(x & 7)
	accept := acceptRanges[x>>4]
	if n < sz {
		return RuneError, 1
	}
	b1 := p[1]
	if b1 < accept.lo || accept.hi < b1 {
		return RuneError, 1
	}
	if sz <= 2 { // <= instead of == to help the compiler eliminate some bounds checks
		return rune(p0&mask2)<<6 | rune(b1&maskx), 2
	}
	b2 := p[2]
	if b2 < locb || hicb < b2 {
		return RuneError, 1
	}
	if sz <= 3 {
		return rune(p0&mask3)<<12 | rune(b1&maskx)<<6 | rune(b2&maskx), 3
	}
	b3 := p[3]
	if b3 < locb || hicb < b3 {
		return RuneError, 1
	}
	return rune(p0&mask4)<<18 | rune(b1&maskx)<<12 | rune(b2&maskx)<<6 | rune(b3&maskx), 4
}
```

表の値は 53〜61 行目の定数で、たとえば `s2 = 0x13` は「上位 4 ビット = 許容範囲の番号 1、下位 4 ビット = 長さ 3」を意味します。許容範囲は 100〜106 行目の `acceptRanges` に入っています。

## 前提知識

- **UTF-8 の形**: 1 バイト文字は `0xxxxxxx`、2 バイト文字は `110xxxxx 10xxxxxx`、3 バイトは `1110xxxx 10xxxxxx 10xxxxxx`、4 バイトは `11110xxx` で始まります。2 バイト目以降はすべて `10xxxxxx`（0x80〜0xBF、コード中の `locb`〜`hicb`）です。
- **不正な UTF-8**: 同じ文字を必要以上に長いバイト数で表したもの（冗長表現）や、サロゲート（U+D800〜U+DFFF、UTF-16 専用の値）を表したものは不正です。これらは 2 バイト目の範囲を狭めることで弾けます。
- **`x & 7`、`x >> 4`**: 下位 3 ビットと上位 4 ビットを取り出しています。
- **`&^`**: Go の AND NOT 演算子です。`a &^ b` は「`b` が 1 の桁を 0 にした `a`」です。
- **`<< 31 >> 31`**: 符号付き整数を左に 31、右に 31 ずらすと、最下位ビットが全ビットにコピーされます（算術右シフト）。

## 何をしているか

「あ」（U+3042、UTF-8 では `E3 81 82`）で追います。

### 1. 表を引く（176〜177 行目）

`first[0xE3]` は `s3 = 0x03` です。長さは `0x03 & 7 = 3`、許容範囲は `acceptRanges[0]` = `{0x80, 0xBF}` です（185〜186 行目）。

### 2. 長さと 2 バイト目を確認（187〜193 行目）

3 バイトあるので OK。2 バイト目 `0x81` は 0x80〜0xBF の範囲内なので OK。

### 3. 3 バイト目を確認して組み立て（197〜202 行目）

3 バイト目 `0x82` も範囲内。各バイトから印（`1110` や `10`）を除いた中身をつなげます。

```
(0xE3 & 0x0F) << 12 | (0x81 & 0x3F) << 6 | (0x82 & 0x3F)
= 0x3 << 12 | 0x01 << 6 | 0x02 = 0x3042
```

`('あ', 3)` が返ります。

### ASCII と不正な先頭バイト（178〜184 行目）

表の値が `as`（0xF0、ASCII）か `xx`（0xF1、不正）なら 1 バイトの処理です。ここでは `if` を使わず、`x` の最下位ビット（`as` は 0、`xx` は 1）から **全部 0 か全部 1 のマスク** を作ります。ASCII ならバイトそのもの、不正なら `RuneError` が、マスクとの演算だけで選ばれます。

## ここがすごい

- **1 回の表引きで 2 つの情報**: 1 バイトの表の値に「長さ」と「許容範囲の番号」を詰め込んでいます。たとえば `E0` で始まる 3 バイト文字は 2 バイト目が `A0` 以上でないと冗長表現になり、`ED` で始まるとサロゲートを避けるため `9F` 以下でなければなりません。こうした例外を、すべて「2 バイト目の範囲」という 1 つの仕組みで処理しています。
- **分岐をマスクで置き換え**: 182〜183 行目は、ASCII か不正かで分岐する代わりに、ビット演算で答えを選んでいます。分岐予測の外れを減らす小技です。
- **境界チェックを減らす工夫**: 194 行目のコメントにある通り、`sz == 2` ではなく `sz <= 2` と書くことで、コンパイラが後の `p[2]` などの範囲チェックを省きやすくしています。

## まとめ

- UTF-8 の先頭バイトを表で分類すると、文字の長さと検証ルールが一度にわかる。
- 冗長表現やサロゲートの禁止は「2 バイト目の許容範囲」で統一的に扱える。
- `<< 31 >> 31` で全 0 か全 1 のマスクを作れば、if を使わずに値を選べる。
- 比較の書き方 1 つで、コンパイラの最適化の効き方が変わることがある。
