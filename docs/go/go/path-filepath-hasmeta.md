---
title: "パスにワイルドカードの記号が含まれるか調べる hasMeta。OS によって記号の集まりを変える"
description: "path/filepath の hasMeta。パスに、ワイルドカードの記号（* ? [ など）が含まれるかを、strings.ContainsAny で一度に調べる。Windows では、バックスラッシュを記号に含めない。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/path/filepath/match.go"
lines: [352, 358]
function: "hasMeta"
difficulty: 1
tags: [文字列処理, 正規表現, 移植性]
---

## ひとことで

`hasMeta(path)` は、パスの中に、ワイルドカードの記号が含まれているかを返します。含まれていれば `true` です。例えば `*.go` は `true`、`main.go` は `false` です。

ワイルドカードとは、`*` や `?` など、任意の文字の代わりとして働く記号のことです。この関数は、パスがパターンなのか、ただの名前なのかを見分けるために使われます。

## コード

```go:line-numbers=352
func hasMeta(path string) bool {
	magicChars := `*?[`
	if runtime.GOOS != "windows" {
		magicChars = `*?[\`
	}
	return strings.ContainsAny(path, magicChars)
}
```

## 前提知識

- **ワイルドカード**: `*` は任意の文字列、`?` は任意の 1 文字、`[` は文字の集合を表します。
- **`strings.ContainsAny`**: 文字列の中に、指定した文字の集合のどれかが含まれるかを調べる関数です。
- **バックスラッシュ**: Windows では、パスの区切りに使われる記号です。そのため、ワイルドカードの記号としては扱わないのが普通です。
- **`runtime.GOOS`**: 今動いている OS の名前を表す値です。`"windows"` などの文字列が入ります。

## 何をしているか

### 1. 記号の集まりを用意する

```go
	magicChars := `*?[`
```

まず、既定の記号の集まり `*?[` を用意します。この時点では、バックスラッシュは含めていません。

### 2. Windows 以外ではバックスラッシュも含める

```go:line-numbers=354
	if runtime.GOOS != "windows" {
		magicChars = `*?[\`
	}
```

Windows 以外の OS では、バックスラッシュは記号として扱えます。その場合は、集まりに `\` を加えます。Windows ではパスの区切りになるので、加えません。

### 3. 含まれているかを調べる

```go:line-numbers=357
	return strings.ContainsAny(path, magicChars)
```

`ContainsAny` で、パスに集まりの中の文字が 1 つでもあるかを調べます。あれば `true` を返します。

## ここがすごい

- **1 行で判定**: 記号を 1 文字ずつ探す必要はなく、`ContainsAny` 1 回で済みます。
- **OS の違いを吸収**: 記号の集まりを OS に応じて変えることで、同じ関数が Windows でも他の OS でも正しく動きます。
- **役割が明確**: パターンかどうかだけを判定し、マッチの処理は別の関数に任せています。

## まとめ

- `hasMeta` は、パスにワイルドカードの記号が含まれるかを返します。
- 記号の集まりは、OS に応じて変えます。Windows ではバックスラッシュを含めません。
- `strings.ContainsAny` の 1 回の呼び出しで、判定が終わります。
