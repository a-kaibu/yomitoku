---
title: "読み残しのバイトを、コピーせずに返す bytes.Buffer.Bytes"
description: "bytes.Buffer.Bytes は、まだ読んでいないバイトを、内部の配列を指すスライスとして返します。コピーは作らず、読み取り位置より後ろを切り出すだけです。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [60, 60]
function: "Bytes"
difficulty: 1
format: 2
tags: [入出力, 標準ライブラリ, 最適化]
---

## ひとことで

`buf.Bytes()` は、まだ読んでいないバイトを、`[]byte` として返します。バッファの中身を、文字列に変えずに見たいときに使います。

## コード

```go:line-numbers=60
func (b *Buffer) Bytes() []byte { return b.buf[b.off:] }
```

## 前提知識

- **`bytes.Buffer` の内部**: 書き込んだバイトは `buf` に入り、読んだ位置は `off` で覚えています。
- **スライス式 `b[x:]`**: 配列の一部を、コピーせずに指す新しいスライスを作ります。
- **返したスライスの扱い**: 返されたスライスは、バッファと同じ配列を指します。中身を書き換えると、バッファの中身も変わります。
- **読み取りとは別の操作**: `Bytes` は位置を進めません。何度呼んでも、同じ読み残しが返ります。

## 何をしているか

### 1. 読み取り位置から後ろを切り出す

```go:line-numbers=60
func (b *Buffer) Bytes() []byte { return b.buf[b.off:] }
```

`b.buf[b.off:]` は、読み取り位置 `off` から末尾までのスライスです。読んだ分は含まれず、まだ読んでいないバイトだけが残ります。

## ここがすごい

- **コピーが起きない**: 配列の一部を指すだけなので、大きなバッファでも余分なメモリを使いません。
- **位置を動かさない**: 中身を見ても、読み取りの状態は変わりません。読み出しの操作と分けて使えます。
- **1 行で済む**: 切り出しの式だけで、読み残しを得られます。

## まとめ

- 読み取り位置から後ろを、コピーせずに切り出して返す。
- 返したスライスは、バッファと配列を共有する。
- 読み取り位置は変わらない。
