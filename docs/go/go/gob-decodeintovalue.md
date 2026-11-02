---
title: "読んだ値を受け取り先に入れる gob の decodeIntoValue。ポインタなら先に作る"
description: "encoding/gob の decodeIntoValue。読み取りの操作を、受け取り先の値に対して実行する。受け取り先がポインタ型なら、decAlloc で使える場所を用意してから書き込む。書き込んだ値を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/decode.go"
lines: [580, 588]
function: "decodeIntoValue"
difficulty: 2
tags: [型システム, リフレクション, 防御的プログラミング]
---

## ひとことで

`decodeIntoValue(state, op, isPtr, value, instr)` は、データから読んだ値を、受け取り先の `value` に書き込みます。読み取りの手順 `op` を、実際の場所に対して実行する関数です。

受け取り先の型がポインタなら、まず使える場所を用意しなければ書き込めません。この関数は、その準備を行ってから、書き込みを実行します。

## コード

```go:line-numbers=580
func decodeIntoValue(state *decoderState, op decOp, isPtr bool, value reflect.Value, instr *decInstr) reflect.Value {
	v := value
	if isPtr {
		v = decAlloc(value)
	}

	op(instr, state, v)
	return value
}
```

## 前提知識

- **受け取り先（value）**: データを読み込んで入れる先の値です。`reflect.Value` で表されます。
- **`isPtr`**: 受け取り先がポインタであることを表す真偽値です。真なら、先に指す先を用意します。
- **`decAlloc`**: ポインタをたどって、書き込める場所を用意する関数です。前の記事で見ました。
- **`decInstr`**: 一つの項目を読むための、手順をまとめた情報です。`op` は、その手順を実行する関数です。

## 何をしているか

### 1. ポインタなら書き込み先を用意する

```go:line-numbers=582
	if isPtr {
		v = decAlloc(value)
	}
```

受け取り先がポインタなら、`decAlloc` で、指す先の値を用意します。この時点で、`v` は必ず書き込める場所を指します。ポインタでなければ、受け取り先そのものに書きます。

### 2. 読み取りの手順を実行する

```go:line-numbers=586
	op(instr, state, v)
	return value
```

用意した場所に対して、読み取りの手順 `op` を実行します。その後、元の受け取り先 `value` を返します。

## ここがすごい

- **書き込みの準備と実行を分ける**: 場所を用意する処理と、値を書く処理が、別々に書かれています。どちらも単純です。
- **手順を値として渡す**: 型ごとの読み取り方を、関数の引数として受け取ります。どんな型でも、同じ仕組みで書き込めます。
- **元の値を返す**: 返り値は受け取り先そのものなので、呼び出し側は結果をすぐ使えます。

## まとめ

- `decodeIntoValue` は、読み取りの手順を受け取り先に対して実行します。
- ポインタの場合は、先に書き込める場所を用意します。
- 読み取りの手順は引数で受け取るので、型に関係なく同じ仕組みで動きます。
