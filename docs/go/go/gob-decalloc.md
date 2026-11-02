---
title: "ポインタの先に値を用意する gob の decAlloc。nil のポインタは新しく作る"
description: "encoding/gob の decAlloc。ポインタ型の値を、中身が使えるところまでたどる。途中で nil のポインタがあれば、新しく作って設定してから進む。最後に、値そのものを表す reflect.Value を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/decode.go"
lines: [226, 234]
function: "decAlloc"
difficulty: 2
tags: [型システム, リフレクション, 防御的プログラミング]
---

## ひとことで

`decAlloc(v)` は、ポインタを何段かたどって、実際の値の場所を返します。途中で、まだ何も指していないポインタ（`nil`）があれば、新しい値を作って指すように設定します。

gob でデータを読むときは、受け取る先がまだ用意されていないことがあります。この関数は、受け取り先を必ず使える状態にしてから、値を書き込めるようにします。

## コード

```go:line-numbers=226
func decAlloc(v reflect.Value) reflect.Value {
	for v.Kind() == reflect.Pointer {
		if v.IsNil() {
			v.Set(reflect.New(v.Type().Elem()))
		}
		v = v.Elem()
	}
	return v
}
```

## 前提知識

- **ポインタ**: 別の場所にある値を指す型です。`*int` は、int の値の場所を指します。
- **`nil` のポインタ**: どこも指していない状態です。そのままでは、指す先の値を読むことも書くこともできません。
- **`reflect.Value`**: 実行時に、値を表す型です。`Elem` で指す先を、`Set` で値を、`New` で新しい値を作れます。
- **`Kind`**: 値の種類です。`reflect.Pointer` なら、ポインタであることを表します。

## 何をしているか

### 1. ポインタである間、たどる

```go:line-numbers=227
	for v.Kind() == reflect.Pointer {
```

値の種類がポインタである間、繰り返します。`**int` のように、ポインタが何重になっていても、この繰り返しで最後まで進めます。

### 2. nil なら新しく作って設定する

```go:line-numbers=228
		if v.IsNil() {
			v.Set(reflect.New(v.Type().Elem()))
		}
```

ポインタが `nil` なら、指す先の型の新しい値を作り、そのアドレスを設定します。これで、ポインタは必ず使える場所を指すようになります。

### 3. 指す先へ進む

```go:line-numbers=231
		v = v.Elem()
	}
	return v
```

`Elem` で、ポインタが指す先の値に移ります。ポインタでなくなるまで繰り返した後、その値を返します。

## ここがすごい

- **何重でも同じ書き方**: 繰り返しの中で処理するので、ポインタの段数を知らなくても正しく動きます。
- **必要なときだけ作る**: `nil` のときだけ新しい値を作るので、すでにある値を無駄に作り直しません。
- **書き込み先を確実にする**: 返される値は、必ず書き込める場所を指しています。後の読み取り処理が、安心して値を入れられます。

## まとめ

- `decAlloc` は、ポインタを最後までたどり、値の場所を返します。
- 途中で `nil` のポインタがあれば、新しい値を作って設定します。
- 返された値には、そのまま読み込んだ内容を書けます。
