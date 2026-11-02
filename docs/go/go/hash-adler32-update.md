---
title: "Adler-32 の値を一括で更新する adler32.update"
description: "hash/adler32 の update は、現在のダイジェストに新しいバイト列を加えて、Adler-32 の値を更新します。SIMD が使えて長さが十分なら専用の処理に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/hash/adler32/adler32.go"
lines: [87, 92]
function: "update"
difficulty: 2
format: 2
tags: [ハッシュ, 最適化, 標準ライブラリ]
---

## ひとことで

`adler32.New()` で作ったハッシュに `Write` でデータを渡すと、内部では `update` が Adler-32 の値を更新します。長いデータは、まとめて計算する専用の道を通ります。

## コード

```go:line-numbers=87
func update(d digest, p []byte) digest {
	if haveSIMD && len(p) >= minSIMD {
		return updateSIMD(d, p)
	}
	return updateGeneric(d, p)
}
```

## 前提知識

- **Adler-32**: 2 つの合計値を使う、軽量な検査値の計算方法です。zlib の形式で使われます。
- **ダイジェスト**: 途中までの計算結果を持つ値です。新しいデータを足すと、結果が更新されます。
- **SIMD**: 1 命令で複数のデータを同時に処理する仕組みです。長いデータで効果が出ます。
- **`minSIMD`**: SIMD の道を使う最小の長さです。短いデータでは、準備の手間の方が大きくなります。

## 何をしているか

### 1. 長いデータは専用の道を使う

```go:line-numbers=88
	if haveSIMD && len(p) >= minSIMD {
		return updateSIMD(d, p)
```

SIMD が使え、データが `minSIMD` 以上なら、`updateSIMD` に任せます。大量のデータを速く処理できます。

### 2. それ以外は一般の処理を使う

```go:line-numbers=91
	return updateGeneric(d, p)
```

条件を満たさないときは、`updateGeneric` で 1 バイトずつ処理します。結果は、専用の道と同じになるように作られています。

## ここがすごい

- **条件で道を選ぶ**: 速い道と一般の道を、長さと環境で切り替えます。
- **結果は同じ**: どちらの道を通っても、同じ検査値になります。
- **状態を引き継げる**: ダイジェストを受け取って返すので、データを分けて渡しても、一度に渡したのと同じ結果になります。

## まとめ

- SIMD が使え、データが十分長ければ、専用の処理に任せる。
- そうでなければ、一般の処理で計算する。
- どちらの道でも、結果は同じになる。
