---
title: "ポインタとインターフェースをたどって実際の値を取り出す xml の indirect"
description: "encoding/xml の indirect。反射の値 vf が、ポインタかインターフェースである限り、Elem でたどる。nil に当たったら、そこで止めて、その値を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/marshal.go"
lines: [839, 847]
function: "indirect"
difficulty: 2
tags: [リフレクション, 防御的プログラミング]
---

## ひとことで

`indirect(vf)` は、ポインタやインターフェースの箱を外して、中の実際の値を取り出します。nil に当たったら、そこで止めます。

## コード

```go:line-numbers=839
func indirect(vf reflect.Value) reflect.Value {
	for vf.Kind() == reflect.Interface || vf.Kind() == reflect.Pointer {
		if vf.IsNil() {
			return vf
		}
		vf = vf.Elem()
	}
	return vf
}
```

## 前提知識

- **インターフェース（reflect.Interface）**: どの型の値でも入る箱です。中に入っている具体的な値を、`Elem` で取り出せます。
- **ポインタ（reflect.Pointer）**: 別の場所にある値を指す値です。`Elem` で指す先を取り出せます。
- **nil**: 値がないことを表します。nil の箱を `Elem` すると、パニックになります。

## 何をしているか

### 1. 箱の中が続く限り外す

```go:line-numbers=840
	for vf.Kind() == reflect.Interface || vf.Kind() == reflect.Pointer {
		if vf.IsNil() {
			return vf
		}
		vf = vf.Elem()
	}
```

値の種類がインターフェースかポインタである間、繰り返します。nil なら、その時点の値を返して止めます。nil でなければ、`Elem` で一段中に進みます。

ポインタが二重になっていても、同じ書き方で最後の値まで外せます。

### 2. 実際の値を返す

```go:line-numbers=846
	return vf
```

箱を外し終えた値を返します。

## ここがすごい

- **何段でも外せる**: 繰り返しで書いているので、ポインタの重なりの深さを知らなくても、正しく中身に届きます。
- **nil で止まる**: nil を見たら止まり、パニックを避けます。

## まとめ

- `indirect` は、ポインタとインターフェースの箱を、中の値まで外します。
- 箱が続く限り繰り返します。
- nil に当たったら、そこで止まります。
