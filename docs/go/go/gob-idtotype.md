---
title: "型の番号から型の情報を引く gob の idToType。範囲外の番号は nil を返す"
description: "encoding/gob の idToType。型の番号 id を受け取り、登録された型の一覧の配列から対応する型を取り出す。番号が配列の範囲の外なら、型がないことを表す nil を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [183, 188]
function: "idToType"
difficulty: 1
tags: [型システム, 防御的プログラミング, データ構造]
---

## ひとことで

`idToType(id)` は、gob の型の番号 `id` から、その型の情報を返します。型の情報は、番号を添字とする配列に並んでいるので、番号で直接取り出せます。

番号が配列の範囲の外なら、対応する型はありません。その場合は、`nil` を返して、見つからなかったことを伝えます。

## コード

```go:line-numbers=183
func idToType(id typeId) gobType {
	if id < 0 || int(id) >= len(idToTypeSlice) {
		return nil
	}
	return idToTypeSlice[id]
}
```

## 前提知識

- **型の番号（typeId）**: gob が型を区別するための整数です。登録された順に、0 から番号が振られます。
- **`idToTypeSlice`**: 番号を添字として、型の情報を並べた配列です。番号と配列の位置が一致します。
- **`gobType`**: gob の型の情報を表すインターフェースです。
- **`nil`**: 値が存在しないことを表す特別な値です。インターフェースや、ポインタのときに使われます。

## 何をしているか

### 1. 範囲外の番号を弾く

```go:line-numbers=184
	if id < 0 || int(id) >= len(idToTypeSlice) {
		return nil
	}
```

番号が負か、配列の長さ以上なら、対応する型はありません。`nil` を返して終わります。配列の外を読むことを避けます。

### 2. 番号で直接取り出す

```go:line-numbers=187
	return idToTypeSlice[id]
```

範囲内なら、番号を添字として、配列から型の情報を取り出して返します。探す処理は不要で、一回の読み出しで済みます。

## ここがすごい

- **番号がそのまま場所になる**: 型の番号と配列の添字を同じにしているので、探す手間がかかりません。配列の読み出しだけで、型が決まります。
- **範囲を先に確かめる**: 読む前に範囲を確かめるので、不正な番号が来ても、プログラムは止まりません。
- **見つからないを値で表す**: 存在しないときは `nil` を返すので、呼び出し側は、その値の有無で判断できます。

## まとめ

- `idToType` は、型の番号から型の情報を取り出します。
- 番号は配列の添字として使い、探す処理は要りません。
- 範囲外の番号には `nil` を返します。
