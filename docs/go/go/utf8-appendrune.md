---
title: "文字を UTF-8 にして追加する utf8.AppendRune"
description: "utf8.AppendRune は、rune を UTF-8 のバイト列にして、スライスの末尾へ追加します。ASCII は 1 バイトをそのまま追加し、それ以外は appendRuneNonASCII に任せます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [410, 416]
function: "AppendRune"
difficulty: 1
format: 2
tags: [Unicode, 入出力, 最適化, 標準ライブラリ]
---

## ひとことで

`utf8.AppendRune(buf, 'あ')` は、`buf` の末尾に `あ` の UTF-8 の 3 バイトを追加して返します。`bytes.Buffer` の `WriteRune` も、この関数を使っています。

## コード

::: code-group

```go:line-numbers=410 [日本語訳]
func AppendRune(p []byte, r rune) []byte {
	// この関数はインライン化しやすく小さく保ち、ASCII を速く扱う。
	if uint32(r) <= rune1Max {
		return append(p, byte(r))
	}
	return appendRuneNonASCII(p, r)
}
```

```go:line-numbers=410 [原文]
func AppendRune(p []byte, r rune) []byte {
	// This function is inlineable for fast handling of ASCII.
	if uint32(r) <= rune1Max {
		return append(p, byte(r))
	}
	return appendRuneNonASCII(p, r)
}
```

:::

## 前提知識

- **`rune`**: 1 文字を表す整数です。
- **ASCII の範囲**: 値が 0 から 0x7F までなら、UTF-8 では 1 バイトです。
- **`append`**: スライスの末尾に値を追加します。容量が足りなければ、新しい配列を作ります。
- **`rune1Max`**: 1 バイトで表せる最大の値です。

## 何をしているか

### 1. ASCII は 1 バイトで追加する

```go:line-numbers=411
	// この関数はインライン化しやすく小さく保ち、ASCII を速く扱う。
	if uint32(r) <= rune1Max {
		return append(p, byte(r))
	}
```

値が `rune1Max` 以下なら、`byte(r)` を 1 つ追加して返します。ASCII の文字では、この関数の中で仕事が終わります。コメントにあるとおり、この部分は小さく保たれ、呼び出しの場所に展開されやすくなっています。

### 2. それ以外は専用の関数に任せる

```go:line-numbers=415
	return appendRuneNonASCII(p, r)
```

ASCII 以外の文字は、`appendRuneNonASCII` が 2、3、4 バイトのどれかに変換して追加します。

## ここがすごい

- **速い道を一番上に置く**: 多くの文字は ASCII なので、1 バイトの追加だけで済みます。
- **役割を分ける**: 公開の関数は短い判定だけを行い、複雑な変換を内部の関数に任せます。
- **書き込み先を選ばない**: 既存のスライスに追加するので、新しい配列を作る回数を抑えられます。

## まとめ

- ASCII は 1 バイトをそのまま追加する。
- それ以外は、内部の関数で 2 から 4 バイトに変換して追加する。
- 既存のスライスの末尾に書けるので、無駄な確保が少ない。
