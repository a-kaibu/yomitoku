---
title: "書き込み先が文字列の書き込みに対応しているかを調べる getStringWriter"
description: "strings パッケージの getStringWriter。io.Writer が WriteString を持つかを調べ、持っていればそのまま返す。持っていなければ、文字列を書けるように包んだ値を返す。Replacer の出力を効率よく行うための小さな変換。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/replace.go"
lines: [322, 328]
function: "getStringWriter"
difficulty: 1
tags: [型システム, 入出力, イディオム]
---

## ひとことで

`getStringWriter(w)` は、書き込み先 `w` を、文字列を書ける形に変えて返します。`w` が最初から文字列を書けるなら、そのまま返します。書けなければ、文字列を書けるように包んで返します。

`strings.Replacer` は、置き換えた結果を文字列として書き出します。書き込み先の種類に関係なく、同じ方法で書けるようにするための変換です。

## コード

```go:line-numbers=322
func getStringWriter(w io.Writer) io.StringWriter {
	sw, ok := w.(io.StringWriter)
	if !ok {
		sw = stringWriter{w}
	}
	return sw
}
```

## 前提知識

- **インターフェース**: 「この操作ができる」という約束を表す型です。`io.Writer` は、バイト列を書けるという約束です。
- **型アサーション**: 値が、ある約束を満たしているかを実行時に調べる書き方です。`w.(io.StringWriter)` の形で書きます。
- **`io.StringWriter`**: 文字列を直接書ける、という約束を表すインターフェースです。
- **包む（wrap）**: 既存の値を別の型の中に入れて、新しい約束を満たせるようにすることです。

## 何をしているか

### 1. 文字列を書けるかを確かめる

```go:line-numbers=323
	sw, ok := w.(io.StringWriter)
	if !ok {
		sw = stringWriter{w}
	}
```

`w` が `io.StringWriter` の約束を満たしていれば、`ok` は真になります。満たしていなければ、`stringWriter{w}` で包みます。包んだ値は、文字列を書けるように作られています。

### 2. 結果を返す

```go:line-numbers=327
	return sw
```

どちらの場合も、文字列を書ける値を返します。呼び出し側は、書き込み先の種類を気にせずに使えます。

## ここがすごい

- **できるならそのまま使う**: 最初から文字列を書けるなら、包まずに返します。無駄な変換を増やさず、速く動きます。
- **型の違いを隠す**: 呼び出し側は、一つの型だけを相手にすれば済みます。書き込み先の違いが、この関数の中で吸収されます。
- **包むだけで約束を補う**: 元の書き込みの仕組みを変えずに、足りない約束だけを外側で補っています。

## まとめ

- `getStringWriter` は、書き込み先が文字列を書けるかを確かめます。
- 書けるならそのまま、書けなければ包んだ値を返します。
- 呼び出し側は、書き込み先の種類を気にせずに文字列を書けます。
