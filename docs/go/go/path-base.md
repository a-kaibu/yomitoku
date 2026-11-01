---
title: "末尾のスラッシュを無視して、最後の要素名を取り出す path.Base"
description: "path.Base は、パスの最後の要素だけを返します。末尾のスラッシュを先に取り除き、最後の「/」の後ろを取り出すという、2 段の処理で書かれています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/path/path.go"
lines: [192, 209]
function: "Base"
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`path.Base("/a/b/c.txt")` は `"c.txt"` を返します。パスの中で、最後の `/` より後ろの部分を取り出します。

`"a/b/"` のように末尾にスラッシュがあっても、`"b"` を返します。空の文字列は `"."`、スラッシュだけの文字列は `"/"` を返します。

## コード

::: code-group

```go:line-numbers=192 [日本語訳]
func Base(path string) string {
	if path == "" {
		return "."
	}
	// 末尾のスラッシュを取り除く。
	for len(path) > 0 && path[len(path)-1] == '/' {
		path = path[0 : len(path)-1]
	}
	// 最後の要素を探す
	if i := bytealg.LastIndexByteString(path, '/'); i >= 0 {
		path = path[i+1:]
	}
	// 空になったら、スラッシュだけだった。
	if path == "" {
		return "/"
	}
	return path
}
```

```go:line-numbers=192 [原文]
func Base(path string) string {
	if path == "" {
		return "."
	}
	// Strip trailing slashes.
	for len(path) > 0 && path[len(path)-1] == '/' {
		path = path[0 : len(path)-1]
	}
	// Find the last element
	if i := bytealg.LastIndexByteString(path, '/'); i >= 0 {
		path = path[i+1:]
	}
	// If empty now, it had only slashes.
	if path == "" {
		return "/"
	}
	return path
}
```

:::

## 前提知識

- **パスの区切り**: `path` パッケージでは、区切りは常に `/` です。Windows の `\` は扱いません。
- **`path[len(path)-1]`**: 文字列の最後のバイトです。
- **`bytealg.LastIndexByteString`**: 文字列の中で、指定した文字が最後に現れる位置を返す内部関数です。
- **`if i := ...; i >= 0`**: `if` の中で変数を宣言し、その場で条件を調べる書き方です。

## 何をしているか

`path = "a/b/"` で追います。

### 1. 空の場合

```go:line-numbers=193
	if path == "" {
		return "."
	}
```

空のパスは、カレントディレクトリを表す `"."` です。

### 2. 末尾のスラッシュを取り除く

```go:line-numbers=196
	// Strip trailing slashes.
	for len(path) > 0 && path[len(path)-1] == '/' {
		path = path[0 : len(path)-1]
	}
```

`"a/b/"` の末尾の `/` を取り除いて、`"a/b"` にします。スラッシュが何個続いていても、全部取り除きます。

### 3. 最後の要素を取り出す

```go:line-numbers=200
	// Find the last element
	if i := bytealg.LastIndexByteString(path, '/'); i >= 0 {
		path = path[i+1:]
	}
```

最後の `/`（位置 1）を見つけて、その後ろの `"b"` を取り出します。`/` がなければ、パス全体が 1 つの要素です。

### 4. 空になったらスラッシュ

```go:line-numbers=204
	// If empty now, it had only slashes.
	if path == "" {
		return "/"
	}
```

`"///"` のように、スラッシュだけだった場合は、すべて取り除かれて空になります。そこで `"/"` を返します。

## ここがすごい

- **末尾の処理を先に済ませる**: 末尾のスラッシュを先に取り除くので、最後の `/` を探すときに、空の要素を気にしなくて済みます。
- **特別な場合を言葉で決めている**: 空、スラッシュだけ、の 2 つの場合の戻り値が、コメントと一緒に決められています。境界の値を明確にしておくと、呼び出し側も迷いません。
- **コピーを作らない**: 結果は元の文字列の一部です。`path = path[i+1:]` は、新しい文字列を作らずに切り出すだけです。

## まとめ

- パスの最後の要素は、末尾の区切りを取り除いてから、最後の区切りの後ろを取り出す。
- 空やスラッシュだけの入力は、先に戻り値を決めておくと分かりやすい。
- 部分文字列の切り出しは、コピーなしで済む。
