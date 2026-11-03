---
title: "名前・オフセット・夏時間の三つが一致する時間帯の番号を探す findZone"
description: "time パッケージの findZone。時間帯の一覧から、名前、オフセット、夏時間かどうかが全て一致する要素の番号を返す。見つからなければ -1 を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo_read.go"
lines: [356, 363]
function: "findZone"
difficulty: 1
tags: [日時, アルゴリズム]
---

## ひとことで

`findZone(zones, name, offset, isDST)` は、時間帯の一覧から、三つの条件が全て一致する要素を探します。見つかれば、その番号を返します。見つからなければ `-1` を返します。

## コード

```go:line-numbers=356
func findZone(zones []zone, name string, offset int, isDST bool) int {
	for i, z := range zones {
		if z.name == name && z.offset == offset && z.isDST == isDST {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **時間帯（zone）**: ある地域で使う時刻の名前と、UTC からのずれ（オフセット）、夏時間かどうかの組です。
- **夏時間（DST）**: 夏の間だけ時計を進める決まりです。同じ名前とオフセットでも、夏時間かどうかで別の時間帯になります。
- **線形探索**: 先頭から順に比べて、最初に一致したものを探す方法です。

## 何をしているか

### 1. 先頭から順に比べる

```go:line-numbers=357
	for i, z := range zones {
		if z.name == name && z.offset == offset && z.isDST == isDST {
			return i
		}
	}
```

一覧を先頭から一つずつ見ます。名前、オフセット、夏時間の三つが全て一致したら、その番号 `i` を返します。`&&` で繋いでいるので、一つでも違えば次の要素へ進みます。

### 2. 見つからなければ -1 を返す

```go:line-numbers=362
	return -1
```

最後まで一致がなければ、`-1` を返します。`-1` は、番号として使えない値なので、見つからなかったことを表せます。

## ここがすごい

- **三つを一緒に比べる**: 名前だけでは区別できない時間帯を、オフセットと夏時間で区別できます。
- **-1 で失敗を表す**: 番号の範囲外の値を、見つからなかった印に使うので、別の戻り値を増やさずに済みます。

## まとめ

- `findZone` は、三つの条件が全て一致する時間帯の番号を探します。
- 見つからなければ `-1` を返します。
- 一覧を先頭から順に調べる、単純な方法です。
