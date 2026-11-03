---
title: "16 進数の文字列を復号して dst の末尾に足す hex の AppendDecode"
description: "encoding/hex の AppendDecode。src の 16 進数の文字を復号した結果を、dst の末尾に足して返す。必要な容量は slices.Grow で先に確保する。入力が不正なら、エラーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/hex/hex.go"
lines: [118, 123]
function: "AppendDecode"
difficulty: 2
tags: [メモリ管理, 入出力]
---

## ひとことで

`hex.AppendDecode(dst, src)` は、16 進数の文字 `src` を元のバイト列に戻し、その結果を `dst` の末尾に足して返します。入力が正しくなければ、エラーを返します。

## コード

```go:line-numbers=118
func AppendDecode(dst, src []byte) ([]byte, error) {
	n := DecodedLen(len(src))
	dst = slices.Grow(dst, n)
	n, err := Decode(dst[len(dst):][:n], src)
	return dst[:len(dst)+n], err
}
```

## 前提知識

- **16 進数の表記**: 1 バイトを、0 から f までの 2 文字で表す書き方です。
- **DecodedLen**: 入力の長さから、復号後のバイト数を求める関数です。
- **append と容量**: `append` は末尾に足します。容量が足りなければ、新しい配列を作ります。

## 何をしているか

### 1. 復号後の長さを求め、容量を確保する

```go:line-numbers=119
	n := DecodedLen(len(src))
	dst = slices.Grow(dst, n)
```

`DecodedLen` で、復号後のバイト数 `n` を求めます。`slices.Grow` で、`dst` に `n` 個分の空きを先に確保します。途中で配列を作り直さないためです。

### 2. 空きの部分に復号する

```go:line-numbers=121
	n, err := Decode(dst[len(dst):][:n], src)
```

`dst` の末尾にある空きの部分へ、`Decode` で復号します。実際に書けたバイト数が、`n` に入り直します。入力が不正なら、ここでエラーが返ります。

### 3. 書けた分だけ伸ばして返す

```go:line-numbers=122
	return dst[:len(dst)+n], err
```

実際に書いたバイト数だけ、`dst` の長さを伸ばして返します。エラーがあっても、途中まで書けた分は返ります。

## ここがすごい

- **容量を先に確保する**: 必要な大きさを一度に確保するので、復号の途中で配列が作り直されません。
- **実際の量で伸ばす**: 予定の長さではなく、書けた長さで伸ばすので、不完全な入力でも余計なバイトが残りません。

## まとめ

- `AppendDecode` は、16 進数の文字を復号して、`dst` の末尾に足します。
- 必要な容量は、先に確保します。
- 実際に書けたバイト数だけ、長さを伸ばします。
