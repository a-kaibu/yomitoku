---
title: "文字列の繰り返しを「倍々コピー」で作り、キャッシュの大きさまで考える"
description: "文字列を count 回つなげる strings.Repeat。できた部分を丸ごとコピーして倍々に伸ばし、さらに CPU キャッシュに収まるよう塊の大きさを制限しています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [597, 665]
function: "Repeat"
difficulty: 2
tags: [文字列処理, 最適化, キャッシュ, 標準ライブラリ]
---

## ひとことで

`strings.Repeat("ab", 3)` は `"ababab"` を返します。文字列 `s` を `count` 回つなげた新しい文字列を作る関数です。

素直に作るなら「`s` を `count` 回書き足す」ですが、この関数は **すでに作った部分をまるごとコピーして長さを倍々にする** ので、書き込み回数が `count` 回ではなく log2(count) 回程度で済みます。

## コード

```go:line-numbers=597
func Repeat(s string, count int) string {
	switch count {
	case 0:
		return ""
	case 1:
		return s
	}

	// Since we cannot return an error on overflow,
	// we should panic if the repeat will generate an overflow.
	// See golang.org/issue/16237.
	if count < 0 {
		panic("strings: negative Repeat count")
	}
	hi, lo := bits.Mul(uint(len(s)), uint(count))
	if hi > 0 || lo > uint(maxInt) {
		panic("strings: Repeat output length overflow")
	}
	n := int(lo) // lo = len(s) * count

	if len(s) == 0 {
		return ""
	}

	// Optimize for commonly repeated strings of relatively short length.
	switch s[0] {
	case ' ', '-', '0', '=', '\t':
		switch {
		case n <= len(repeatedSpaces) && HasPrefix(repeatedSpaces, s):
			return repeatedSpaces[:n]
		case n <= len(repeatedDashes) && HasPrefix(repeatedDashes, s):
			return repeatedDashes[:n]
		case n <= len(repeatedZeroes) && HasPrefix(repeatedZeroes, s):
			return repeatedZeroes[:n]
		case n <= len(repeatedEquals) && HasPrefix(repeatedEquals, s):
			return repeatedEquals[:n]
		case n <= len(repeatedTabs) && HasPrefix(repeatedTabs, s):
			return repeatedTabs[:n]
		}
	}

	// Past a certain chunk size it is counterproductive to use
	// larger chunks as the source of the write, as when the source
	// is too large we are basically just thrashing the CPU D-cache.
	// So if the result length is larger than an empirically-found
	// limit (8KB), we stop growing the source string once the limit
	// is reached and keep reusing the same source string - that
	// should therefore be always resident in the L1 cache - until we
	// have completed the construction of the result.
	// This yields significant speedups (up to +100%) in cases where
	// the result length is large (roughly, over L2 cache size).
	const chunkLimit = 8 * 1024
	chunkMax := n
	if n > chunkLimit {
		chunkMax = chunkLimit / len(s) * len(s)
		if chunkMax == 0 {
			chunkMax = len(s)
		}
	}

	var b Builder
	b.Grow(n)
	b.WriteString(s)
	for b.Len() < n {
		chunk := min(n-b.Len(), b.Len(), chunkMax)
		b.WriteString(b.String()[:chunk])
	}
	return b.String()
}
```

## 前提知識

- **`switch`**: Go の `switch` は、一致した `case` だけを実行し、次の `case` へは自動で進みません（C のような `break` は不要です）。
- **`panic`**: 回復できない異常が起きたときにプログラムを止める仕組みです。Go ではふつうエラーは戻り値で返しますが、この関数は戻り値が文字列だけなので、あふれは `panic` で知らせます。
- **`bits.Mul`**: 2 つの整数を掛けた結果を、上位と下位に分けて返す関数です。上位 `hi` が 0 でなければ、掛け算が整数の範囲をあふれたとわかります。
- **`strings.Builder`**: 文字列を少しずつ組み立てるための型です。`Grow(n)` で先に容量を確保し、`WriteString` で書き足し、`String()` で結果を取り出します。
- **スライス式 `s[:n]`**: 文字列や配列の先頭から `n` バイトぶんを取り出します。コピーは作らず、元のデータを共有します。
- **`min(a, b, c)`**: Go 1.21 から使える組み込み関数で、いちばん小さい値を返します。

## 何をしているか

### 1. 簡単な場合と異常の処理（598〜619 行目）

`count` が 0 なら空文字列、1 なら `s` をそのまま返します。負の数なら `panic` します。
611 行目では `len(s) * count` を `bits.Mul` で計算し、結果が `int` の最大値を超えるなら `panic` します。ふつうの掛け算だと、あふれて小さな値になったことに気づけないからです。

### 2. よくある文字はあらかじめ用意した文字列を切り出す（622〜636 行目）

スペース、`-`、`0`、`=`、タブの繰り返しは、表の区切りやインデントでとてもよく使われます。そこで、これらを長く並べた文字列（`repeatedSpaces` など）をあらかじめ用意しておき、**先頭から必要な長さを切り出すだけ** で返します。新しいメモリ確保すら起きません。

### 3. 倍々にコピーする（657〜663 行目）

`s = "ab"`、`count = 5`（`n = 10`）で追います。

1. `Grow(10)` で 10 バイト分の場所を確保し、`"ab"` を書く（長さ 2）
2. できている `"ab"` をコピー → `"abab"`（長さ 4）
3. できている `"abab"` をコピー → `"abababab"`（長さ 8）
4. 残り 2 バイトだけコピー → `"ababababab"`（長さ 10）

`min(n-b.Len(), b.Len(), chunkMax)` で、「残りの長さ」「今ある長さ」「上限」のうち小さいほうだけコピーしています。

### 4. コピー元の大きさを 8KB で止める（648〜655 行目）

結果がとても長いとき、コピー元も倍々に大きくなると CPU のキャッシュ（CPU のそばにある小さく速いメモリ）からはみ出してしまいます。そこで、コピーする塊を 8KB（`s` の長さの倍数）までに抑えます。

## ここがすごい

- **倍々コピー**: 1 回ずつ書くと `count` 回の書き込みが必要ですが、倍々ならおよそ log2(count) 回です。1 回のコピー自体は CPU の得意な一括コピー（`memmove`）になるので、とても速く動きます。
- **キャッシュまで考えた上限**: 641〜647 行目のコメントによると、8KB という値は実験で見つけたもので、結果が大きい場合に最大 2 倍速くなったそうです。「理屈では倍々が最善」でも、実際のハードウェアに合わせて調整しているのがポイントです。
- **よくある入力を特別扱い**: スペースやダッシュの繰り返しという「よくある使い方」だけは、計算せずに既存の文字列を切り出して返します。
- **あふれを確実に検出**: `bits.Mul` で上位の桁まで求めることで、巨大な `count` による桁あふれを見逃しません。

## まとめ

- できた部分を再利用して倍々に伸ばすと、繰り返し処理の回数を対数レベルに減らせる。
- 理論上の最適だけでなく、CPU キャッシュの大きさのような現実の制約も考える。
- 頻出する入力には、あらかじめ用意した答えを使う近道を作る。
- 掛け算のあふれは、上位の桁まで計算できる関数で確実にチェックする。
