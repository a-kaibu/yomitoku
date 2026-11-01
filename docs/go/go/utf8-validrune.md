---
title: "文字として正しい値の範囲を調べる utf8.ValidRune"
description: "utf8.ValidRune は、rune の値が、Unicode の文字として使える範囲にあるかを返します。サロゲートの範囲と、範囲を超えた値を除いて判定します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [570, 578]
function: "ValidRune"
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`utf8.ValidRune(0x3042)` は `true` を返します。`0x3042` は `あ` の番号です。一方、`0xD800` や、範囲を超えた値は `false` になります。

## コード

```go:line-numbers=570
func ValidRune(r rune) bool {
	switch {
	case 0 <= r && r < surrogateMin:
		return true
	case surrogateMax < r && r <= MaxRune:
		return true
	}
	return false
}
```

## 前提知識

- **`rune`**: 1 文字の番号を表す整数です。ここでは、その番号が有効かを調べます。
- **サロゲート**: 0xD800 から 0xDFFF までの範囲です。UTF-16 の途中の印に使う番号で、単独の文字としては使えません。
- **`MaxRune`**: 文字として使える一番大きな値です。0x10FFFF です。
- **`switch` の条件式**: 条件を並べて、最初に真になったものを実行します。

## 何をしているか

### 1. 小さい方の範囲を確かめる

```go:line-numbers=571
	switch {
	case 0 <= r && r < surrogateMin:
		return true
```

`0` 以上で、サロゲートの最小値より小さい値は、有効な文字の番号です。0 から 0xD7FF までが、ここに入ります。

### 2. 大きい方の範囲を確かめる

```go:line-numbers=574
	case surrogateMax < r && r <= MaxRune:
		return true
```

サロゲートの最大値より大きく、`MaxRune` 以下の値も有効です。0xE000 から 0x10FFFF までが、ここに入ります。

### 3. どちらにも入らなければ無効

```go:line-numbers=577
	return false
```

負の値、サロゲートの範囲、`MaxRune` を超える値は、どの場合にも当てはまりません。そのため `false` を返します。

## ここがすごい

- **例外の範囲を 2 つで表す**: 有効な範囲は「サロゲートを除いた全体」です。2 つの区間を並べるだけで、その例外を表せます。
- **負の値も同時に防ぐ**: 最初の条件の `0 <=` が、負の値を除きます。`rune` が符号付きの整数なので、この確認が必要です。
- **符号付きの型で無効な値を拾う**: 符号付きの型でも、判定の順序を守れば、扱いにくい値を安全に除けます。

## まとめ

- 有効な範囲は、0 以上でサロゲートを除き、`MaxRune` 以下のものである。
- 2 つの区間を `switch` で調べ、どちらにも入らなければ無効とする。
- 負の値も、最初の条件で同時に除かれる。
