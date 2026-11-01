---
title: "複数の Unicode 表のどれかに含まれるかを調べる unicode.In"
description: "unicode.In は、rune が渡された複数の RangeTable のどれか 1 つにでも含まれれば true を返します。順番に Is を呼び、最初に見つかった時点で止まります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/graphic.go"
lines: [69, 76]
function: "In"
difficulty: 1
format: 2
tags: [Unicode, 標準ライブラリ, 型システム]
---

## ひとことで

`unicode.In(r, unicode.Letter, unicode.Digit)` は、`r` が文字か数字なら `true` を返します。範囲の表を並べて渡せば、「どれかに当てはまるか」を 1 つの呼び出しで書けます。

## コード

```go:line-numbers=69
func In(r rune, ranges ...*RangeTable) bool {
	for _, inside := range ranges {
		if Is(inside, r) {
			return true
		}
	}
	return false
}
```

## 前提知識

- **`RangeTable`**: Unicode の文字の範囲を、まとめて表した表です。`unicode.Letter` や `unicode.Digit` が、その例です。
- **可変長引数 `...*RangeTable`**: 任意の個数の表を、スライスとして受け取ります。
- **`Is`**: 1 つの表に、`rune` が含まれるかを調べる関数です。
- **`range` と早期の `return`**: 最初に当てはまった時点で、残りを調べる必要はありません。

## 何をしているか

### 1. 表を順に見る

```go:line-numbers=70
	for _, inside := range ranges {
		if Is(inside, r) {
```

`ranges` を先頭から順に取り出します。引数の並びが、そのまま調べる順番になります。

### 2. 1 つの表で判定する

```go:line-numbers=71
		if Is(inside, r) {
			return true
		}
```

`Is(inside, r)` で、その表に `r` が含まれるかを調べます。含まれていれば、すぐに `true` を返します。

### 3. どの表にも無ければ false

```go:line-numbers=75
	return false
```

すべての表を見ても含まれなかったら、`false` を返します。

## ここがすごい

- **まとめて判定できる**: 複数の範囲を、ひとつの呼び出しで書けるので、`if` の条件が長くなりません。
- **見つかった時点で止まる**: 前に当てはまる表があれば、後ろの表は調べません。
- **表を組み合わせて作れる**: 表は、必要なものだけを自由に並べられます。

## まとめ

- 表を順に調べ、どれか 1 つに含まれれば `true` を返す。
- 表の並べ方が、調べる順番になる。
- 複数の範囲の判定が、1 つの呼び出しで書ける。
