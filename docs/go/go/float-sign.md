---
title: "浮動小数点数の符号を返す Float.Sign。0 と負と正の 3 通りに分ける"
description: "math/big の Float の符号を返す Sign。0 なら 0、負なら -1、正なら 1 を返す。デバッグ時には、値の状態が正しいかを確かめてから判定する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/float.go"
lines: [240, 251]
function: "Sign"
difficulty: 1
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`x.Sign()` は、浮動小数点数 `x` の符号を返します。値が正なら `1`、負なら `-1`、0 なら `0` です。

数学の符号関数と同じ役割です。値そのものを比べなくても、この 3 つの答えで、正負や 0 の判断ができます。

## コード

```go:line-numbers=240
func (x *Float) Sign() int {
	if debugFloat {
		x.validate()
	}
	if x.form == zero {
		return 0
	}
	if x.neg {
		return -1
	}
	return 1
}
```

## 前提知識

- **符号関数**: 値の正負を、`-1`、`0`、`1` の 3 通りで表す関数です。プログラムでは、大小の判定の土台としてよく使われます。
- **`form`**: 値の種類（有限、無限大、0、NaN など）を表す区分です。0 は、`zero` という区分で表されます。
- **`neg` フラグ**: 負の値かどうかを表す真偽値です。0 以外の有限値は、この値で正負を決めます。
- **`debugFloat`**: デバッグのときだけ真になる定数です。真のとき、`validate` で値の矛盾を確かめます。

## 何をしているか

### 1. デバッグ時に値を確かめる

```go:line-numbers=241
	if debugFloat {
		x.validate()
	}
```

デバッグのときだけ、値の内部の状態が正しいかを `validate` で確かめます。通常の実行では、この判定は行われません。

### 2. 0 なら 0 を返す

```go:line-numbers=244
	if x.form == zero {
		return 0
	}
```

値が 0 なら、符号は 0 です。`form` が `zero` かどうかで判定します。

### 3. 負なら -1、正なら 1 を返す

```go:line-numbers=247
	if x.neg {
		return -1
	}
	return 1
```

0 でなければ、`neg` で正負を決めます。負なら `-1`、そうでなければ `1` を返します。

## ここがすごい

- **状態を先に分けて判定**: 0 かどうかを先に見ると、後の判定が単純になります。0 の符号には、特別な値があるからです。
- **デバッグの確認を分離**: 通常の動きを遅くせずに、開発中だけ内部の矛盾を見つけられます。
- **大小の比べ方の土台**: `x.Sign()` が分かれば、`x` と 0 の比べ方が決まります。他の比較の関数も、この結果を使えます。

## まとめ

- `Sign` は、値が負なら `-1`、0 なら `0`、正なら `1` を返します。
- 0 は `zero` の区分で先に判定し、その後で `neg` を見ます。
- デバッグのときだけ、値の状態を確かめる処理が入ります。
