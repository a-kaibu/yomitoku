---
title: "JSON のマップのキーを文字列にする resolveKeyName。型ごとに変換を変える"
description: "encoding/json が map のキーを JSON の文字列にするときに使う resolveKeyName。文字列、TextMarshaler、整数の順に判定し、それぞれの方法で文字列にする。どれにも当てはまらなければパニックする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [973, 991]
function: "resolveKeyName"
difficulty: 2
tags: [型システム, リフレクション, API設計]
---

## ひとことで

JSON のオブジェクトの名前は、必ず文字列です。しかし Go の `map` のキーには、整数や独自の型も使えます。`resolveKeyName(k)` は、どんなキーでも JSON の名前（文字列）に直す関数です。文字列はそのまま、`MarshalText` を持つものはその結果、整数は 10 進数の文字にします。

## コード

```go:line-numbers=973
func resolveKeyName(k reflect.Value) (string, error) {
	if k.Kind() == reflect.String {
		return k.String(), nil
	}
	if tm, ok := reflect.TypeAssert[encoding.TextMarshaler](k); ok {
		if k.Kind() == reflect.Pointer && k.IsNil() {
			return "", nil
		}
		buf, err := tm.MarshalText()
		return string(buf), err
	}
	switch k.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return strconv.FormatInt(k.Int(), 10), nil
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return strconv.FormatUint(k.Uint(), 10), nil
	}
	panic("unexpected map key type")
}
```

## 前提知識

- **JSON のオブジェクトのキー**: `{"1": "a"}` のように、キーは必ず文字列です。`map[int]string` を JSON にすると、キーが `"1"` の文字列になるのは、この関数の役割です。
- **`encoding.TextMarshaler`**: `MarshalText() ([]byte, error)` を持つ型のインタフェースです。独自の型を文字列にする方法を、型自身が決められます。
- **`reflect.Value`**: 実行時にキーの値を調べるための型です。`Kind()` で種類が分かります。
- **`reflect.TypeAssert`**: `reflect.Value` を、指定したインタフェースの型として取り出せるかを試す関数です。

## 何をしているか

### 1. 文字列のキーはそのまま使う

```go:line-numbers=974
	if k.Kind() == reflect.String {
		return k.String(), nil
	}
```

キーが文字列なら、その値をそのまま名前にします。最も多い場合なので、最初に判定しています。

### 2. MarshalText を持つキーは、その結果を使う

```go:line-numbers=977
	if tm, ok := reflect.TypeAssert[encoding.TextMarshaler](k); ok {
		if k.Kind() == reflect.Pointer && k.IsNil() {
			return "", nil
		}
		buf, err := tm.MarshalText()
		return string(buf), err
	}
```

キーの型が `MarshalText` を持つなら、その型の変換に任せます。ポインタの `nil` は、変換する中身がないので空の名前にします。

### 3. 整数は 10 進数の文字にする

```go:line-numbers=985
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return strconv.FormatInt(k.Int(), 10), nil
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return strconv.FormatUint(k.Uint(), 10), nil
	}
	panic("unexpected map key type")
```

整数の型は、符号付きと符号なしを分けて、10 進数の文字にします。どれにも当てはまらないキーは、`map` の型の制約で来ないはずなので、パニックで知らせます。

## ここがすごい

- **優先順位が決まっている**: 文字列、`MarshalText`、整数の順に判定します。独自の型が `MarshalText` を持っていれば、整数の型でも、その結果が優先されます。
- **型ごとの変換を型に任せる**: 独自の型の名前の付け方は、その型が決めます。この関数は、仕組みの共通部分だけを担当します。
- **想定外はパニック**: `encoding/json` の内部では、キーの型は前もって検査されているので、ここで来ることはありません。来たら、バグとして早く知らせます。

## まとめ

- `resolveKeyName` は、map のキーを JSON の文字列にします。
- 文字列はそのまま、`MarshalText` を持つ型はその結果、整数は 10 進数の文字にします。
- 優先順位は、文字列、`MarshalText`、整数の順です。
- どれにも当てはまらなければ、パニックで知らせます。
