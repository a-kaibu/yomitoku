---
title: "魔法の定数 de Bruijn 列で「右端の 0 の数」を一発で求める"
description: "整数の末尾に 0 がいくつ続くかを、ループを使わず「掛け算 1 回と表引き 1 回」で求める関数。de Bruijn 列という数学の道具が鍵です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits/bits.go"
lines: [90, 106]
function: "TrailingZeros64"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 標準ライブラリ, ハック]
---

## ひとことで

`TrailingZeros64` は、64 ビット整数を 2 進数で書いたとき **右端（下位）から `0` が何個続くか** を返します。
たとえば `40` は 2 進数で `101000` なので、答えは `3` です。`0` のときはすべての桁が 0 なので `64` を返します。

素直に書くと「右から 1 ビットずつ調べるループ」になりますが、この関数は **掛け算 1 回とシフト 1 回、配列の読み出し 1 回** で答えを出します。

## コード

::: code-group

```go:line-numbers=90 [日本語訳]
func TrailingZeros64(x uint64) int {
	if x == 0 {
		return 64
	}
	// popcount が速いなら、下のコードを return popcount(^x & (x - 1)) に置き換えてよい。
	//
	// x & -x は、ワード中のいちばん右の 1 のビットだけを残す。
	// そのビットの位置を k とする。
	// 立っているビットは 1 つだけなので、値は 2 の k 乗である。
	// 2 の累乗を掛けることは左シフトと同じで、ここでは k ビット左にずらすことになる。
	// de Bruijn（64 ビット）定数は、連続する 6 ビットの部分列がすべて異なるように作られている。
	// したがって、この定数を左にずらした値があれば、
	// ワードの最上位に来た 6 ビットの部分列を見ることで、
	// 何ビットずれたかがわかる。
	// （Knuth, 第 4 巻, 7.3.1 節）
	return int(deBruijn64tab[(x&-x)*deBruijn64>>(64-6)])
}
```

```go:line-numbers=90 [原文]
func TrailingZeros64(x uint64) int {
	if x == 0 {
		return 64
	}
	// If popcount is fast, replace code below with return popcount(^x & (x - 1)).
	//
	// x & -x leaves only the right-most bit set in the word. Let k be the
	// index of that bit. Since only a single bit is set, the value is two
	// to the power of k. Multiplying by a power of two is equivalent to
	// left shifting, in this case by k bits. The de Bruijn (64 bit) constant
	// is such that all six bit, consecutive substrings are distinct.
	// Therefore, if we have a left shifted version of this constant we can
	// find by how many bits it was shifted by looking at which six bit
	// substring ended up at the top of the word.
	// (Knuth, volume 4, section 7.3.1)
	return int(deBruijn64tab[(x&-x)*deBruijn64>>(64-6)])
}
```

:::

使われている定数と表は、定義されています（`deBruijn64 = 0x03f79d71b4ca8b09` と、64 要素の `byte` 配列 `deBruijn64tab`）。

## 前提知識

- **`uint64`**: 符号なし（マイナスがない）64 ビット整数です。値は 64 個の 0/1 の並びとして扱えます。
- **`x & -x`**: `-x` は「全ビットを反転して 1 を足した値」（2 の補数）です。符号なし整数でも Go ではこの計算ができ、`x & -x` は **いちばん右の `1` だけを残した値** になります。`101000 & -101000 = 001000` です。
- **`<<` と `>>`**: ビット列を左・右にずらす演算子です。左に k ずらすことは「2 の k 乗を掛ける」のと同じです。
- **配列 `[64]byte{...}`**: 長さ 64 の、0〜255 の値を入れられる配列です。`tab[i]` で i 番目を読みます。
- **`int(...)`**: 型変換です。Go は型に厳しく、`byte` をそのまま `int` として返せないので明示的に変換します。
- **オーバーフロー**: `uint64` の掛け算で 64 ビットに入りきらない上の桁は、黙って捨てられます。この関数はその性質を積極的に利用しています。

## 何をしているか

### 1. 0 の特別扱い

```go:line-numbers=91
	if x == 0 {
		return 64
	}
```

`x` が `0` だと「いちばん右の 1」が存在しないので、先に `64` を返してしまいます。

### 2. いちばん右の 1 だけを取り出す

```go:line-numbers=105
	return int(deBruijn64tab[(x&-x)*deBruijn64>>(64-6)])
```

`x = 40`（`...0101000`）なら `x & -x = 8`（`...0001000`）です。これで値は必ず **2 の k 乗**（k が求めたい答え）になります。

### 3. de Bruijn 定数に掛ける

2 の k 乗を掛けるのは、定数を **k ビット左にずらす** のと同じです。
`deBruijn64` は「どの位置から 6 ビット切り出しても、64 通りすべて違う模様になる」ように作られた特別な数（de Bruijn 列）です。

### 4. 上位 6 ビットを見る

`>>(64-6)` で、ずらした後の **いちばん上の 6 ビット** だけを取り出します。6 ビットは 0〜63 の 64 通りで、k が違えば必ず違う値になります。
あとは「この 6 ビット模様なら k はいくつ」をあらかじめ並べた表 `deBruijn64tab` を引けば、答えの k が出てきます。

`x = 40` なら k = 3 なので、定数を 3 ビットずらしたときの上位 6 ビットに対応する表の要素が `3` になっています。

## ここがすごい

- **ループが消える**: 素直なループだと最悪 63 回の繰り返しと分岐が必要です。この方法なら入力に関係なく一定の手数で終わります。
- **数学の道具を実務に使っている**: コメントにある通り、これは Knuth『The Art of Computer Programming』第 4 巻 7.3.1 節に載っている手法です。「どの 6 ビット窓も重複しない」という de Bruijn 列の性質を、**完全ハッシュ関数**（衝突しないハッシュ）として使っています。
- **`x & -x` の小技**: 「いちばん右の 1 だけ残す」は低レイヤでよく使う定番テクニックです。これで入力が 64 通りの 2 の累乗だけに絞られるので、64 要素の表で済みます。
- **さらに速い道も示している**:コメントにある通り、popcount（1 の個数を数える命令）が速い CPU では `popcount(^x & (x - 1))` でも求められます。実際には Go のコンパイラが多くの CPU で専用命令（x86 の `TZCNT` など）に置き換えるため、この Go コードは専用命令がない環境向けの実装です。

## まとめ

- `x & -x` で「いちばん右の 1」だけを取り出せる。
- 2 の累乗を掛けることは左シフトと同じ。
- de Bruijn 列を使うと、64 通りの値を衝突なしに 0〜63 へ対応づけられる。
- 「掛け算 + 表引き」は、分岐やループを消すための強力な組み合わせ。
