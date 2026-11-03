---
title: "反射の値が書き込めるかを調べる gob の valid"
description: "encoding/gob の valid。反射の値 v が、エンコードできる状態かを調べる。Invalid なら false、ポインタなら nil でないときだけ true を返す。それ以外は true を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/encode.go"
lines: [278, 286]
function: "valid"
difficulty: 1
tags: [リフレクション, 防御的プログラミング]
---

## ひとことで

`valid(v)` は、反射の値 `v` を gob で書き込めるかを調べます。書き込めないなら `false` を返します。

## コード

```go:line-numbers=278
func valid(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.Invalid:
		return false
	case reflect.Pointer:
		return !v.IsNil()
	}
	return true
}
```

## 前提知識

- **reflect.Value の Kind**: 値の種類です。`Invalid` は値がないこと、`Pointer` はポインタであることを表します。
- **Invalid な値**: 値が存在しない状態です。ゼロの `reflect.Value` などがこれに当たります。
- **nil のポインタ**: 指す先がないポインタです。指す先を読むと、パニックになります。

## 何をしているか

### 1. 値の種類を調べる

```go:line-numbers=279
	switch v.Kind() {
	case reflect.Invalid:
		return false
	case reflect.Pointer:
		return !v.IsNil()
	}
```

値の種類が `Invalid` なら、値がないので `false` を返します。種類がポインタなら、nil でないときだけ `true` を返します。

### 2. それ以外は書き込める

```go:line-numbers=285
	return true
```

それ以外の種類は、値が存在するので、書き込めると判断して `true` を返します。

## ここがすごい

- **調べるだけで止める**: 書き込む前に、危ない値を見つけて `false` で返すので、後の処理でパニックになりません。
- **ポインタだけ特別扱いする**: nil のポインタを除き、他の種類はすべて書けると判断するので、規則が少なく済みます。

## まとめ

- `valid` は、反射の値を書き込めるかを調べます。
- `Invalid` と nil のポインタは、`false` になります。
- それ以外は、`true` として扱います。
