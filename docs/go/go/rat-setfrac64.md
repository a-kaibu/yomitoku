---
title: "2 つの int64 から分数を作る Rat.SetFrac64。分母が 0 ならパニック、約分もする"
description: "math/big の有理数 Rat に、分子 a と分母 b（どちらも int64）を設定する SetFrac64。分母が負なら符号を分子へ移し、最後に約分する。分母が 0 なら、パニックを起こす。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/rat.go"
lines: [323, 334]
function: "SetFrac64"
difficulty: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`z.SetFrac64(a, b)` は、分子 `a` と分母 `b` を持つ分数を `z` に設定します。例えば `SetFrac64(2, -4)` は、`-1/2` に整えられます。

分母が 0 の分数は存在しません。そのため、分母が 0 のときは、パニックを起こします。また、分母が負のときは、符号を分子へ移して、分母を正の数に揃えます。

## コード

```go:line-numbers=323
func (z *Rat) SetFrac64(a, b int64) *Rat {
	if b == 0 {
		panic("division by zero")
	}
	z.a.SetInt64(a)
	if b < 0 {
		b = -b
		z.a.neg = !z.a.neg
	}
	z.b.abs = z.b.abs.setUint64(uint64(b))
	return z.norm()
}
```

## 前提知識

- **`Rat` 型**: 分数を表す型です。内部では、分子 `a` と分母 `b` を、それぞれ `Int` として持っています。
- **符号の位置**: 分数の符号は、分子に付けるのが約束です。分母は、常に正の数として扱います。
- **約分**: 分子と分母を、共通の約数で割って、簡単な形にすることです。`2/4` は `1/2` になります。
- **`norm`**: `Rat` の値を、正規の形に整える内部の処理です。約分などを行います。

## 何をしているか

### 1. 分母が 0 なら止める

```go:line-numbers=324
	if b == 0 {
		panic("division by zero")
	}
```

分母が 0 の分数は、数として成り立ちません。ここで `panic` を起こして、誤った値を作ることを防ぎます。

### 2. 分子を設定する

```go:line-numbers=327
	z.a.SetInt64(a)
```

まず、分子 `a` を `z.a` に設定します。`SetInt64` の仕組みで、負の数も正しく扱われます。

### 3. 分母が負なら符号を移す

```go:line-numbers=328
	if b < 0 {
		b = -b
		z.a.neg = !z.a.neg
	}
```

分母が負なら、分母の符号を反転して正にします。その代わりに、分子の符号を反転させます。例えば `1/-2` は `-1/2` と同じ値です。

### 4. 分母を設定して約分する

```go:line-numbers=332
	z.b.abs = z.b.abs.setUint64(uint64(b))
	return z.norm()
```

分母の絶対値を設定します。最後に `norm` で、分子と分母の約分を行い、`z` を正規の形にして返します。

## ここがすごい

- **分母を常に正にする**: 符号の位置を、分子の 1 か所に決めます。分数の比べ方や計算が、単純になります。
- **0 の分母だけを特別扱い**: 分母が 0 のときだけ止めるので、それ以外の値は、すべて正しい分数になります。
- **約分を自動で行う**: 呼び出す側が、約分を意識する必要はありません。`norm` を通るので、同じ値は必ず同じ形になります。

## まとめ

- `SetFrac64` は、2 つの `int64` から分数を作ります。
- 分母が 0 なら `panic` を起こします。
- 分母が負なら、符号を分子へ移して、分母を正に揃えます。
- 最後に約分して、正規の形で返します。
