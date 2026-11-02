---
title: "2 つの時刻が同じかを比べる time.Time.Equal"
description: "time.Time.Equal は、2 つの時刻が同じ瞬間を指すかを返します。両方に単調時計の値があればそれで比べ、無ければ秒とナノ秒で比べます。場所の違いは無視します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [316, 321]
function: "Equal"
difficulty: 1
format: 2
tags: [日時, 標準ライブラリ, 数値計算]
---

## ひとことで

`t.Equal(u)` は、`t` と `u` が同じ時刻なら `true` を返します。`==` で比べると、場所（ロケーション）や単調時計の有無で違う結果になることがあるので、時刻の一致は `Equal` で比べます。

## コード

```go:line-numbers=316
func (t Time) Equal(u Time) bool {
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext == u.ext
	}
	return t.sec() == u.sec() && t.nsec() == u.nsec()
}
```

## 前提知識

- **`Time` の内部**: 時刻は、壁時計の秒とナノ秒、単調時計の値、そして場所の情報を持ちます。
- **`hasMonotonic`**: 単調時計の値が入っていることを示すビットです。
- **`==` の落とし穴**: 同じ瞬間でも、場所や単調時計の有無が違えば、`==` は偽になります。
- **秒とナノ秒**: 壁時計の時刻を、2 つの整数で表した値です。

## 何をしているか

### 1. 両方に単調時計があれば比べる

```go:line-numbers=317
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext == u.ext
	}
```

両方が単調時計の値を持つなら、その値が同じかを比べます。単調時計は時刻の修正の影響を受けないので、経過の比較に確実です。

### 2. 無ければ秒とナノ秒で比べる

```go:line-numbers=320
	return t.sec() == u.sec() && t.nsec() == u.nsec()
```

単調時計が無いときは、秒とナノ秒の両方が同じかを比べます。場所は比べないので、同じ瞬間なら、場所が違っても `true` になります。

## ここがすごい

- **場所の違いを無視する**: 東京の 9 時と UTC の 0 時が同じ瞬間なら、`Equal` は `true` を返します。
- **`==` より正確**: 内部の表現が違っても、指す瞬間が同じなら一致します。
- **比べ方を 2 段階にする**: 単調時計が使えるときは速く、使えないときは確実な比べ方を選びます。

## まとめ

- 時刻が同じ瞬間かは、`Equal` で比べる。
- 単調時計があればその値、無ければ秒とナノ秒で比べる。
- 場所の違いは無視される。
