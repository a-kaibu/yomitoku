---
title: "型だけから構造体のバイト数を求める binary.sizeof。値がなくても計算できる"
description: "encoding/binary の sizeof。Go の型情報（reflect.Type）だけを見て、配列・構造体・固定長の数値の合計バイト数を求める。可変長の型が混じると -1 を返して、固定長でないことを伝える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/binary/binary.go"
lines: [733, 759]
function: "sizeof"
difficulty: 3
tags: [入出力, 型システム, リフレクション]
---

## ひとことで

`binary.Read` や `binary.Write` は、構造体を固定長のバイト列として読み書きできます。その大きさを、値を見ずに型だけから求めるのが `sizeof` です。例えば `struct{ A uint16; B [2]uint8 }` なら、`2 + 2 = 4` バイトと分かります。

`sizeof` は、型の中身を再帰的にたどります。固定長でない型（スライスや文字列など）が混じると、`-1` を返します。

## コード

```go:line-numbers=733
func sizeof(t reflect.Type) int {
	switch t.Kind() {
	case reflect.Array:
		if s := sizeof(t.Elem()); s >= 0 {
			return s * t.Len()
		}

	case reflect.Struct:
		sum := 0
		for i, n := 0, t.NumField(); i < n; i++ {
			s := sizeof(t.Field(i).Type)
			if s < 0 {
				return -1
			}
			sum += s
		}
		return sum

	case reflect.Bool,
		reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Float32, reflect.Float64, reflect.Complex64, reflect.Complex128:
		return int(t.Size())
	}

	return -1
}
```

## 前提知識

- **reflect.Type**: 型の情報を実行時に調べるための値です。`Kind()` で種類（配列、構造体、数値など）が分かり、`Elem()` や `Field(i)` で中身の型を取り出せます。
- **固定長の型**: 大きさが型だけで決まる型です。`uint32` は常に 4 バイト、`[3]uint16` は常に 6 バイトです。
- **`reflect.Struct` と `reflect.Array`**: 構造体と配列の種類です。中の要素を、1 つずつ同じ関数で調べます。
- **`-1` の意味**: 大きさが決まらない型を見つけたことを表す、特別な値です。

## 何をしているか

### 1. 配列は要素の大きさに長さをかける

```go:line-numbers=735
		case reflect.Array:
			if s := sizeof(t.Elem()); s >= 0 {
				return s * t.Len()
			}
```

配列なら、要素の型の大きさを再帰的に求めて、配列の長さ `t.Len()` を掛けます。要素が固定長でなければ、`s` が `-1` になり、ここで外れます。

### 2. 構造体は項目の大きさを足す

```go:line-numbers=741
		sum := 0
		for i, n := 0, t.NumField(); i < n; i++ {
			s := sizeof(t.Field(i).Type)
			if s < 0 {
				return -1
			}
			sum += s
		}
		return sum
```

構造体の項目を 1 つずつ見て、それぞれの大きさを足します。途中に固定長でない項目があれば、全体も `-1` になります。

### 3. 数値の型は Size で求める

```go:line-numbers=751
	case reflect.Bool,
		reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Float32, reflect.Float64, reflect.Complex64, reflect.Complex128:
		return int(t.Size())
```

真偽値、整数、浮動小数点数、複素数は、型の `Size()` で大きさが分かります。これが、再帰の葉になります。

## ここがすごい

- **値を作らずに大きさが分かる**: 型だけで大きさを計算するので、まだ値のない場面でも、必要なバッファの大きさを前もって決められます。
- **固定長かどうかを一緒に判定する**: 大きさを計算すると同時に、スライスや文字列が混じっていないかも分かります。`-1` で、読み書きできない型を弾けます。
- **再帰で型の入れ子に対応**: 構造体の中の配列、配列の中の構造体など、どんな入れ子でも同じ関数で済みます。

## まとめ

- `sizeof` は、型の情報だけからバイト数を求めます。
- 配列は要素の大きさに長さを掛け、構造体は項目の大きさを足します。
- 数値の型は `Size()` の値をそのまま使います。
- 固定長でない型が混じると、`-1` を返します。
