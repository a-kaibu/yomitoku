---
title: "2 つの時刻の前後を -1、0、+1 で返す time.Time.Compare"
description: "time.Time の Compare。単調時計の値があればそれで比べ、なければ秒、次にナノ秒の順に比べる。結果は、前なら -1、同じなら 0、後なら +1。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [292, 309]
function: "Compare"
difficulty: 2
tags: [日時, 型システム, アルゴリズム]
---

## ひとことで

`t.Compare(u)` は、2 つの時刻の前後関係を返します。`t` が `u` より前なら `-1`、同じなら `0`、後なら `+1` です。並べ替えの比較関数として、そのまま使える形になっています。

`Before` と `After` を 1 つにまとめた関数と考えられます。

## コード

```go:line-numbers=292
func (t Time) Compare(u Time) int {
	var tc, uc int64
	if t.wall&u.wall&hasMonotonic != 0 {
		tc, uc = t.ext, u.ext
	} else {
		tc, uc = t.sec(), u.sec()
		if tc == uc {
			tc, uc = int64(t.nsec()), int64(u.nsec())
		}
	}
	switch {
	case tc < uc:
		return -1
	case tc > uc:
		return +1
	}
	return 0
}
```

## 前提知識

- **単調時計（monotonic clock）**: 時刻の変更（NTP による調整など）に影響されず、前にしか進まない時計です。`time.Now()` が持つ情報です。
- **`hasMonotonic`**: 両方の時刻が単調時計を持っているかを示すビットです。持っていれば、その値で比べられます。
- **秒とナノ秒**: 単調時計がないときは、秒を比べ、同じなら、その中のナノ秒を比べます。
- **`switch` の形**: 条件の順に、`-1`、`+1` を返し、どれでもなければ `0` を返します。

## 何をしているか

### 1. 単調時計があれば、それで比べる

```go:line-numbers=294
	if t.wall&u.wall&hasMonotonic != 0 {
		tc, uc = t.ext, u.ext
	} else {
```

両方の時刻に単調時計の情報があれば、その値 `ext` で比べます。単調時計は、時刻の変更に左右されないので、より確実な比較ができます。

### 2. なければ秒、次にナノ秒で比べる

```go:line-numbers=297
		tc, uc = t.sec(), u.sec()
		if tc == uc {
			tc, uc = int64(t.nsec()), int64(u.nsec())
		}
	}
```

単調時計がなければ、まず秒を比べます。秒が同じなら、ナノ秒を比べます。どちらの場合も、比べる値を `tc` と `uc` に入れます。

### 3. 結果を -1、0、+1 で返す

```go:line-numbers=302
	switch {
	case tc < uc:
		return -1
	case tc > uc:
		return +1
	}
	return 0
```

`tc` が `uc` より小さければ `-1`、大きければ `+1`、同じなら `0` を返します。この形は、並べ替えの比較関数と同じ約束です。

## ここがすごい

- **比べる値を 1 つにまとめる**: 単調時計、秒、ナノ秒のどれを使うかを、最初に決めるだけです。最後の比べ方は、どの場合も同じです。
- **比較関数の形に合わせる**: `-1`、`0`、`+1` の返し方は、`slices.SortFunc` などにそのまま使えます。時刻の並べ替えが簡単に書けます。
- **単調時計を優先**: 時刻の調整があっても、前後関係を正しく保てるように、単調時計を優先しています。

## まとめ

- `Compare` は、2 つの時刻の前後を、`-1`、`0`、`+1` で返します。
- 両方に単調時計があれば、その値で比べます。
- 単調時計がなければ、秒を比べ、同じならナノ秒を比べます。
- 並べ替えの比較関数としてそのまま使えます。
