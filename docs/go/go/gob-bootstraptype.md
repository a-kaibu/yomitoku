---
title: "組み込みの型を最初に登録する bootstrapType。二度登録されたら止める"
description: "encoding/gob の bootstrapType。組み込みの型を、名前と番号つきで表に登録する。同じ型がすでにあれば、パニックで止める。登録したあと、番号を振って返す。起動時の準備に使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [630, 640]
function: "bootstrapType"
difficulty: 2
tags: [防御的プログラミング, 型システム, 数値計算]
---

## ひとことで

`bootstrapType(name, e)` は、組み込みの型を、gob の表に最初に登録します。`e` は、その型の値の例で、型は `e` のポインタの指す先から取り出します。登録が済むと、型に番号を振って、その番号を返します。

gob の準備段階では、他の型を作る前に、組み込みの型を決まった順に登録する必要があります。この関数は、その一つ一つの登録を行います。

## コード

```go:line-numbers=630
func bootstrapType(name string, e any) typeId {
	rt := reflect.TypeOf(e).Elem()
	_, present := types[rt]
	if present {
		panic("bootstrap type already present: " + name + ", " + rt.String())
	}
	typ := &CommonType{Name: name}
	types[rt] = typ
	setTypeId(typ)
	return typ.id()
}
```

## 前提知識

- **ブートストラップ**: 他の仕組みが動く前に、最低限の部品を用意する準備段階です。
- **`reflect.TypeOf(e).Elem()`**: 値 `e` のポインタの先の型を取り出します。例えば `(*int)(nil)` を渡せば、`int` が得られます。
- **`CommonType`**: 型の名前や番号を持つ、共通の情報の型です。
- **`setTypeId`**: 型に新しい番号を振る関数です。

## 何をしているか

### 1. 二度登録されていないかを確かめる

```go:line-numbers=632
	_, present := types[rt]
	if present {
		panic("bootstrap type already present: " + name + ", " + rt.String())
	}
```

同じ型が表にすでにあれば、準備の手順が二重になっています。`panic` で止めて、どの型かを伝えます。

### 2. 型を登録して番号を振る

```go:line-numbers=637
	types[rt] = typ
	setTypeId(typ)
	return typ.id()
```

型の情報を表に入れ、番号を振ります。最後に、振られた番号を返します。この番号は、データを送るときに型を指す値として使われます。

## ここがすごい

- **準備の誤りをすぐ見つける**: 同じ型を二度登録する誤りは、プログラムの起動時に止まります。後で奇妙な動きになる前に、原因が分かります。
- **番号と表を同時に作る**: 登録と番号付けを一緒に行うので、表にある型は必ず番号を持ちます。
- **番号を返す**: 呼び出し側は、返された番号を、組み込みの型の定数として使えます。

## まとめ

- `bootstrapType` は、組み込みの型を表に登録し、番号を振ります。
- 同じ型の二重登録は、`panic` で止めます。
- 振られた番号を返し、以後の型の指定に使います。
