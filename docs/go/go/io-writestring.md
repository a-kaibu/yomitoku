---
title: "書き込み先が文字列を直接受け取れるなら、コピーせずに書く io.WriteString"
description: "io.WriteString は、文字列を Writer に書きます。書き込み先が WriteString メソッドを持っていれば、バイトに変換せずに直接渡します。持っていなければ、ふつうの Write に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [314, 319]
function: "WriteString"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, イディオム, API設計]
---

## ひとことで

`io.WriteString(w, s)` は、文字列 `s` を `w` に書きます。`io.Writer` の `Write` は `[]byte` を受け取るので、ふつうに書くと文字列をバイトのスライスに変換する必要があります。

この関数は、`w` が文字列を直接受け取れる型なら、その機能を使います。変換のコピーを省くためです。

## コード

```go:line-numbers=314
func WriteString(w Writer, s string) (n int, err error) {
	if sw, ok := w.(StringWriter); ok {
		return sw.WriteString(s)
	}
	return w.Write([]byte(s))
}
```

## 前提知識

- **`io.Writer`**: `Write([]byte) (int, error)` を持つインターフェースです。ファイルや、ネットワーク、バッファなどが実装します。
- **`io.StringWriter`**: `WriteString(string) (int, error)` を持つインターフェースです。`strings.Builder` や `bufio.Writer` などが実装しています。
- **型アサーション `w.(StringWriter)`**: 値がそのインターフェースを満たしているかを調べ、満たしていれば、その型として取り出します。`ok` が `true` のときだけ使えます。
- **`[]byte(s)`**: 文字列をバイトのスライスに変換します。このときメモリのコピーが起きます。

## 何をしているか

### 1. 文字列を書けるかを調べる

```go:line-numbers=315
	if sw, ok := w.(StringWriter); ok {
		return sw.WriteString(s)
	}
```

`w` が `WriteString` を持っているかを調べます。`strings.Builder` なら持っているので、`sw.WriteString(s)` を呼びます。文字列のまま書けるので、変換は起きません。

### 2. ない場合は Write に任せる

```go:line-numbers=318
	return w.Write([]byte(s))
```

持っていないなら、文字列をバイトのスライスに変えて `Write` を呼びます。この変換のコピーは、ここでだけ起きます。

## ここがすごい

- **使えるなら速い道**: 多くの書き込み先は文字列を直接扱えるので、その場合は変換のコピーが不要です。一方で、どんな `Writer` でも使えます。
- **インターフェースの任意の機能を使う**: 必須ではない機能を、型アサーションで確かめて使うという設計です。`Writer` の定義を変えずに、速さを追加できます。
- **呼び出し側が意識しない**: 呼び出し側は、どちらの道が使われるかを知らなくても、同じ関数を呼べます。

## まとめ

- 必須ではない機能は、型アサーションで確かめて使うと、インターフェースを広げずに速くできる。
- 変換が必要な場合は、その 1 か所でだけコピーが起きるように書く。
- 呼び出し側から見て同じ関数として使えるように、分岐は関数の中に閉じ込める。
