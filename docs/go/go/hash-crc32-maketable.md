---
title: "多項式から CRC-32 の表を作る crc32.MakeTable"
description: "hash/crc32 の MakeTable は、指定した多項式に対応する計算用の表を返します。標準の多項式なら、事前に作った表をそのまま使い、それ以外は表を新しく作ります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/hash/crc32/crc32.go"
lines: [122, 133]
function: "MakeTable"
difficulty: 2
format: 2
tags: [ハッシュ, 最適化, 標準ライブラリ]
---

## ひとことで

`crc32.MakeTable(crc32.IEEE)` は、よく使われる IEEE の多項式の表を返します。CRC の計算で、1 バイトごとに使う表です。

## コード

```go:line-numbers=122
func MakeTable(poly uint32) *Table {
	switch poly {
	case IEEE:
		ieeeInitOnce()
		return IEEETable
	case Castagnoli:
		castagnoliInitOnce()
		return castagnoliTable
	default:
		return simpleMakeTable(poly)
	}
}
```

## 前提知識

- **CRC-32**: データの誤りを見つけるための検査値です。多項式で割った余りを、ビットの演算で求めます。
- **多項式**: 検査値の計算に使う数で、用途ごとに決まったものがあります。`IEEE` と `Castagnoli` は、よく使われる 2 つです。
- **計算用の表**: 1 バイトごとの結果を前もって作っておく表です。毎回の計算が速くなります。
- **`sync.Once` 的な初期化**: 最初の 1 回だけ表を作る方法です。`ieeeInitOnce` などが、この役割を担います。

## 何をしているか

### 1. IEEE の多項式は共通の表を使う

```go:line-numbers=124
	case IEEE:
		ieeeInitOnce()
		return IEEETable
```

`IEEE` のときは、`ieeeInitOnce` で表を一度だけ用意し、共通の `IEEETable` を返します。何度呼んでも、同じ表が使われます。

### 2. Castagnoli も同じように扱う

```go:line-numbers=127
	case Castagnoli:
		castagnoliInitOnce()
		return castagnoliTable
```

`Castagnoli` の多項式も、同じ考え方です。初期化を一度だけ行い、共通の表を返します。

### 3. それ以外は新しい表を作る

```go:line-numbers=130
	default:
		return simpleMakeTable(poly)
```

標準の 2 つ以外の多項式は、`simpleMakeTable` で表を新しく作ります。その表は、呼び出し側が使う分だけ作られます。

## ここがすごい

- **よく使う表を共有する**: 標準の多項式では、表を作り直さず、全体で同じものを使えます。
- **初期化を遅らせる**: 使われるまで表を作らないので、起動の時間が短くなります。
- **任意の多項式にも対応する**: 標準外の多項式でも、表を作れば同じ計算ができます。

## まとめ

- 標準の多項式は、一度だけ作った共通の表を返す。
- 初期化は、必要になったときに 1 回だけ行う。
- それ以外の多項式は、その場で表を作って返す。
