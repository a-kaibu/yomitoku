---
title: "符号つきの文字列を整数に変える time の atoi。残りがあれば失敗にする"
description: "time パッケージの atoi。先頭の + か - の符号を取り除き、先頭から数字を読んで整数にする。数字の後ろに余計な文字が残っていれば失敗させる。ジェネリクスで、バイト列と文字列の両方を受け取る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [471, 486]
function: "atoi"
difficulty: 2
tags: [文字列処理, 数値計算, 防御的プログラミング]
---

## ひとことで

`atoi(s)` は、文字列を整数に変換します。`"-42"` は `-42`、`"+7"` は `7` です。ただし、数字のあとに余計な文字が残っていると、失敗としてエラーを返します。

`strconv.Atoi` に似ていますが、この関数は時刻の書式を読む専用の部品です。時刻の書式は、途中で止めて読み進める必要があるため、残りの文字を見る仕組みが組み込まれています。

## コード

```go:line-numbers=471
func atoi[bytes []byte | string](s bytes) (x int, err error) {
	neg := false
	if len(s) > 0 && (s[0] == '-' || s[0] == '+') {
		neg = s[0] == '-'
		s = s[1:]
	}
	q, rem, err := leadingInt(s)
	x = int(q)
	if err != nil || len(rem) > 0 {
		return 0, errAtoi
	}
	if neg {
		x = -x
	}
	return x, nil
}
```

## 前提知識

- **符号**: 数の前に付く `+` や `-` です。`-` なら負の数、`+` なら正の数になります。
- **`leadingInt`**: 先頭から数字を読み、その値と、読み残しの部分を返す内部の関数です。
- **読み残し（rem）**: 数字を読んだあとに残った部分です。空でなければ、変換の途中で余計な文字があったことになります。
- **ジェネリクス**: `bytes []byte | string` は、バイト列か文字列のどちらでも受け取れる、という指定です。

## 何をしているか

### 1. 符号を取り除いて覚えておく

```go:line-numbers=473
	if len(s) > 0 && (s[0] == '-' || s[0] == '+') {
		neg = s[0] == '-'
		s = s[1:]
	}
```

先頭が `-` か `+` なら、`neg` に符号を覚えておきます。そのあと、先頭の 1 文字を取り除きます。

### 2. 数字を読んで、残りを確かめる

```go:line-numbers=477
	q, rem, err := leadingInt(s)
	x = int(q)
	if err != nil || len(rem) > 0 {
		return 0, errAtoi
	}
```

`leadingInt` で、先頭の数字を読みます。読めなかったとき、または読み残しがあったときは、変換に失敗したとみなして `errAtoi` を返します。

### 3. 符号を戻して返す

```go:line-numbers=482
	if neg {
		x = -x
	}
	return x, nil
```

符号が負だったなら、値を反転させます。そのうえで、整数と `nil` を返します。

## ここがすごい

- **読み残しで誤りを見つける**: 数字だけで全体が決まっているかを、残りの長さで確かめます。`"12abc"` のような入力は、必ず失敗します。
- **符号を別に扱う**: 符号を先に取り除き、最後に戻すので、数字の読み取りは常に正の値として行えます。
- **型を選ばない**: ジェネリクスにより、バイト列と文字列のどちらからでも、同じ処理で変換できます。

## まとめ

- `atoi` は、符号つきの文字列を整数に変えます。
- 数字のあとに余計な文字があれば、失敗として `errAtoi` を返します。
- 符号は先に覚えておき、最後に値へ反映させます。
