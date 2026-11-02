---
title: "構造体のフィールドの番号をたどって型を求める typeByIndex。ポインタは一段ずつはずす"
description: "encoding/json の typeByIndex。構造体の型から、フィールドの番号の並び（入れ子を含む）をたどり、最後のフィールドの型を返す。途中でポインタ型なら、その中身の型に変えてからフィールドを見る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [958, 966]
function: "typeByIndex"
difficulty: 2
tags: [型システム, リフレクション, データ構造]
---

## ひとことで

`typeByIndex(t, index)` は、構造体の型 `t` から、フィールドの番号の並び `index` をたどって、最後のフィールドの型を返します。入れ子の構造体の中にあるフィールドも、この番号の並びで表せます。

例えば `index` が `[0, 2]` なら、最初のフィールドの型の中の、三番目のフィールドの型を返します。

## コード

```go:line-numbers=958
func typeByIndex(t reflect.Type, index []int) reflect.Type {
	for _, i := range index {
		if t.Kind() == reflect.Pointer {
			t = t.Elem()
		}
		t = t.Field(i).Type
	}
	return t
}
```

## 前提知識

- **フィールドの番号**: 構造体の中で、何番目の項目かを表す整数です。`t.Field(i)` で、その項目を取り出せます。
- **埋め込まれた構造体**: 別の構造体を、フィールドの中に入れた形です。番号の並びで、その奥のフィールドを指せます。
- **ポインタ型**: 別の型を指す型です。フィールドを見るには、先に中身の型を取り出す必要があります。
- **`reflect.Pointer`**: ポインタの種類を表す値です。`t.Kind()` で、その種類を調べられます。

## 何をしているか

### 1. 番号を一つずつたどる

```go:line-numbers=959
	for _, i := range index {
```

番号の並びを、先頭から順に取り出します。一つの番号が、今いる構造体の中のフィールドを指します。

### 2. ポインタなら中身の型に変える

```go:line-numbers=960
		if t.Kind() == reflect.Pointer {
			t = t.Elem()
		}
```

今の型がポインタなら、その中身の型に変えます。フィールドは、構造体そのものにあるので、ポインタのままではフィールドを見られないからです。

### 3. フィールドの型に進む

```go:line-numbers=963
		t = t.Field(i).Type
```

番号 `i` のフィールドの型を取り出し、それを新しい `t` にします。これを番号の数だけ繰り返すと、最後に残るのが目的の型です。

## ここがすごい

- **番号の並びで奥を指す**: 入れ子の奥のフィールドを、一つの整数の並びで表せます。名前で探すより、速くて確かです。
- **ポインタを透過して進む**: 呼び出し側は、途中にポインタがあるかを気にせずに、型をたどれます。
- **たどるだけの短い関数**: 値を作らず、型の情報だけを扱います。読み取りの準備を、軽く済ませられます。

## まとめ

- `typeByIndex` は、フィールドの番号の並びをたどって、最後の型を返します。
- 途中でポインタがあれば、中身の型に変えてから進みます。
- 入れ子の奥のフィールドを、番号の並びで指せます。
