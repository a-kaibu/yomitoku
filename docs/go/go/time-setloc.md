---
title: "時刻の場所を設定する time の setLoc。UTC は nil で表す"
description: "time パッケージの Time.setLoc。時刻 t の場所を設定する。場所が UTC なら nil として持つ。設定の前に単調時計の値を取り除く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [217, 223]
function: "setLoc"
difficulty: 2
tags: [日時, データ構造]
---

## ひとことで

`t.setLoc(loc)` は、時刻 `t` の場所を `loc` に設定します。UTC のときは、特別な値 `nil` として持ちます。

## コード

```go:line-numbers=217
func (t *Time) setLoc(loc *Location) {
	if loc == &utcLoc {
		loc = nil
	}
	t.stripMono()
	t.loc = loc
}
```

## 前提知識

- **Location**: 時刻が、どの地域の時間で表されるかを示す型です。タイムゾーンに当たります。
- **UTC**: 世界の基準になる時刻です。`time` パッケージでは、UTC の場所を `utcLoc` という変数で持っています。
- **単調時計の値**: 時刻の差を測るための値です。場所を変えるときは、この値を取り除いておきます。

## 何をしているか

### 1. UTC なら nil に置き換える

```go:line-numbers=218
	if loc == &utcLoc {
		loc = nil
	}
```

渡された `loc` が UTC の場所なら、`nil` に置き換えます。`nil` は、UTC の意味で使う約束になっています。そのため、UTC の場所を持つ時刻が、同じ値になります。

### 2. 単調時計の値を取り除く

```go:line-numbers=221
	t.stripMono()
```

場所を設定する前に、単調時計の値を取り除きます。

### 3. 場所を持たせる

```go:line-numbers=222
	t.loc = loc
```

最後に、`loc` を `t` の場所として持たせます。

## ここがすごい

- **特別な値で UTC を表す**: UTC は `nil` で持つので、よく使われる場所を一つの値で扱えます。
- **順番が大切**: 単調時計の値を先に取り除くので、場所を変えた後に古い値が残りません。

## まとめ

- `setLoc` は、時刻の場所を設定します。
- UTC の場所は `nil` として持ちます。
- 設定の前に、単調時計の値を取り除きます。
