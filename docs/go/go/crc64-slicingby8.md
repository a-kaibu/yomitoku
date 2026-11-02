---
title: "8 個の表を重ねて、1 バイトずつを 8 バイト分まとめて計算する"
description: "hash/crc64 の slicing-by-8 の表を作る makeSlicingBy8Table。1 バイトずつ前の表を参照して、8 つの表を作っておき、8 バイトを一度に計算できるようにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/hash/crc64/crc64.go"
lines: [74, 85]
function: "makeSlicingBy8Table"
difficulty: 3
tags: [ハッシュ, 最適化, アルゴリズム]
---

## ひとことで

CRC（巡回冗長検査）は、データが壊れていないかを確かめるための値を計算する方法です。普通は 1 バイトずつ表を引いて計算しますが、`makeSlicingBy8Table` は **8 枚の表を作って、8 バイト分を同時に計算できる** ようにします。`hash/crc64` はこの表を使い、大きなデータを速く処理します。

## コード

```go:line-numbers=74
func makeSlicingBy8Table(t *Table) *[8]Table {
	var helperTable [8]Table
	helperTable[0] = *t
	for i := 0; i < 256; i++ {
		crc := t[i]
		for j := 1; j < 8; j++ {
			crc = t[crc&0xff] ^ (crc >> 8)
			helperTable[j][i] = crc
		}
	}
	return &helperTable
}
```

## 前提知識

- **CRC**: データを多項式で割った余りを求める、誤り検出の方法です。`crc64` は、64 ビットの値を作ります。
- **表（テーブル）を使う CRC**: 1 バイトごとの結果をあらかじめ 256 個計算しておき、その表を引いて次の状態を求める方法です。
- **XOR（排他的論理和）`^`**: 2 つのビットが違うときだけ 1 になる演算です。CRC の計算の中心になります。
- **`helperTable[j][i]`**: 8 枚の表の `j` 番目の表の `i` 番目の要素です。`j` が大きいほど、後ろのバイトの影響を表します。

## 何をしているか

### 1. 1 枚目は元の表をそのまま使う

```go:line-numbers=76
	helperTable[0] = *t
```

1 枚目の表は、元の 1 バイト用の表です。ここを土台にして、残りの 7 枚を作ります。

### 2. 前の表の結果を次の表として使う

```go:line-numbers=78
		crc := t[i]
		for j := 1; j < 8; j++ {
			crc = t[crc&0xff] ^ (crc >> 8)
			helperTable[j][i] = crc
		}
```

`crc` は、今の `i` での 1 枚目の値から始まります。`t[crc&0xff]` で、下位 1 バイトを使って表を引き、結果を `crc >> 8` と XOR します。その値を `helperTable[j][i]` に保存します。

この処理は、「1 バイト分進んだあとの値」を、j 枚目の表として作る意味があります。j 枚目の表は、「8 バイトのうち、j バイト前にあったものの影響」を含むことになります。

### 3. 8 枚をまとめて返す

```go:line-numbers=84
	return &helperTable
```

作った 8 枚の表を、ポインタで返します。`hash/crc64` は、この表を使って、8 バイトの入力を 8 つの表の結果の XOR で一度に求めます。

## ここがすごい

- **1 バイトずつの依存を分解する**: CRC は本来、前のバイトの結果に次のバイトを足す形で計算されます。表を 8 枚用意すると、8 バイト分の影響を並列に足せるようになります。
- **初期化に 1 回だけ時間をかける**: 8 枚の表を作るのは、プログラムの起動時に 1 回だけです。その後は、大量のデータを速く計算できます。
- **同じ表の構造を再利用**: 1 枚目から残りを機械的に作るので、少ないコードで、8 枚の表が揃います。

## まとめ

- CRC は、1 バイトずつ表を引いて計算するのが基本です。
- 8 枚の表を作っておくと、8 バイトを同時に扱えます。
- 1 枚目は元の表で、2 枚目以降は前の表の結果を次の表として作ります。
- 初期化は 1 回だけで、以降の計算が速くなります。
