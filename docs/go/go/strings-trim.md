---
title: "両端から指定した文字だけを取り除く strings.Trim"
description: "strings.Trim は、文字列の両端から、指定した文字の集合に含まれる文字を取り除きます。1 文字の場合、ASCII だけの場合、Unicode を含む場合で処理を変えて速くします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [980, 991]
function: "Trim"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.Trim("!!hello!!", "!")` は `hello` を返します。両端にある `!` を、端が違う文字になるまで取り除きます。取り除く文字の集合を、`cutset` として渡します。

## コード

```go:line-numbers=980
func Trim(s, cutset string) string {
	if s == "" || cutset == "" {
		return s
	}
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimLeftByte(trimRightByte(s, cutset[0]), cutset[0])
	}
	if as, ok := makeASCIISet(cutset); ok {
		return trimLeftASCII(trimRightASCII(s, &as), &as)
	}
	return trimLeftUnicode(trimRightUnicode(s, cutset), cutset)
}
```

## 前提知識

- **`cutset`**: 取り除く文字の集まりです。文字列の各文字が、この集まりに含まれるかで判定します。
- **`TrimLeft` と `TrimRight`**: 左端、右端だけを取り除く関数です。`Trim` は両方を行います。
- **ASCII と Unicode**: ASCII の文字は 1 バイトです。それ以外は複数のバイトになるので、扱いを変えます。
- **`makeASCIISet`**: 文字の並びを、ASCII の集合に変える関数です。

## 何をしているか

### 1. 何もない場合は即座に返す

```go:line-numbers=981
	if s == "" || cutset == "" {
		return s
	}
```

文字列か `cutset` のどちらかが空なら、取り除くものが無いので、元の文字列を返します。

### 2. 1 文字の ASCII は最も速い道

```go:line-numbers=984
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimLeftByte(trimRightByte(s, cutset[0]), cutset[0])
	}
```

`cutset` が 1 文字の ASCII なら、バイトの比較だけで両端を取り除きます。よく使われる場面なので、専用の道を用意しています。

### 3. ASCII の集合で判定する

```go:line-numbers=987
	if as, ok := makeASCIISet(cutset); ok {
		return trimLeftASCII(trimRightASCII(s, &as), &as)
	}
```

`cutset` がすべて ASCII なら、`makeASCIISet` で集合を作り、両端を集合で判定します。文字ごとに並びを探すより速く済みます。

### 4. それ以外は Unicode で処理する

```go:line-numbers=990
	return trimLeftUnicode(trimRightUnicode(s, cutset), cutset)
```

非 ASCII の文字が混ざっていれば、Unicode の文字として 1 文字ずつ判定します。少し遅くなりますが、正しく動きます。

## ここがすごい

- **よくある場合を速くする**: 1 文字や ASCII だけの場合を、先に処理します。
- **集合を一度作って使い回す**: 集合を作ってから、両端の判定に同じものを使うので、無駄な比較をしません。
- **正しさを優先する**: 速い道が使えないときは、確実な Unicode の処理に切り替えます。

## まとめ

- 空なら何もせず、1 文字の ASCII は比較だけで処理する。
- ASCII の集合を作れるときは、それで両端を判定する。
- 非 ASCII が混ざるときは、Unicode の処理に任せる。
