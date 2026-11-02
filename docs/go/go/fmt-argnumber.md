---
title: "引数の番号指定 %[2]d を読む fmt.argNumber。範囲外なら失敗を伝える"
description: "fmt の書式の中で %[n]d のように引数番号を指定する部分を読む argNumber。角括弧の中の番号を解析し、引数の数の範囲に入っているかを確かめる。範囲外なら、後の処理で警告を出す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/print.go"
lines: [986, 997]
function: "argNumber"
difficulty: 3
tags: [文字列処理, パース, 防御的プログラミング]
---

## ひとことで

`fmt.Sprintf("%[2]d %[1]d", 10, 20)` は `"20 10"` を返します。`%[2]d` は、2 番目の引数を使うという指定です。この番号指定の部分を読むのが `argNumber` です。番号が引数の数の範囲にあれば、その番号を使い、なければ失敗として扱います。

## コード

```go:line-numbers=986
func (p *pp) argNumber(argNum int, format string, i int, numArgs int) (newArgNum, newi int, found bool) {
	if len(format) <= i || format[i] != '[' {
		return argNum, i, false
	}
	p.reordered = true
	index, wid, ok := parseArgNumber(format[i:])
	if ok && 0 <= index && index < numArgs {
		return index, i + wid, true
	}
	p.goodArgNum = false
	return argNum, i + wid, ok
}
```

## 前提知識

- **書式の引数番号**: `%[n]` の形で、使う引数の番号を指定できます。`n` は 1 から始まります。
- **`reordered` フラグ**: 番号指定を使ったことを覚えておくフラグです。番号を使うと、引数の順番が通常と違うため、後の検査に影響します。
- **`parseArgNumber`**: `[12]` のような角括弧の中の数字を読んで、番号と長さを返す関数です。
- **`goodArgNum`**: 番号指定が正しかったかを覚えておく、状態のフラグです。

## 何をしているか

### 1. 角括弧で始まらなければ何もしない

```go:line-numbers=987
	if len(format) <= i || format[i] != '[' {
		return argNum, i, false
	}
```

今の位置が `[` でなければ、番号指定ではないので、そのまま返します。`found` が `false` なので、呼び出し側は通常の処理を続けます。

### 2. 番号を読んで範囲を確かめる

```go:line-numbers=990
	p.reordered = true
	index, wid, ok := parseArgNumber(format[i:])
	if ok && 0 <= index && index < numArgs {
		return index, i + wid, true
	}
```

番号指定を使ったことを記録し、角括弧の中の番号を読みます。番号が 0 以上で、引数の数より小さければ、その番号を新しい引数の位置として返します。`wid` は角括弧の長さで、その分だけ書式の位置を進めます。

### 3. 範囲外なら失敗を記録する

```go:line-numbers=995
	p.goodArgNum = false
	return argNum, i + wid, ok
```

番号が範囲の外なら、番号指定が正しくなかったと記録します。そのあと、元の引数の位置を返します。後で、`%!d(BADINDEX)` のような表示になります。

## ここがすごい

- **失敗しても進める**: 不正な番号でも、書式の解析は止めません。どこまで読んだかを正しく返すので、残りの書式が続けて処理されます。
- **状態を覚えておく**: `reordered` と `goodArgNum` を覚えておけば、最後に「引数が余っている」「番号が不正」などの警告を正しく出せます。
- **番号と位置を一緒に返す**: 引数の番号と、書式の次の位置を同時に返すので、呼び出し側の処理が 1 回で済みます。

## まとめ

- `argNumber` は、書式の `%[n]` の番号を読みます。
- 角括弧で始まらなければ、何もせずに戻ります。
- 番号が引数の範囲内なら、その番号を使います。
- 範囲外なら、失敗を記録して、解析を続けます。
