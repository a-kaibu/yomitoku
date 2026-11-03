---
title: "符号化した結果を dst の末尾に足す base64 の AppendEncode"
description: "encoding/base64 の AppendEncode。src を符号化した結果を、dst の末尾に足して返す。必要な容量は slices.Grow で先に確保し、新しい配列を作る回数を減らす。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/base64/base64.go"
lines: [198, 203]
function: "AppendEncode"
difficulty: 2
tags: [メモリ管理, 入出力]
---

## ひとことで

`enc.AppendEncode(dst, src)` は、`src` を base64 で符号化し、その結果を `dst` の末尾に足して返します。

## コード

```go:line-numbers=198
func (enc *Encoding) AppendEncode(dst, src []byte) []byte {
	n := enc.EncodedLen(len(src))
	dst = slices.Grow(dst, n)
	enc.Encode(dst[len(dst):][:n], src)
	return dst[:len(dst)+n]
}
```

## 前提知識

- **base64**: 64 種類の文字で、バイト列を表す符号化です。
- **append**: スライスの末尾に値を足します。容量が足りなければ、新しい配列を確保します。
- **dst と src**: `src` は符号化する元のデータ、`dst` は結果を足していく先です。

## 何をしているか

### 1. 符号化後の長さを求め、容量を確保する

```go:line-numbers=199
	n := enc.EncodedLen(len(src))
	dst = slices.Grow(dst, n)
```

`EncodedLen` で、符号化した後の長さ `n` を求めます。`slices.Grow` で、`dst` に `n` 個分の空きを先に確保します。こうすると、途中で何度も配列を作り直さずに済みます。

### 2. 空きの部分に符号化する

```go:line-numbers=201
	enc.Encode(dst[len(dst):][:n], src)
```

`dst` の末尾から `n` バイトの空きを切り出し、そこへ `Encode` で符号化を書き込みます。`dst` の中身は変わらず、末尾に結果が並びます。

### 3. 書き足した長さで返す

```go:line-numbers=202
	return dst[:len(dst)+n]
```

書き込んだ `n` バイトの分だけ、長さを伸ばして返します。

## ここがすごい

- **先に容量を確保する**: 必要な大きさを先に確保するので、符号化の途中で配列が作り直されることがありません。
- **既存の内容を残せる**: `dst` の中身を消さずに、末尾に足すので、複数の結果を一つのバッファにまとめられます。

## まとめ

- `AppendEncode` は、符号化の結果を `dst` の末尾に足します。
- 必要な容量を先に確保します。
- 符号化の本体は、`Encode` に任せます。
