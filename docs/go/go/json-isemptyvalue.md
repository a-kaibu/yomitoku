---
title: "JSON の省略判定 isEmptyValue。空の値や 0 の値をまとめて判定する"
description: "encoding/json の isEmptyValue。構造体のフィールドを、omitempty の指定で省略するかを判定する。配列、マップ、スライス、文字列は長さが 0 のとき、数値やポインタなどはゼロ値のとき、空と判断する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [346, 358]
function: "isEmptyValue"
difficulty: 2
tags: [型システム, リフレクション, API設計]
---

## ひとことで

`isEmptyValue(v)` は、JSON にするときに、値が「空」かを判定します。`omitempty` と書かれたフィールドは、この判定が真なら、出力から省かれます。

例えば、空の文字列や、0 の数字は、JSON に書く必要がないことがよくあります。この関数は、型ごとに「空」の意味を決めています。

## コード

```go:line-numbers=346
func isEmptyValue(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.Array, reflect.Map, reflect.Slice, reflect.String:
		return v.Len() == 0
	case reflect.Bool,
		reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr,
		reflect.Float32, reflect.Float64,
		reflect.Interface, reflect.Pointer:
		return v.IsZero()
	}
	return false
}
```

## 前提知識

- **`omitempty`**: 構造体のフィールドに付けるタグです。このタグがあると、値が空のときに JSON の項目を省きます。
- **リフレクション**: 実行時に、値の型や中身を調べる仕組みです。`reflect.Value` は、その値を表します。
- **`Kind`**: 値の種類（配列、文字列、整数など）を表す値です。型の名前ではなく、基本的な形を表します。
- **ゼロ値**: 型ごとの初期値です。整数は 0、ポインタは nil、真偽値は false です。

## 何をしているか

### 1. 長さで判定する型

```go:line-numbers=347
	switch v.Kind() {
	case reflect.Array, reflect.Map, reflect.Slice, reflect.String:
		return v.Len() == 0
```

配列、マップ、スライス、文字列は、中身の数で空かどうかを決めます。長さが 0 なら空です。

### 2. ゼロ値で判定する型

```go:line-numbers=355
		return v.IsZero()
```

真偽値、整数、浮動小数点数、インターフェース、ポインタは、ゼロ値かどうかで判定します。`IsZero` は、その型の初期値と同じかを返します。

### 3. それ以外は空としない

```go:line-numbers=357
	return false
```

構造体などの型は、ここでは空と判断しません。そのため、`false` を返して、項目を省かずに出力させます。

## ここがすごい

- **型に合った「空」を使う**: 文字列は長さ、数値はゼロ値と、型の性質に応じて判定を変えています。どの値も、自然な意味で空と判断されます。
- **対象を絞る**: 空と判断できない型は、迷わず `false` にします。安全側に倒して、データを失わない設計です。
- **リフレクションで汎用化**: 型を一つずつ書かずに、`Kind` で場合分けすることで、どんな型の構造体にも使えます。

## まとめ

- `isEmptyValue` は、`omitempty` のフィールドを省くかを判定します。
- 配列などは長さ、数値などはゼロ値で、空かどうかを決めます。
- 判断できない型は `false` にして、データを残します。
