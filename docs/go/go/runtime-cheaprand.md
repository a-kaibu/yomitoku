---
title: "掛け算 1 回でできる高速乱数 wyrand。ランタイムの「安い乱数」"
description: "Go のランタイムが内部で使う乱数 cheaprand。64 ビット環境では、定数を足して掛け算し、上位と下位を XOR する wyrand という方式で乱数を作ります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/runtime/rand.go"
lines: [231, 253]
function: "cheaprand"
difficulty: 3
format: 2
tags: [乱数, 最適化, 低レイヤ, 標準ライブラリ]
---

## ひとことで

`cheaprand` は、Go のランタイム（プログラムの実行を支える仕組み）が内部で使う **速くて安い乱数** です。
`select` 文で複数の準備のできたチャネルからどれを選ぶか、マップの反復の開始位置、スケジューラの判断など、「偏りなくばらつけばよい」場面で使われます。暗号には使えません。

64 ビット環境では、**定数を足して、自分自身との掛け算を 1 回する** だけの wyrand という方式を使っています。

## コード

::: code-group

```go:line-numbers=231 [日本語訳]
func cheaprand() uint32 {
	mp := getg().m
	// wyrand を実装する: https://github.com/wangyi-fudan/wyhash
	// 64 ビットの掛け算をネイティブに
	// サポートするプラットフォームだけに許可すべき。
	if bits.UintSize == 64 {
		mp.cheaprand += 0x53c5ca59
		hi, lo := bits.Mul32(mp.cheaprand, mp.cheaprand^0x74743c1b)
		return hi ^ lo
	}

	// xorshift64+ を実装する: 32 ビットの xorshift 列 2 つを足し合わせたもの。
	// シフトの組 [17,7,16] は、Marsaglia の
	// Xorshift の論文に書かれた方法で計算した: https://www.jstatsoft.org/article/view/v008i14/xorshift.pdf
	// この生成器は TestU01 フレームワークの
	// SmallCrush テストに合格する:
	t := (*[2]uint32)(unsafe.Pointer(&mp.cheaprand64))
	s1, s0 := t[0], t[1]
	s1 ^= s1 << 17
	s1 = s1 ^ s0 ^ s1>>7 ^ s0>>16
	t[0], t[1] = s0, s1
	return s0 + s1
}
```

```go:line-numbers=231 [原文]
func cheaprand() uint32 {
	mp := getg().m
	// Implement wyrand: https://github.com/wangyi-fudan/wyhash
	// Only the platform that supports 64-bit multiplication
	// natively should be allowed.
	if bits.UintSize == 64 {
		mp.cheaprand += 0x53c5ca59
		hi, lo := bits.Mul32(mp.cheaprand, mp.cheaprand^0x74743c1b)
		return hi ^ lo
	}

	// Implement xorshift64+: 2 32-bit xorshift sequences added together.
	// Shift triplet [17,7,16] was calculated as indicated in Marsaglia's
	// Xorshift paper: https://www.jstatsoft.org/article/view/v008i14/xorshift.pdf
	// This generator passes the SmallCrush suite, part of TestU01 framework:
	// http://simul.iro.umontreal.ca/testu01/tu01.html
	t := (*[2]uint32)(unsafe.Pointer(&mp.cheaprand64))
	s1, s0 := t[0], t[1]
	s1 ^= s1 << 17
	s1 = s1 ^ s0 ^ s1>>7 ^ s0>>16
	t[0], t[1] = s0, s1
	return s0 + s1
}
```

:::

## 前提知識

- **ランタイム**: Go のプログラムに組み込まれている、メモリ管理やゴルーチン（軽量なスレッド）の切り替えを行う仕組みです。
- **M（マシン）**: ランタイムでは、OS のスレッドを `m` と呼びます。`getg().m` は「今動いているゴルーチンを実行しているスレッド」です。スレッドごとに乱数の状態を持つので、ロックが要りません。
- **`bits.Mul32(x, y)`**: 32 ビット同士を掛けた 64 ビットの結果を、上位 32 ビット `hi` と下位 32 ビット `lo` に分けて返します。
- **`^`**: XOR（排他的論理和）です。
- **`unsafe.Pointer`**: 型の安全性を無視してメモリを別の型として扱う仕組みです。ここでは 64 ビットの値を 32 ビット 2 つの配列として見ています。

## 何をしているか

### 1. 64 ビット環境の場合

```go:line-numbers=236
	if bits.UintSize == 64 {
		mp.cheaprand += 0x53c5ca59
		hi, lo := bits.Mul32(mp.cheaprand, mp.cheaprand^0x74743c1b)
		return hi ^ lo
	}
```

1. 状態に定数 `0x53c5ca59` を足します。状態はただ一定の数ずつ増えていくだけです。
2. 状態と「状態を別の定数で XOR したもの」を掛け、64 ビットの結果を得ます。
3. 結果の上位 32 ビットと下位 32 ビットを XOR して返します。

状態は単純なカウンタですが、掛け算によって **すべてのビットが混ぜ合わされる** ので、出てくる値はばらばらに見えます。上位と下位を XOR すると、掛け算で偏りやすい下位ビットも上位のよく混ざったビットで補われます。

### 2. 32 ビット環境の場合

```go:line-numbers=242
	// xorshift64+ を実装する: 32 ビットの xorshift 列 2 つを足し合わせたもの。
	// シフトの組 [17,7,16] は、Marsaglia の
	// Xorshift の論文に書かれた方法で計算した: https://www.jstatsoft.org/article/view/v008i14/xorshift.pdf
	// この生成器は TestU01 フレームワークの
	// SmallCrush テストに合格する:
	t := (*[2]uint32)(unsafe.Pointer(&mp.cheaprand64))
	s1, s0 := t[0], t[1]
	s1 ^= s1 << 17
	s1 = s1 ^ s0 ^ s1>>7 ^ s0>>16
	t[0], t[1] = s0, s1
	return s0 + s1
```

64 ビットの掛け算が遅い環境では、2 つの 32 ビットの xorshift を組み合わせた xorshift64+ を使います。シフトと XOR だけで状態を更新し、2 つの値の和を返します。

## ここがすごい

- **とても少ない命令数**: 64 ビット版は「足し算 1 回、XOR 2 回、掛け算 1 回」だけです。64 ビットの掛け算は現代の CPU では数サイクルで終わるので、非常に速い乱数になります。
- **スレッドごとの状態でロック不要**: 状態を `m`（スレッド）ごとに持っているので、複数のスレッドが同時に乱数を使っても待ち合わせが起きません。
- **環境に合わせて方式を変える**: 64 ビットの掛け算が得意な環境では wyrand、そうでない環境ではシフトだけの xorshift64+ を使い分けています。`bits.UintSize == 64` はコンパイル時に決まる定数なので、使わないほうのコードは実行ファイルから取り除かれます。
- **出典を明記**:、方式の出典（wyhash、Marsaglia の論文、TestU01 の SmallCrush テストに通ること）が書かれています。乱数の品質は見た目ではわからないので、根拠を示すことが大切です。

## まとめ

- 「カウンタ + 掛け算でかき混ぜる」だけでも、実用的な乱数が作れる（wyrand）。
- 掛け算の結果の上位と下位を XOR すると、ビットがよく混ざる。
- スレッドごとに状態を持てば、ロックなしで乱数を使える。
- 暗号用ではない乱数は、速さを優先して選んでよい。
