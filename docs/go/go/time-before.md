---
title: "ある時刻が別の時刻より前かを比べる time.Time.Before"
description: "time.Time.Before は、ある時刻が別の時刻より前かを返します。両方に単調時計の値があればそれで比べ、無ければ秒とナノ秒で比べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [281, 288]
function: "Before"
difficulty: 2
format: 2
tags: [日時, 標準ライブラリ, 数値計算]
---

## ひとことで

`t.Before(deadline)` は、`t` が `deadline` より前の時刻なら `true` を返します。期限切れの判定などで、よく使われます。

## コード

```go:line-numbers=281
func (t Time) Before(u Time) bool {
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext < u.ext
	}
	ts := t.sec()
	us := u.sec()
	return ts < us || ts == us && t.nsec() < u.nsec()
}
```

## 前提知識

- **単調時計**: 時刻の調整に影響されず、常に進む時計の値です。両方が持つときは、その値で比べると確実です。
- **`hasMonotonic`**: 単調時計の値が入っていることを表すビットです。
- **`sec` と `nsec`**: 時刻の秒とナノ秒の部分を取り出す関数です。
- **`&&` と `||` の順序**: `&&` は `||` より先に評価されます。`ts < us || ts == us && ...` は、「秒が小さい、または秒が同じでナノ秒が小さい」という意味です。

## 何をしているか

### 1. 両方に単調時計があれば比べる

```go:line-numbers=282
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext < u.ext
	}
```

両方が単調時計を持つなら、その値を直接比べます。時刻の修正があっても、経過の順序は崩れません。

### 2. 秒を取り出して比べる

```go:line-numbers=285
	ts := t.sec()
	us := u.sec()
```

単調時計が使えないときは、それぞれの秒を取り出して比べます。

### 3. 秒が同じならナノ秒で比べる

```go:line-numbers=287
	return ts < us || ts == us && t.nsec() < u.nsec()
```

秒が小さければ前です。秒が同じときは、ナノ秒の小さい方が前です。

## ここがすごい

- **比較の道を分ける**: 単調時計が使えるときは、速くて確実な比べ方を選べます。
- **2 段階の比較で正しく並べる**: 秒とナノ秒を分けても、大小の順序が正しく求まります。
- **`After` と対になる**: 「後か」を判定する `After` と並べて読むと、比べ方が対称になっていることが分かります。

## まとめ

- 両方に単調時計があれば、その値で比べる。
- 無ければ、秒とナノ秒を順に比べる。
- `After` と対になって、時刻の前後を判定する。
