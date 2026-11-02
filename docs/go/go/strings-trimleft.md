---
title: "先頭から指定の文字を消す strings.TrimLeft。カットセットに応じて道を変える"
description: "strings.TrimLeft の入口。カットセットが空か 1 文字か、ASCII だけか、Unicode を含むかで、3 つの専用の処理に振り分ける。速い道を先に試して、必要な場合だけ重い処理を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [997, 1008]
function: "TrimLeft"
difficulty: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.TrimLeft(s, cutset)` は、文字列の先頭から、`cutset` に含まれる文字をすべて取り除きます。例えば `strings.TrimLeft("000123", "0")` は `"123"` を返します。

この関数自体は短い振り分けの役目です。カットセットの中身を見て、一番速い方法を選びます。

## コード

```go:line-numbers=997
func TrimLeft(s, cutset string) string {
	if s == "" || cutset == "" {
		return s
	}
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimLeftByte(s, cutset[0])
	}
	if as, ok := makeASCIISet(cutset); ok {
		return trimLeftASCII(s, &as)
	}
	return trimLeftUnicode(s, cutset)
}
```

## 前提知識

- **カットセット**: 取り除きたい文字をまとめた文字列です。`"0"` なら `0` だけ、`"abc"` なら `a`、`b`、`c` の 3 つです。
- **ASCII の集合（ASCII set）**: 128 種類の ASCII 文字について、どれが含まれるかを、ビットで表したものです。判定が速くできます。
- **`RuneSelf`**: 128 のことです。これ未満の値が ASCII の文字です。
- **Unicode の判定**: マルチバイトの文字を含むカットセットは、文字単位で比べる必要があります。その分、処理が重くなります。

## 何をしているか

### 1. 空の場合は何もしない

```go:line-numbers=998
	if s == "" || cutset == "" {
		return s
	}
```

文字列が空か、カットセットが空なら、取り除く対象がないので、そのまま返します。

### 2. 1 バイトの文字なら、その文字だけを見る

```go:line-numbers=1001
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimLeftByte(s, cutset[0])
	}
```

カットセットが ASCII の 1 文字だけなら、`trimLeftByte` で、その 1 バイトを比べるだけで済みます。最も速い道です。

### 3. ASCII だけなら集合を使う

```go:line-numbers=1004
	if as, ok := makeASCIISet(cutset); ok {
		return trimLeftASCII(s, &as)
	}
```

カットセットが ASCII だけなら、`makeASCIISet` で集合を作ります。作れたら（`ok` が真なら）、その集合を使って、1 バイトずつ判定します。

### 4. それ以外は Unicode の道

```go:line-numbers=1007
	return trimLeftUnicode(s, cutset)
```

マルチバイトの文字が含まれていれば、文字単位で復号しながら比べる `trimLeftUnicode` に任せます。

## ここがすごい

- **よくある場合を先に判定**: 空白や 1 文字の区切りなど、実際によく使われる指定は、速い道を通ります。
- **速さと正しさの両立**: どの道を通っても、結果は同じです。速い道は、条件を満たすときだけ使われます。
- **振り分けだけを担当**: 実際の仕事は、それぞれの専用関数に任せています。この関数は、道を選ぶことに集中しています。

## まとめ

- `TrimLeft` は、カットセットの中身に応じて、専用の処理に振り分けます。
- 空や 1 バイトの文字は、最も速い道を通ります。
- ASCII だけなら、集合を使って 1 バイトずつ判定します。
- マルチバイトを含むときだけ、文字単位の処理を使います。
