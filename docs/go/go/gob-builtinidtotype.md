---
title: "組み込みの型の番号から型を引く gob の builtinIdToType。利用者の型とは別の配列を見る"
description: "encoding/gob の builtinIdToType。組み込みの型（int や string など）の番号から、対応する型の情報を取り出す。利用者が定義した型の一覧とは別の配列を使い、範囲外の番号には nil を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [190, 195]
function: "builtinIdToType"
difficulty: 1
tags: [型システム, 防御的プログラミング, データ構造]
---

## ひとことで

`builtinIdToType(id)` は、組み込みの型の番号から、その型の情報を返します。組み込みの型とは、`int`、`string`、`bool` などの、Go が最初から持っている型のことです。

gob には、利用者が定義した型と、組み込みの型の二種類の番号があります。組み込みの番号は、別の配列にまとめられているので、この関数はその配列を見ます。

## コード

```go:line-numbers=190
func builtinIdToType(id typeId) gobType {
	if id < 0 || int(id) >= len(builtinIdToTypeSlice) {
		return nil
	}
	return builtinIdToTypeSlice[id]
}
```

## 前提知識

- **組み込みの型**: Go が最初から用意している型です。gob では、番号を先に決めて、常に同じ番号で扱えるようにしています。
- **`builtinIdToTypeSlice`**: 組み込みの型の情報を、番号を添字として並べた配列です。
- **`idToType`**: 利用者の型を含む、すべての型を番号から引く関数です。考え方は同じですが、見る配列が違います。
- **範囲外の番号**: 配列にない番号です。対応する型がないので、`nil` を返します。

## 何をしているか

### 1. 範囲外の番号を弾く

```go:line-numbers=191
	if id < 0 || int(id) >= len(builtinIdToTypeSlice) {
		return nil
	}
```

番号が負か、組み込みの配列の長さ以上なら、組み込みの型ではありません。`nil` を返します。

### 2. 組み込みの配列から取り出す

```go:line-numbers=194
	return builtinIdToTypeSlice[id]
```

範囲内なら、組み込みの配列から、番号に対応する型の情報を取り出して返します。

## ここがすごい

- **二つの配列を分ける**: 組み込みの型と利用者の型を別々の配列にすることで、組み込みの番号を固定したまま、利用者の型を増やせます。
- **考え方を揃える**: 範囲の確認と、番号による読み出しは、`idToType` と同じです。読む側が一度理解すれば、両方を読めます。
- **存在しない番号は安全に扱う**: 範囲外なら `nil` を返すので、不正な番号で配列を壊すことがありません。

## まとめ

- `builtinIdToType` は、組み込みの型の番号から型の情報を取り出します。
- 組み込みの型は、利用者の型とは別の配列にあります。
- 範囲外の番号には `nil` を返します。
