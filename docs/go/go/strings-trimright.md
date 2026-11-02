---
title: "文字列の末尾から指定の文字を消す TrimRight。前と同じく 3 つの道に分ける"
description: "strings.TrimRight の入口。カットセットが空か 1 文字か、ASCII だけか、Unicode を含むかで、3 つの専用の処理に振り分ける。末尾から見る点だけが TrimLeft と違う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [1042, 1053]
function: "TrimRight"
difficulty: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.TrimRight(s, cutset)` は、文字列の末尾から、`cutset` に含まれる文字をすべて取り除きます。例えば `strings.TrimRight("123000", "0")` は `"123"` を返します。

先頭から見る `TrimLeft` と、末尾から見る `TrimRight` は、同じ考え方でできています。この関数も、カットセットの中身に応じて、一番速い方法を選ぶ振り分けの役目です。

## コード

```go:line-numbers=1042
func TrimRight(s, cutset string) string {
	if s == "" || cutset == "" {
		return s
	}
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimRightByte(s, cutset[0])
	}
	if as, ok := makeASCIISet(cutset); ok {
		return trimRightASCII(s, &as)
	}
	return trimRightUnicode(s, cutset)
}
```

## 前提知識

- **カットセット**: 取り除きたい文字をまとめた文字列です。`"0"` なら `0` だけ、`"abc"` なら `a`、`b`、`c` の 3 つです。
- **ASCII の集合**: 128 種類の ASCII 文字について、含まれるかどうかをビットで表したものです。
- **`RuneSelf`**: 128 のことです。これ未満の値が ASCII の文字です。
- **末尾**: 文字列の一番後ろです。`TrimRight` は、この側から文字を取り除いていきます。

## 何をしているか

### 1. 取り除くものがなければ、そのまま返す

```go:line-numbers=1043
	if s == "" || cutset == "" {
		return s
	}
```

文字列が空か、カットセットが空なら、何も取り除かないので、元の文字列をそのまま返します。

### 2. 1 バイトの文字なら、その文字だけを見る

```go:line-numbers=1046
	if len(cutset) == 1 && cutset[0] < utf8.RuneSelf {
		return trimRightByte(s, cutset[0])
	}
```

カットセットが ASCII の 1 文字だけなら、末尾の 1 バイトを比べるだけで済みます。`trimRightByte` の処理が、この場合の専用の道です。

### 3. それ以外は集合か、Unicode の道を使う

```go:line-numbers=1049
	if as, ok := makeASCIISet(cutset); ok {
		return trimRightASCII(s, &as)
	}
	return trimRightUnicode(s, cutset)
```

カットセットが ASCII だけなら、集合を作って、末尾から 1 バイトずつ判定します。マルチバイトの文字を含むときだけ、文字単位で復号しながら比べる `trimRightUnicode` に任せます。

## ここがすごい

- **よくある場合を先に判定**: 空白や 1 文字の区切りなど、実際によく使われる指定は、一番速い道を通ります。
- **先頭と末尾で対称**: `TrimLeft` と同じ 3 つの道を持つので、どちらを読んでも、同じ形で理解できます。
- **振り分けだけを担当**: 実際の仕事は、それぞれの専用の関数に任せています。この関数は、道を選ぶことだけに集中しています。

## まとめ

- `TrimRight` は、末尾から、カットセットに含まれる文字を取り除きます。
- 空や 1 バイトの文字は、最も速い道を通ります。
- ASCII だけなら集合を使い、マルチバイトを含むときだけ、文字単位の処理を使います。
