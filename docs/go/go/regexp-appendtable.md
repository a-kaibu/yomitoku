---
title: "Unicode の文字表を範囲の並びに変換する regexp/syntax の appendTable"
description: "正規表現の \\p{Greek} のような Unicode の文字の集まりを、文字の範囲の並びに直して追加する appendTable。16 ビットと 32 ビットの表を別々に読み、等間隔の文字は 1 つずつ追加する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [2088, 2110]
function: "appendTable"
difficulty: 3
tags: [正規表現, Unicode, 型システム]
---

## ひとことで

`\p{Greek}` や `\pN` のような Unicode のクラスは、`unicode.RangeTable` という表で表されています。`appendTable(r, x)` は、その表の中身を、正規表現の内部が使う「範囲の組の並び」に直して、`r` の後ろに追加します。

## コード

```go:line-numbers=2088
func appendTable(r []rune, x *unicode.RangeTable) []rune {
	for _, xr := range x.R16 {
		lo, hi, stride := rune(xr.Lo), rune(xr.Hi), rune(xr.Stride)
		if stride == 1 {
			r = appendRange(r, lo, hi)
			continue
		}
		for c := lo; c <= hi; c += stride {
			r = appendRange(r, c, c)
		}
	}
	for _, xr := range x.R32 {
		lo, hi, stride := rune(xr.Lo), rune(xr.Hi), rune(xr.Stride)
		if stride == 1 {
			r = appendRange(r, lo, hi)
			continue
		}
		for c := lo; c <= hi; c += stride {
			r = appendRange(r, c, c)
		}
	}
	return r
}
```

## 前提知識

- **`unicode.RangeTable`**: Unicode の文字の集まりを表す表です。`R16` は 16 ビットに収まる範囲、`R32` はそれより大きい範囲を持ちます。
- **`Range16` と `Range32`**: `Lo`、`Hi`、`Stride` からなる範囲です。`Stride` は、間隔を表します。`Stride` が 1 なら、`Lo` から `Hi` までが連続しています。
- **`appendRange`**: 範囲の組を、正規表現の内部の並びに追加する関数です。隣り合う範囲をまとめるなど、整理も行います。
- **`continue`**: ループの残りを飛ばして、次の要素へ進む命令です。

## 何をしているか

### 1. 16 ビットの範囲を追加する

```go:line-numbers=2089
	for _, xr := range x.R16 {
		lo, hi, stride := rune(xr.Lo), rune(xr.Hi), rune(xr.Stride)
		if stride == 1 {
			r = appendRange(r, lo, hi)
			continue
		}
```

`R16` の各範囲を取り出します。`Stride` が 1 なら、`lo` から `hi` までの連続した範囲を、1 回の `appendRange` で追加します。

### 2. 間隔がある範囲は 1 文字ずつ

```go:line-numbers=2095
		for c := lo; c <= hi; c += stride {
			r = appendRange(r, c, c)
		}
```

`Stride` が 2 以上なら、連続していません。例えば偶数だけ、といった並びです。そのため、`lo` から `stride` ずつ進めて、1 文字ずつ範囲として追加します。

### 3. 32 ビットの範囲も同じ方法で

`R32` の範囲も、同じように扱います。違いは、扱う型が大きいことだけです。最後に、追加した結果 `r` を返します。

## ここがすごい

- **連続した範囲を 1 つにまとめる**: 等間隔でない範囲は、まとめて 1 つの組として入れます。文字の数が多くても、範囲の数が少なく保たれます。
- **間隔のある表も扱える**: `Stride` を見て、連続かどうかで処理を分けるので、偶数だけの文字集合なども正しく表せます。
- **同じ処理の繰り返し**: 16 ビットと 32 ビットの 2 つのループは、ほぼ同じ形です。Go の標準ライブラリでは、型の違いをこうして素直に書くことがよくあります。

## まとめ

- `appendTable` は、Unicode の文字表を、正規表現の範囲の並びに変換します。
- 連続した範囲は、1 回の追加で済ませます。
- 間隔がある範囲は、1 文字ずつ追加します。
- 16 ビットと 32 ビットの表を、別々に処理します。
