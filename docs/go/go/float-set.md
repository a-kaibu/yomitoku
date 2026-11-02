---
title: "浮動小数点数の値をコピーする Float.Set。精度と丸めの扱いも決める"
description: "math/big の Float の Set。x の値を z にコピーする。z の精度が 0 なら x の精度を引き継ぎ、精度が足りなければ丸める。同じ変数どうしのコピーは何もしない。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/float.go"
lines: [655, 674]
function: "Set"
difficulty: 2
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`z.Set(x)` は、浮動小数点数 `x` の値を `z` にコピーします。`z` と `x` が同じ変数なら、何もせずに戻ります。

`math/big` の `Float` は、精度（何ビットまで覚えるか）を持っています。そのため、コピーの際には、精度をどう扱うかも決める必要があります。この関数は、その決まりを行う場所です。

## コード

```go:line-numbers=655
func (z *Float) Set(x *Float) *Float {
	if debugFloat {
		x.validate()
	}
	z.acc = Exact
	if z != x {
		z.form = x.form
		z.neg = x.neg
		if x.form == finite {
			z.exp = x.exp
			z.mant = z.mant.set(x.mant)
		}
		if z.prec == 0 {
			z.prec = x.prec
		} else if z.prec < x.prec {
			z.round(0)
		}
	}
	return z
}
```

## 前提知識

- **精度（prec）**: 浮動小数点数が、何ビットの有効数字を持つかを表す値です。大きいほど細かい値を表せます。
- **丸め（round）**: 精度を超える部分を、決まったルールで切り捨てたり、切り上げたりすることです。
- **`form`**: 値が有限か、無限大か、0 か、NaN かを表す区分です。`finite` のときだけ、指数と仮数を持ちます。
- **`Exact`**: 結果が正確に表せたことを表す値です。コピーは正確なので、この値を設定します。

## 何をしているか

### 1. 正確な結果だと記録する

```go:line-numbers=659
	z.acc = Exact
```

コピーは、値を変えずに移すだけなので、結果は正確です。`acc` に `Exact` を設定して、そのことを記録します。

### 2. 自分自身へのコピーは何もしない

```go:line-numbers=660
	if z != x {
```

`z` と `x` が同じ変数なら、コピーする必要がありません。この判定で、無駄な処理を省きます。

### 3. 精度を決める

```go:line-numbers=667
	if z.prec == 0 {
		z.prec = x.prec
	} else if z.prec < x.prec {
		z.round(0)
	}
```

`z` の精度が 0 なら、まだ精度が決まっていないので、`x` の精度を引き継ぎます。

`z` の精度が `x` より小さいときは、値を `z` の精度に丸めます。`z.round(0)` で、今の値を、`z` の精度に合わせて整えます。

## ここがすごい

- **同じ値でも、精度を守る**: 精度の大きな値を、小さな精度の `z` にコピーすると、丸めが行われます。これで、精度の約束を破らずに済みます。
- **既定の精度を自動で決める**: 精度 0 のときは、コピー元の精度をそのまま使います。使う側が、いちいち精度を指定しなくてもよくなっています。
- **同じ変数を守る**: `z == x` のときは処理を飛ばします。値を自分自身にコピーして、精度を壊してしまうことを防いでいます。

## まとめ

- `Set` は、`x` の値を `z` にコピーします。
- `z` の精度が 0 なら、`x` の精度を引き継ぎます。
- `z` の精度が足りないときは、丸めを行います。
- 同じ変数どうしのコピーは、何もしません。
