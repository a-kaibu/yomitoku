---
title: "候補の一覧から文字列の先頭に一致するものを探す time の lookup"
description: "time パッケージの lookup。候補の文字列の配列から、入力の先頭に一致するものを順に探す。見つかれば、その番号と残りの文字列を返し、見つからなければエラーを返す。時刻の書式の、月の名前や曜日の名前を読むときに使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [406, 413]
function: "lookup"
difficulty: 2
tags: [文字列処理, パース, 日時]
---

## ひとことで

`lookup(tab, val)` は、候補の並び `tab` の中から、`val` の先頭に一致するものを探します。例えば `tab` が月の略称の一覧で、`val` が `"Feb 3"` なら、`Feb` を見つけて、番号 1 と残りの `" 3"` を返します。

時刻の書式を読むときは、「`Jan`」「`Feb`」のような名前を、1 つずつ探して番号に変える必要があります。この関数は、その探索を担当します。

## コード

```go:line-numbers=406
func lookup(tab []string, val string) (int, string, error) {
	for i, v := range tab {
		if len(val) >= len(v) && match(val[:len(v)], v) {
			return i, val[len(v):], nil
		}
	}
	return -1, val, errBad
}
```

## 前提知識

- **候補の配列（tab）**: 探したい文字列の一覧です。月の名前の配列などが使われます。
- **先頭の一致**: 入力の最初の部分が、候補と同じかを調べることです。残りの部分は、後の処理のために返します。
- **`match`**: 2 つの文字列を比べる内部の関数です。この関数では、候補の長さ分だけ切り出した部分と比べます。
- **`errBad`**: 書式が合わないときのエラーです。

## 何をしているか

### 1. 候補を順に調べる

```go:line-numbers=407
	for i, v := range tab {
		if len(val) >= len(v) && match(val[:len(v)], v) {
			return i, val[len(v):], nil
		}
	}
```

候補を先頭から 1 つずつ取り出します。入力 `val` が候補 `v` より長く、先頭の `len(v)` 文字が `v` と一致したら、その番号 `i` と、残りの文字列 `val[len(v):]` を返します。

長さの判定を先に書くことで、入力が短いときに範囲外を読むことを防ぎます。

### 2. 見つからなければエラーを返す

```go:line-numbers=412
	return -1, val, errBad
```

どの候補にも一致しなければ、番号 `-1` とエラー `errBad` を返します。入力 `val` は、読まずに元の値のまま返されます。

## ここがすごい

- **残りを一緒に返す**: 一致した部分だけでなく、残りの文字列も返すので、呼び出し側は続けて次の要素を読めます。
- **先頭だけを比べる**: 候補の全体の長さで切るので、無関係な部分を比べずに済みます。
- **番号で結果を表す**: 名前そのものではなく、番号を返すので、月や曜日の値として直接使えます。

## まとめ

- `lookup` は、候補の並びから先頭が一致するものを探します。
- 一致したときは、番号と残りの文字列を返します。
- 見つからなければ、`-1` と `errBad` を返します。
