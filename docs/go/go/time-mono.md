---
title: "単調時計の値を返す time の mono。印がなければ 0 を返す"
description: "time パッケージの Time.mono。時刻に単調時計の値が入っているかを、wall の印で調べる。入っていれば ext の値を返し、入っていなければ 0 を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [253, 258]
function: "mono"
difficulty: 1
tags: [日時, ビット演算, 防御的プログラミング]
---

## ひとことで

`t.mono()` は、時刻に入っている単調時計の値を返します。単調時計の値が入っていなければ、`0` を返します。

前の記事で見たとおり、`ext` は、印の有無で意味が変わります。この関数は、印を見てから、`ext` を読むかどうかを決めます。

## コード

```go:line-numbers=253
func (t *Time) mono() int64 {
	if t.wall&hasMonotonic == 0 {
		return 0
	}
	return t.ext
}
```

## 前提知識

- **単調時計の値**: 時間の差を測るための、変わらずに進む値です。
- **`hasMonotonic` の印**: `wall` に立つビットです。立っていれば、`ext` は単調時計の値です。
- **`0` の意味**: 単調時計が入っていないことを、`0` で表します。ただし、この関数の利用者は、印の有無を別に確かめることもできます。

## 何をしているか

### 1. 印がなければ 0 を返す

```go:line-numbers=254
	if t.wall&hasMonotonic == 0 {
		return 0
	}
```

印のビットが立っていなければ、`ext` は秒を表しています。単調時計の値ではないので、`0` を返します。

### 2. 印があれば ext を返す

```go:line-numbers=257
	return t.ext
```

印があるときは、`ext` が単調時計の値です。そのまま返します。

## ここがすごい

- **読む前に意味を確かめる**: 同じ欄を、意味の違う値として読まないように、印を先に見ます。
- **空の値を 0 で表す**: 単調時計がないときに、特別な欄を用意せず、`0` で表します。
- **二つの関数で対になる**: `setMono` が書き込み、`mono` が読み出します。同じ印の規則で、両方が動きます。

## まとめ

- `mono` は、単調時計の値を返します。
- 印がなければ、`0` を返します。
- 印を先に見てから `ext` を読むので、秒と単調時計を取り違えません。
