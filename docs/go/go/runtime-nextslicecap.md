---
title: "スライスはどれだけ大きくなる？ 2 倍から 1.25 倍へなめらかに変わる成長式"
description: "append で容量が足りないときに新しい容量を決めるランタイムの関数。小さいうちは 2 倍、大きくなると約 1.25 倍に、段差なく切り替わる式を使っています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/runtime/slice.go"
lines: [326, 358]
function: "nextslicecap"
difficulty: 2
format: 2
tags: [メモリ管理, アルゴリズム, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

Go のスライスに `append` で要素を追加して容量（確保済みの場所）が足りなくなると、ランタイムはより大きな場所を確保して中身を移します。
`nextslicecap` は、そのとき **新しい容量をいくつにするか** を決める関数です。

小さいスライスは 2 倍に、大きいスライスは約 1.25 倍に増やします。その間を **なめらかにつなぐ式** と、桁あふれまで考えたチェックがポイントです。

## コード

::: code-group

```go:line-numbers=326 [日本語訳]
func nextslicecap(newLen, oldCap int) int {
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		return newLen
	}

	const threshold = 256
	if oldCap < threshold {
		return doublecap
	}
	for {
		// 小さいスライスは 2 倍、大きいスライスは 1.25 倍で
		// 伸びるように移行する。この式は両者のあいだを
		// そこそこなめらかにつなぐ。
		newcap += (newcap + 3*threshold) >> 2

		// `newcap >= newLen` かどうかと、newcap がオーバーフローしたかを調べる必要がある。
		// newLen は必ず 0 より大きいので、
		// newcap がオーバーフローすると `uint(newcap) > uint(newLen)` になる。
		// これで両方を同じ比較で調べられる。
		if uint(newcap) >= uint(newLen) {
			break
		}
	}

	// newcap の計算がオーバーフローしたときは、
	// newcap を要求された容量にする。
	if newcap <= 0 {
		return newLen
	}
	return newcap
}
```

```go:line-numbers=326 [原文]
func nextslicecap(newLen, oldCap int) int {
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		return newLen
	}

	const threshold = 256
	if oldCap < threshold {
		return doublecap
	}
	for {
		// Transition from growing 2x for small slices
		// to growing 1.25x for large slices. This formula
		// gives a smooth-ish transition between the two.
		newcap += (newcap + 3*threshold) >> 2

		// We need to check `newcap >= newLen` and whether `newcap` overflowed.
		// newLen is guaranteed to be larger than zero, hence
		// when newcap overflows then `uint(newcap) > uint(newLen)`.
		// This allows to check for both with the same comparison.
		if uint(newcap) >= uint(newLen) {
			break
		}
	}

	// Set newcap to the requested cap when
	// the newcap calculation overflowed.
	if newcap <= 0 {
		return newLen
	}
	return newcap
}
```

:::

## 前提知識

- **スライスの長さと容量**: スライスには「長さ（今入っている数）」と「容量（確保済みの場所の大きさ）」があります。容量を超えて `append` すると、新しい場所の確保とコピーが起きます。
- **`>> 2`**: 右に 2 ビットずらす、つまり 4 で割ることです。`x >> 2` は `x / 4` と同じ（正の数の場合）。
- **`const threshold = 256`**: 関数の中で定数を宣言しています。
- **オーバーフロー**: `int` の最大値を超えると、値が負の数に折り返します。
- **`uint(newcap)`**: 符号なし整数として見ます。負の数は巨大な正の数になります。

## 何をしているか

### 1. 一度にたくさん追加する場合

```go:line-numbers=327
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		return newLen
	}
```

必要な長さ `newLen` が今の容量の 2 倍より大きければ、ちょうど `newLen` にします。`append(s, 100個の要素...)` のような場合です。

### 2. 小さいスライスは 2 倍

```go:line-numbers=333
	const threshold = 256
	if oldCap < threshold {
		return doublecap
	}
```

容量が 256 未満なら 2 倍にします。容量 4 → 8 → 16 → ... と増えます。

### 3. 大きいスライスはなめらかに 1.25 倍へ

```go:line-numbers=337
	for {
		// 小さいスライスは 2 倍、大きいスライスは 1.25 倍で
		// 伸びるように移行する。この式は両者のあいだを
		// そこそこなめらかにつなぐ。
		newcap += (newcap + 3*threshold) >> 2

		// `newcap >= newLen` かどうかと、newcap がオーバーフローしたかを調べる必要がある。
		// newLen は必ず 0 より大きいので、
		// newcap がオーバーフローすると `uint(newcap) > uint(newLen)` になる。
		// これで両方を同じ比較で調べられる。
		if uint(newcap) >= uint(newLen) {
			break
		}
	}
```

式 `newcap += (newcap + 3*256) / 4` で増やします。

| 今の容量 | 増える量 | 新しい容量 | 倍率 |
| --- | --- | --- | --- |
| 256 | (256 + 768) / 4 = 256 | 512 | 2.0 倍 |
| 1024 | (1024 + 768) / 4 = 448 | 1472 | 約 1.44 倍 |
| 10000 | (10000 + 768) / 4 = 2692 | 12692 | 約 1.27 倍 |

容量 256 のときちょうど 2 倍で、大きくなるほど 1.25 倍に近づきます。256 を境に倍率がいきなり変わることがありません。
必要な長さに届くまでこれを繰り返します。

### 4. 桁あふれのチェック

```go:line-numbers=343
		// `newcap >= newLen` かどうかと、newcap がオーバーフローしたかを調べる必要がある。
		// newLen は必ず 0 より大きいので、
		// newcap がオーバーフローすると `uint(newcap) > uint(newLen)` になる。
		// これで両方を同じ比較で調べられる。
		if uint(newcap) >= uint(newLen) {
			break
		}
	}

	// newcap の計算がオーバーフローしたときは、
	// newcap を要求された容量にする。
	if newcap <= 0 {
		return newLen
	}
```

`newcap` が増えすぎて `int` をあふれると負になります。、比較を **符号なし** で行うことで、「十分な大きさに達した」と「あふれて負になった」の両方を 1 回の比較で検出しています（負の数は符号なしでは巨大な値になるため）。
あふれていたら必要な長さ `newLen` をそのまま返します。

## ここがすごい

- **倍々で増やす理由**: 毎回「必要なぶんだけ」増やすと、追加のたびに全体をコピーすることになり、n 個追加するのに n² に比例する時間がかかります。一定の倍率で増やせば、コピーの総量は n に比例する程度で済みます。
- **大きいと倍率を下げる理由**: 巨大なスライスを 2 倍にすると、使わないかもしれない大量のメモリを確保してしまいます。大きいときは 1.25 倍に抑えて、メモリの無駄を減らしています。
- **段差のない切り替え**: 以前の Go は「1024 未満なら 2 倍、それ以上なら 1.25 倍」と急に切り替えていました。そのため、容量によっては「小さいスライスのほうが大きく育つ」という逆転が起きていました。現在の式は倍率がなめらかに変化するので、その逆転が起きません。
- **1 回の比較で 2 つを確認**: 符号なし比較で「十分か」と「あふれたか」を同時に調べるのは、無駄のない小技です。

実際の容量は、この後でメモリ割り当ての単位（サイズクラス）に合わせて切り上げられるので、表の値より少し大きくなることがあります。

## まとめ

- スライスは容量を一定の倍率で増やすことで、`append` を平均 O(1) で行える。
- Go は小さいうちは 2 倍、大きくなると約 1.25 倍に、なめらかな式で切り替える。
- 符号なしで比較すると、「十分な大きさか」と「桁あふれしたか」を同時に判定できる。
