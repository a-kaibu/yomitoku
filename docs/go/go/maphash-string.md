---
title: "長い文字列を分割してハッシュする maphash.String。途中の状態を引き継ぐ"
description: "文字列のハッシュを求める maphash.String。バッファより長い文字列を、一定の長さずつ切って、前の結果を状態として次へ渡していく。シードを使うので、同じ値でも実行ごとに変わる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2019 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/hash/maphash/maphash.go"
lines: [73, 83]
function: "String"
difficulty: 3
tags: [ハッシュ, 文字列処理, 並行処理]
---

## ひとことで

`maphash.String(seed, s)` は、文字列 `s` の 64 ビットのハッシュ値を返します。同じ `seed` の中では、同じ文字列には同じ値が返ります。`seed` は、`maphash.MakeSeed()` で作る乱数の種で、プロセスごとに違う値になります。

ハッシュは、map のキーを振り分けるための値です。攻撃者がハッシュの衝突を狙えないように、種を毎回ランダムに変えています。

## コード

```go:line-numbers=73
func String(seed Seed, s string) uint64 {
	state := seed.s
	if state == 0 {
		panic("maphash: use of uninitialized Seed")
	}
	for len(s) > bufSize {
		state = rthashString(s[:bufSize], state)
		s = s[bufSize:]
	}
	return rthashString(s, state)
}
```

## 前提知識

- **ハッシュ関数**: 任意の長さのデータを、固定長の数値（ここでは 64 ビット）に変換する関数です。同じ入力には同じ出力を返します。
- **シード（種）**: ハッシュの計算の初期値です。種が違うと、同じ入力でも違う結果になります。
- **ハッシュ衝突攻撃**: 同じ値になるように大量のキーを作り、map の性能を落とす攻撃です。種をランダムにすると、この攻撃を難しくできます。
- **未初期化の Seed**: `seed.s` が 0 のままの値は、まだ初期化されていない種です。

## 何をしているか

### 1. 未初期化の種を拒否する

```go:line-numbers=74
	state := seed.s
	if state == 0 {
		panic("maphash: use of uninitialized Seed")
	}
```

種の状態 `state` を取り出します。0 のままなら、`MakeSeed` で初期化されていない値です。そのまま使うとハッシュの性質が保証されないので、`panic` で止めます。

### 2. 長い文字列を分割して状態を渡す

```go:line-numbers=78
	for len(s) > bufSize {
		state = rthashString(s[:bufSize], state)
		s = s[bufSize:]
	}
```

文字列が `bufSize` より長い間は、先頭の `bufSize` バイトだけをハッシュします。結果の `state` を次の計算の初期値に使い、文字列の残りに進みます。前の結果を次に引き継ぐので、分割しても全体が 1 つのハッシュになります。

### 3. 残りを最後にハッシュする

```go:line-numbers=82
	return rthashString(s, state)
```

`bufSize` 以下になった残りを、最後にハッシュして結果とします。

## ここがすごい

- **分割しても一つの値になる**: 途中の状態を引き継ぐことで、長い文字列を一度に扱えないような場合でも、全体のハッシュが作れます。
- **未初期化の種を弾く**: 種が正しくないまま使われると、攻撃に弱くなります。`panic` で早く見つけられるようにしています。
- **ハッシュの処理を 1 か所に**: 実際の計算は `rthashString` にまかせ、この関数は分割の制御だけを担当します。役割が明確です。

## まとめ

- `maphash.String` は、文字列のハッシュを、シードを使って計算します。
- 長い文字列は `bufSize` ずつ切って、途中の状態を次へ渡します。
- 種が初期化されていなければ、`panic` で止めます。
- 種がランダムなので、ハッシュ衝突を狙った攻撃を防げます。
