---
title: "必要な回数だけポインタをたどる gob の encIndirect"
description: "encoding/gob の encIndirect。反射の値 pv を、indir の回数だけ Elem でたどる。途中で nil のポインタに当たったら、そこで止めて、その値を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/encode.go"
lines: [163, 171]
function: "encIndirect"
difficulty: 2
tags: [リフレクション, 防御的プログラミング]
---

## ひとことで

`encIndirect(pv, indir)` は、ポインタを `indir` 回だけたどって、指している先の値を返します。途中で nil に当たったら、そこで止まります。

## コード

```go:line-numbers=163
func encIndirect(pv reflect.Value, indir int) reflect.Value {
	for ; indir > 0; indir-- {
		if pv.IsNil() {
			break
		}
		pv = pv.Elem()
	}
	return pv
}
```

## 前提知識

- **リフレクション（reflect.Value）**: 実行時に値を調べたり、たどったりするための型です。
- **indir**: 何回ポインタを外せばよいかを表す整数です。型の情報から決まります。
- **Elem**: ポインタの指す先の値を返すメソッドです。

## 何をしているか

### 1. indir の回数だけたどる

```go:line-numbers=164
	for ; indir > 0; indir-- {
		if pv.IsNil() {
			break
		}
		pv = pv.Elem()
	}
```

`indir` が 0 になるまで、`pv` を一段ずつたどります。各段で、値が nil なら `break` して止めます。nil の値に `Elem` を呼ぶと、パニックになるためです。

### 2. 結果を返す

```go:line-numbers=170
	return pv
```

たどった結果を返します。途中で止まった場合は、nil に当たった時点の値が返ります。

## ここがすごい

- **nil で止まる安全な作り**: nil を見たら止まるので、ポインタが空でも、パニックせずに済みます。
- **回数を呼び出し側が決める**: `indir` で回数を渡すので、同じ関数で、いろいろな深さの型に対応できます。

たとえば `indir` が 2 なら、ポインタのポインタを外して、中の値に届きます。ポインタが 1 回しか重なっていない型なら、`indir` は 1 になります。どちらの場合も、この関数は回数の分だけ `Elem` を呼ぶだけです。

## まとめ

- `encIndirect` は、ポインタを指定した回数だけたどります。
- 途中で nil に当たったら、そこで止まります。
- 回数は、型の情報から呼び出し側が決めます。
