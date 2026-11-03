---
title: "PEM の形式のバイト列を作る pem.EncodeToMemory。失敗したら nil を返す"
description: "encoding/pem の EncodeToMemory。Block の内容を PEM の形式で、メモリ上の bytes.Buffer に書き出す。書き出しに失敗したら nil を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/pem/pem.go"
lines: [329, 335]
function: "EncodeToMemory"
difficulty: 1
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`pem.EncodeToMemory(b)` は、`Block` の内容を PEM の形式のバイト列にして返します。書き出しに失敗したら、`nil` を返します。

## コード

```go:line-numbers=329
func EncodeToMemory(b *Block) []byte {
	var buf bytes.Buffer
	if err := Encode(&buf, b); err != nil {
		return nil
	}
	return buf.Bytes()
}
```

## 前提知識

- **PEM**: 証明書や鍵などを、テキストの形で表す形式です。`-----BEGIN` などの行で囲まれます。
- **Block**: PEM の一つ分のまとまりです。種類、ヘッダ、データを持ちます。
- **bytes.Buffer**: メモリ上で、バイトを少しずつ書き足せる型です。

## 何をしているか

### 1. メモリ上の箱に書き出す

```go:line-numbers=330
	var buf bytes.Buffer
	if err := Encode(&buf, b); err != nil {
		return nil
	}
```

`bytes.Buffer` を用意して、`Encode` で `Block` を書き出します。書き出しにエラーが出たら、途中の結果は使わず、`nil` を返します。

### 2. 書き出した内容を返す

```go:line-numbers=334
	return buf.Bytes()
```

エラーがなければ、箱の中のバイト列を返します。

## ここがすごい

- **書き出しを使い回す**: 実際の書き方は `Encode` に任せ、この関数は、メモリ上に受け取る役割だけを持ちます。
- **失敗は nil で示す**: 途中まで書けた部分を返さず、`nil` で失敗を示すので、不完全な結果を使わずに済みます。

## まとめ

- `EncodeToMemory` は、`Block` を PEM の形式のバイト列にします。
- 書き出しは `Encode` に任せ、結果を `bytes.Buffer` で受けます。
- 失敗したら、`nil` を返します。
