---
title: "ASCII の集合に含まれる文字を末尾から削る bytes.trimRightASCII"
description: "bytes パッケージの trimRightASCII。バイト列の末尾から見て、ASCII の集合に含まれるバイトが続く間だけ削る。削る対象が決まっているので、1 バイトずつ判定するだけで済む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/bytes.go"
lines: [1086, 1094]
function: "trimRightASCII"
difficulty: 1
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`trimRightASCII(s, as)` は、バイト列 `s` の末尾から、集合 `as` に含まれる ASCII のバイトを取り除きます。`as` は、削る対象の文字を、あらかじめ 1 つの値にまとめたものです。

`bytes.TrimRight` は、カットセットが ASCII だけのときに、この関数を使って処理します。先頭から削る `trimLeftASCII` と、対になる関数です。

## コード

```go:line-numbers=1086
func trimRightASCII(s []byte, as *asciiSet) []byte {
	for len(s) > 0 {
		if !as.contains(s[len(s)-1]) {
			break
		}
		s = s[:len(s)-1]
	}
	return s
}
```

## 前提知識

- **ASCII の集合（asciiSet）**: 128 種類の ASCII 文字について、対象かどうかを記録した値です。ビットの並びで表されるので、1 つの文字を判定するのが速くできます。
- **バイト列（`[]byte`）**: バイトを並べた配列です。`bytes` パッケージは、この型を扱います。
- **`contains`**: 集合に、そのバイトが含まれるかを返すメソッドです。
- **末尾**: バイト列の一番後ろです。この関数は、そこから削っていきます。

## 何をしているか

### 1. 末尾が削る対象かを確かめる

```go:line-numbers=1088
		if !as.contains(s[len(s)-1]) {
			break
		}
```

末尾の 1 バイトが、集合に含まれるかを調べます。含まれていなければ、それ以上削る必要はないので、ループを抜けます。

### 2. 末尾を 1 バイト切り落とす

```go:line-numbers=1091
		s = s[:len(s)-1]
```

含まれていれば、末尾の 1 バイトを切り落とします。`s[:len(s)-1]` は、元の配列の前半を指すだけで、コピーは作りません。

### 3. 残ったバイト列を返す

```go:line-numbers=1093
	return s
```

削る対象でないバイトに出会ったら、残りがそのまま結果になります。空になっても、そのまま空のバイト列が返ります。

## ここがすごい

- **集合で一度に判定**: 削る文字がいくつあっても、判定は集合への問い合わせ 1 回です。文字の一覧を、毎回探し直す必要はありません。
- **コピーなし**: 末尾を切り落とすだけなので、新しいメモリを使いません。大きなデータでも、軽い処理です。
- **先頭側の処理と対になる**: 先頭から見る版と、末尾から見る版が、同じ形で書かれています。どちらかを理解すれば、もう片方も読めます。

## まとめ

- `trimRightASCII` は、末尾から ASCII の集合に含まれるバイトを削ります。
- 集合への問い合わせで、1 バイトずつ判定します。
- コピーを作らず、元のバイト列の前半を指して返します。
