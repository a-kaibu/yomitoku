---
title: "乱数生成器の内部の状態を更新する rngSource.Uint64。2 つの位置をずらして足す"
description: "math/rand の rngSource.Uint64。加法的な乱数生成器の内部の配列から、2 つの位置を選んで足し、結果を書き戻す。位置は毎回 1 つずつ戻るので、配列を循環して使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/rng.go"
lines: [238, 252]
function: "Uint64"
difficulty: 3
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`rng.Uint64()` は、乱数生成器の内部の配列から、新しい乱数を 1 つ作ります。作り方は、配列の 2 つの位置の値を足すだけです。

この乱数の仕組みは、「加法的な乱数生成器」と呼ばれます。2 つの位置を毎回ずらしながら足していくことで、長い周期の乱数列が得られます。

## コード

```go:line-numbers=238
func (rng *rngSource) Uint64() uint64 {
	rng.tap--
	if rng.tap < 0 {
		rng.tap += rngLen
	}

	rng.feed--
	if rng.feed < 0 {
		rng.feed += rngLen
	}

	x := rng.vec[rng.feed] + rng.vec[rng.tap]
	rng.vec[rng.feed] = x
	return uint64(x)
}
```

## 前提知識

- **乱数生成器**: 同じ初期値からは、同じ乱数列を作る仕組みです。内部には、状態を覚える配列があります。
- **`vec`**: 乱数の状態を覚えておく配列です。長さは `rngLen` です。
- **`tap` と `feed`**: 配列の中の 2 つの位置を指す番号です。毎回 1 つずつ戻ることで、配列の中を循環します。
- **オーバーフロー**: 64 ビットの足し算で上限を超えても、値は下の桁だけが残ります。その性質を、乱数の作成に使っています。

## 何をしているか

### 1. 2 つの位置を 1 つずつ戻す

```go:line-numbers=239
	rng.tap--
	if rng.tap < 0 {
		rng.tap += rngLen
	}
```

`tap` を 1 減らします。0 より小さくなったら、配列の長さ `rngLen` を足して、末尾へ回り込みます。これで、配列を循環して使えます。

```go:line-numbers=244
	rng.feed--
	if rng.feed < 0 {
		rng.feed += rngLen
	}
```

同じ処理を `feed` にも行います。`tap` と `feed` は、配列の中で一定の距離を保ちながら進みます。

### 2. 2 つの値を足して書き戻す

```go:line-numbers=249
	x := rng.vec[rng.feed] + rng.vec[rng.tap]
	rng.vec[rng.feed] = x
	return uint64(x)
```

2 つの位置の値を足して、`x` を作ります。その `x` を `feed` の位置へ書き戻して、次の乱数を作るときの状態にします。最後に、`x` を `uint64` にして返します。

## ここがすごい

- **足し算だけで乱数を作る**: 乗算や割り算を使わず、足し算と配列の参照だけです。とても速く動きます。
- **周期が長い**: 配列の 2 つの位置をずらして足していくので、同じ列が現れるまでの長さが大きくなります。
- **書き戻しで状態を進める**: 結果を配列に戻すことで、次の乱数の材料になります。この仕組みが、乱数の列を作り続けます。

## まとめ

- `Uint64` は、内部の配列の 2 つの位置の値を足して、新しい乱数を作ります。
- `tap` と `feed` を 1 つずつ戻して、配列を循環して使います。
- 足し算と書き戻しだけで動くので、速い乱数生成になっています。
