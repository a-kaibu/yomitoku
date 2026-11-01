---
title: "時刻が後かを比べる time.Time.After"
description: "time.Time.After は、ある時刻が別の時刻より後かを返します。両方に単調時計の値があればそれで比べ、無ければ秒とナノ秒で比べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [271, 278]
function: "After"
difficulty: 2
format: 2
tags: [日時, 標準ライブラリ, 数値計算]
---

## ひとことで

`t.After(deadline)` は、`t` が `deadline` より後の時刻なら `true` を返します。時刻の大小を、ひとつの比較で求めるための関数です。

## コード

```go:line-numbers=271
func (t Time) After(u Time) bool {
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext > u.ext
	}
	ts := t.sec()
	us := u.sec()
	return ts > us || ts == us && t.nsec() > u.nsec()
}
```

## 前提知識

- **壁時計と単調時計**: `Time` は、人が読む時刻と、経過時間を正しく測る単調時計の値の両方を持つことがあります。
- **`hasMonotonic`**: 単調時計の値が入っていることを表すビットです。
- **`wall` と `ext`**: `Time` の内部の欄です。`ext` には、単調時計の値、または秒の値が入ります。
- **`sec` と `nsec`**: 秒とナノ秒の部分を取り出す関数です。

## 何をしているか

### 1. 両方に単調時計があれば、それで比べる

```go:line-numbers=272
	if t.wall&u.wall&hasMonotonic != 0 {
		return t.ext > u.ext
	}
```

両方の `Time` に単調時計の値があれば、`ext` の値をそのまま比べます。単調時計は、壁時計の調整（NTP による修正など）の影響を受けないので、経過時間の比較に向いています。

### 2. 秒を比べる

```go:line-numbers=275
	ts := t.sec()
	us := u.sec()
```

単調時計が使えないときは、それぞれの秒を取り出します。

### 3. 秒が同じならナノ秒で比べる

```go:line-numbers=277
	return ts > us || ts == us && t.nsec() > u.nsec()
```

秒が大きければ後ろです。秒が同じなら、ナノ秒を比べます。`||` と `&&` の順序で、「秒が大きい、または秒が同じでナノ秒が大きい」と読めます。

## ここがすごい

- **比較の道を切り替える**: 単調時計が使えるときは、速くて安定した比べ方を使います。
- **秒とナノ秒を分けて比べる**: 数の範囲が大きくなっても、2 段階の比較で正しい大小が分かります。
- **同じ関数で両方を扱う**: 利用者は、どちらの形式の `Time` かを気にせずに比べられます。

## まとめ

- 両方に単調時計があれば、その値で比べる。
- なければ、秒とナノ秒を順に比べる。
- 比較の道を切り替えても、結果の意味は変わらない。
