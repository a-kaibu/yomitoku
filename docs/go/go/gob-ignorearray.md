---
title: "読み飛ばす配列の長さを確かめる gob の ignoreArray。合わなければ止まる"
description: "encoding/gob の Decoder.ignoreArray。受け取り先に値を入れずに、配列のデータを読み飛ばす。データに書かれた長さが、期待する長さと一致するかを確かめてから、要素を一つずつ読み飛ばす。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/decode.go"
lines: [632, 637]
function: "ignoreArray"
difficulty: 2
tags: [入出力, パース, 防御的プログラミング]
---

## ひとことで

`dec.ignoreArray(state, elemOp, length)` は、gob のデータの中にある配列を、値として使わずに読み飛ばします。受け取る側の型に、その配列がない場合に使われます。

読み飛ばすときも、データの形を確かめる必要があります。データに書かれた長さが、期待した長さと違えば、その後の読み取りはずれてしまうので、ここで止めます。

## コード

```go:line-numbers=632
func (dec *Decoder) ignoreArray(state *decoderState, elemOp decOp, length int) {
	if n := state.decodeUint(); n != uint64(length) {
		errorf("length mismatch in ignoreArray")
	}
	dec.ignoreArrayHelper(state, elemOp, length)
}
```

## 前提知識

- **gob のデータ**: 送る側と受ける側の型の対応が、データの流れの中に書かれています。受け取る側に無い項目は、読み飛ばして先へ進みます。
- **`decodeUint`**: データから符号なしの整数を読む関数です。ここでは、配列の長さを読むために使います。
- **`elemOp`**: 配列の各要素を読むための、操作の関数です。読み飛ばす場合も、要素の形を進むために使われます。
- **`errorf`**: gob の内部で、データの矛盾を知らせるための関数です。解析を中断させます。

## 何をしているか

### 1. データの長さを確かめる

```go:line-numbers=633
	if n := state.decodeUint(); n != uint64(length) {
		errorf("length mismatch in ignoreArray")
	}
```

データに書かれた長さ `n` を読み、期待する `length` と比べます。違えば、データと型の対応が壊れているので、`errorf` で止めます。

### 2. 要素を一つずつ読み飛ばす

```go:line-numbers=636
	dec.ignoreArrayHelper(state, elemOp, length)
```

長さが合っていれば、要素を読み飛ばす処理に任せます。値は保存されず、データの位置だけが先へ進みます。

## ここがすごい

- **ずれを早く見つける**: 長さが違うと、その後のすべての読み取りが狂います。読んだ直後に確かめるので、原因の場所がはっきりします。
- **読み飛ばしと検査を分ける**: 長さの検査はこの関数が行い、要素の読み飛ばしは別の関数が担当します。役割がはっきりしています。
- **値を作らない**: 使わない配列の値を、メモリに作りません。データを読むだけなので、軽い処理で済みます。

## まとめ

- `ignoreArray` は、受け取る側にない配列を、値を作らずに読み飛ばします。
- データの長さが期待と違えば、読み取りを止めます。
- 長さの検査の後、要素の読み飛ばしを別の関数に任せます。
