---
title: "環境変数の区切りでパスを分ける filepath の splitList"
description: "path/filepath の splitList。PATH のように区切られたパスの一覧を、区切り文字で分割してスライスにする。空の文字列なら、要素を持たない空のスライスを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/path/filepath/path_unix.go"
lines: [21, 26]
function: "splitList"
difficulty: 1
tags: [文字列処理, 入出力]
---

## ひとことで

`splitList(path)` は、`PATH` のように区切られたパスの一覧を、区切り文字で分けて、文字列のスライスにします。

## コード

```go:line-numbers=21
func splitList(path string) []string {
	if path == "" {
		return []string{}
	}
	return strings.Split(path, string(ListSeparator))
}
```

## 前提知識

- **PATH のような一覧**: 複数のディレクトリを、コロンなどの区切り文字でつないだ文字列です。Unix 系では `:` が使われます。
- **ListSeparator**: 環境で使われる区切り文字を表す定数です。`os.PathListSeparator` と同じ値です。
- **strings.Split**: 文字列を、区切り文字で分けてスライスにする関数です。

## 何をしているか

### 1. 空の文字列なら空のスライスを返す

```go:line-numbers=22
	if path == "" {
		return []string{}
	}
```

空の文字列を分けると、空の要素が一つできてしまいます。それを避けるため、空の文字列には、要素のないスライスを返します。

### 2. 区切り文字で分ける

```go:line-numbers=25
	return strings.Split(path, string(ListSeparator))
```

区切り文字で文字列を分け、その結果のスライスを返します。

## ここがすごい

- **空の入力を特別扱いする**: 空の文字列で、空の要素が入るという、分かりにくい結果を避けています。
- **分けるだけの関数**: 実際の分割は `strings.Split` に任せ、この関数は空の場合だけを処理します。

## まとめ

- `splitList` は、区切られたパスの一覧を分けてスライスにします。
- 空の文字列では、要素のないスライスを返します。
- 分割は、`strings.Split` に任せます。
