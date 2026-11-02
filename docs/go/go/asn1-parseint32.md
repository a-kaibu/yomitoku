---
title: "ASN.1 の整数を int32 に変える parseInt32。範囲に収まらなければ失敗する"
description: "encoding/asn1 の parseInt32。バイト列を整数として確かめ、int64 として読み、int32 の範囲に収まるかを調べる。収まらなければ、大きすぎるという構造のエラーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/asn1.go"
lines: [120, 132]
function: "parseInt32"
difficulty: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`parseInt32(bytes)` は、ASN.1 の整数を表すバイト列を、`int32` の値に変換します。変換の前に、最短の形かを確かめ、変換の後に、値が `int32` の範囲に収まるかを確かめます。

例えば、`int32` に収まらない大きな値を、無理に切り詰めると、別の値になってしまいます。この関数は、そうなる前に失敗させます。

## コード

```go:line-numbers=120
func parseInt32(bytes []byte) (int32, error) {
	if err := checkInteger(bytes); err != nil {
		return 0, err
	}
	ret64, err := parseInt64(bytes)
	if err != nil {
		return 0, err
	}
	if ret64 != int64(int32(ret64)) {
		return 0, StructuralError{"integer too large"}
	}
	return int32(ret64), nil
}
```

## 前提知識

- **`int32`**: 32 ビットの符号つき整数です。おおよそ、マイナス 21 億から 21 億までの値を表せます。
- **`parseInt64`**: バイト列を `int64` として読む内部の関数です。`int32` より広い範囲を扱えます。
- **範囲の確かめ方**: 一度 `int32` に変換して、それをもう一度 `int64` に戻して比べると、値が変わったかが分かります。変わっていれば、範囲の外です。
- **`checkInteger`**: 前の記事で見た、最短の形かを確かめる関数です。

## 何をしているか

### 1. 最短の形かを確かめる

```go:line-numbers=121
	if err := checkInteger(bytes); err != nil {
		return 0, err
	}
```

まず、`checkInteger` で、バイト列が最短の形かを確かめます。誤りならそのまま返します。

### 2. 64 ビットで読み取る

```go:line-numbers=124
	ret64, err := parseInt64(bytes)
	if err != nil {
		return 0, err
	}
```

`parseInt64` で、広い範囲の整数として読みます。ここで失敗したら、そのエラーを返します。

### 3. int32 の範囲に収まるか確かめる

```go:line-numbers=128
	if ret64 != int64(int32(ret64)) {
		return 0, StructuralError{"integer too large"}
	}
	return int32(ret64), nil
```

`int32(ret64)` で切り詰めた値を、もう一度 `int64` に戻して比べます。同じなら、範囲に収まっています。違えば、切り詰めで値が変わったので、大きすぎるとしてエラーを返します。

## ここがすごい

- **変換して戻して比べる**: 範囲を直接書く代わりに、往復させて同じかを見ます。範囲の上限を書き間違える心配がありません。
- **段階ごとに失敗を伝える**: 形の誤り、読み取りの誤り、範囲の誤りを、順番に報告します。どこで壊れたかが分かります。
- **型を広げてから絞る**: 先に広い型で読み、最後に狭い型へ変換するので、読み取りの途中で値が壊れることがありません。

## まとめ

- `parseInt32` は、ASN.1 の整数を `int32` に変えます。
- 最短の形を確かめ、`int64` で読んでから、範囲に収まるかを調べます。
- 範囲を超えるときは、大きすぎるというエラーを返します。
