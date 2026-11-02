---
title: "CRC-32 の計算を、表の種類に応じて振り分ける hash/crc32 の update"
description: "hash/crc32 の update。Castagnoli 表なら専用の高速版、IEEE 表なら初期化を確かめてから IEEE の専用版、それ以外は汎用の表で計算する。表によって使う実装を切り替える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/hash/crc32/crc32.go"
lines: [202, 214]
function: "update"
difficulty: 2
tags: [ハッシュ, 最適化, 設計パターン]
---

## ひとことで

`crc32.Update` や `crc32.ChecksumIEEE` は、データの CRC-32 を計算します。CRC の値は、どの多項式（表）を使うかで変わります。`update` は、渡された表の種類を見て、最も速い実装に振り分ける関数です。

Castagnoli（CRC-32C）や IEEE は、CPU の命令を使う専用の実装があるので、それを優先します。

## コード

```go:line-numbers=202
func update(crc uint32, tab *Table, p []byte, checkInitIEEE bool) uint32 {
	switch {
	case haveCastagnoli.Load() && tab == castagnoliTable:
		return updateCastagnoli(crc, p)
	case tab == IEEETable:
		if checkInitIEEE {
			ieeeInitOnce()
		}
		return updateIEEE(crc, p)
	default:
		return simpleUpdate(crc, tab, p)
	}
}
```

## 前提知識

- **多項式の表（Table）**: CRC の計算に使う、256 個の値の表です。表が違うと、同じデータでも結果が違います。
- **IEEE と Castagnoli**: CRC-32 には、よく使われる 2 つの多項式があります。IEEE は zip や gzip などで、Castagnoli は iSCSI などで使われます。
- **`haveCastagnoli`**: CPU が専用の命令を持っているかを表すフラグです。持っていれば、その命令を使えます。
- **`ieeeInitOnce`**: IEEE の専用の実装を、初めて使うときに 1 回だけ準備する処理です。

## 何をしているか

### 1. Castagnoli の専用実装を使う

```go:line-numbers=204
	case haveCastagnoli.Load() && tab == castagnoliTable:
		return updateCastagnoli(crc, p)
```

CPU が対応していて、表が Castagnoli なら、その専用の関数 `updateCastagnoli` を使います。`Load` で、CPU の対応を並行に安全に読みます。

### 2. IEEE は初期化を確かめてから計算する

```go:line-numbers=206
	case tab == IEEETable:
		if checkInitIEEE {
			ieeeInitOnce()
		}
		return updateIEEE(crc, p)
```

表が IEEE なら、必要なら `ieeeInitOnce` で準備を済ませてから、`updateIEEE` で計算します。`checkInitIEEE` は、準備の確認を省けるかどうかを指定します。すでに準備が済んでいる呼び出しでは、この確認を飛ばせます。

### 3. それ以外は汎用の表で計算する

```go:line-numbers=212
		return simpleUpdate(crc, tab, p)
```

どちらでもない表は、表を 1 バイトずつ引く汎用の `simpleUpdate` で計算します。遅いですが、どんな表でも正しく動きます。

## ここがすごい

- **速さを利用者に意識させない**: 呼び出し側は、表を渡すだけです。最も速い実装が、自動的に選ばれます。
- **初期化の遅延**: IEEE の準備は、本当に必要になるまで行いません。使わないプログラムでは、その費用を払わずに済みます。
- **汎用の道を残す**: 専用の実装がない表でも、同じ関数で計算できます。専用化が、機能を狭めていません。

## まとめ

- `update` は、表の種類と CPU の対応に応じて、計算の実装を選びます。
- Castagnoli は、対応する CPU なら専用の命令を使います。
- IEEE は、必要なときだけ準備をしてから、専用の実装を使います。
- それ以外は、汎用の表で計算します。
