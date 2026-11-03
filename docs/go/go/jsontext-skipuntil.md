---
title: "指定の深さまで読み飛ばす jsontext の SkipUntil。深さと長さが条件を満たすまで進む"
description: "encoding/json/jsontext の decoderState.SkipUntil。JSON の読み取りで、指定した深さと、現在の項目の長さの条件を満たすまで、トークンを一つずつ読み進める。途中でエラーがあれば、それを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/jsontext/decode.go"
lines: [472, 479]
function: "SkipUntil"
difficulty: 2
tags: [パース, 状態機械, 入出力]
---

## ひとことで

`d.SkipUntil(depth, length)` は、JSON の読み取りを、指定の位置まで進めます。位置は、入れ子の深さ `depth` と、現在の項目の長さ `length` で決まります。

JSON を読み飛ばすときに、途中の値を使わずに、決まった位置まで進めたい場面があります。この関数は、その進め方を条件で表したものです。

## コード

```go:line-numbers=472
func (d *decoderState) SkipUntil(depth int, length int64) error {
	for d.Tokens.Depth() > depth || (d.Tokens.Depth() == depth && d.Tokens.Last.Length() < length) {
		if _, err := d.ReadToken(); err != nil {
			return err
		}
	}
	return nil
}
```

## 前提知識

- **トークン**: JSON を、意味のある最小単位に分けたものです。`{`、文字列、数値、`]` などが、それぞれトークンです。
- **深さ（Depth）**: 今いる入れ子の段数です。オブジェクトや配列を開くと増え、閉じると減ります。
- **`Last.Length()`**: 今いる項目の中で、要素がいくつ読まれたかを表す値です。
- **`ReadToken`**: 次のトークンを一つ読む関数です。エラーがあれば、それを返します。

## 何をしているか

### 1. 条件を満たす間、トークンを読む

```go:line-numbers=473
	for d.Tokens.Depth() > depth || (d.Tokens.Depth() == depth && d.Tokens.Last.Length() < length) {
```

今の深さが指定より深いか、同じ深さで要素数がまだ足りなければ、まだ進むべき場所です。この条件が真の間、繰り返します。

### 2. トークンを一つずつ読み、エラーで止まる

```go:line-numbers=474
		if _, err := d.ReadToken(); err != nil {
			return err
		}
	}
	return nil
```

一つずつトークンを読みます。読み取りでエラーが起きたら、その場で止めて、エラーを返します。条件を満たして抜けたら、`nil` を返します。

## ここがすごい

- **位置を条件で表す**: 「どこまで進むか」を、深さと長さの二つの数で指定します。細かい位置の番号を、数える必要がありません。
- **深い方から先に抜ける**: 深さが深いあいだは、まず内側を読み切ってから、外側の項目に進みます。入れ子の構造を、正しい順序で読み進められます。
- **エラーを隠さない**: 途中で誤りがあれば、そこで止まって、呼び出し側に伝えます。読み飛ばしが壊れたデータで続くことはありません。

## まとめ

- `SkipUntil` は、指定の深さと要素数の条件を満たすまで、トークンを読み進めます。
- 内側から先に読み切り、外側の項目へ進みます。
- 途中のエラーは、そのまま呼び出し側に返します。
