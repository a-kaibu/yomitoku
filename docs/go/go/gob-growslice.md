---
title: "gob の配列の長さから、スライスの長さを決める growSlice"
description: "encoding/gob の growSlice。デコードする要素数 length に合わせて、スライスの長さを決め、反射の値 v にセットする。容量が length より大きいときは、length までに切り詰める。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/dec_helpers.go"
lines: [537, 548]
function: "growSlice"
difficulty: 3
tags: [メモリ管理, 防御的プログラミング]
---

## ひとことで

`growSlice(v, ps, length)` は、デコードするスライスの長さを決めて、反射の値 `v` にセットします。長さは、要求された `length` を超えないように切り詰めます。

## コード

```go:line-numbers=537
func growSlice[E any](v reflect.Value, ps *[]E, length int) {
	var zero E
	s := *ps
	s = append(s, zero)
	cp := cap(s)
	if cp > length {
		cp = length
	}
	s = s[:cp]
	v.Set(reflect.ValueOf(s))
	*ps = s
}
```

## 前提知識

- **gob**: Go の値を、バイト列にしたり、バイト列から戻したりする仕組みです。
- **反射の値（reflect.Value）**: 実行時に値を扱うための型です。`Set` で、中身を書き換えられます。
- **容量（cap）と長さ（len）**: 長さは、今使っている要素の数です。容量は、確保されている領域の大きさです。

## 何をしているか

### 1. 一つ追加して、容量を確保する

```go:line-numbers=538
	var zero E
	s := *ps
	s = append(s, zero)
	cp := cap(s)
```

ゼロ値を一つ追加して、スライスの容量を確保します。`cp` に、その容量を入れます。

### 2. 容量を length で切り詰める

```go:line-numbers=542
	if cp > length {
		cp = length
	}
	s = s[:cp]
```

容量が要求された `length` より大きければ、`length` に切り詰めます。そのうえで、スライスの長さを `cp` にします。必要以上の長さを、一度に作らないためです。

### 3. 反射の値にセットして保存する

```go:line-numbers=546
	v.Set(reflect.ValueOf(s))
	*ps = s
```

作ったスライスを反射の値 `v` にセットし、呼び出し側の `ps` にも保存します。

## ここがすごい

- **要求の大きさを超えない**: 容量が大きくても、`length` で切るので、入力が要求する以上の領域を使いません。
- **二か所に同じ値を書く**: 反射の値と、呼び出し側の変数の両方に書くので、どちらから見ても同じ内容になります。

## まとめ

- `growSlice` は、デコードする長さに合わせて、スライスを確保します。
- 容量が要求より大きければ、`length` に切り詰めます。
- 反射の値と呼び出し側の変数に、同じスライスを書きます。
