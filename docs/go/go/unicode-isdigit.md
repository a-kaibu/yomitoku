---
title: "範囲が狭い場合は 1 つの比較で、それ以外は表で数字を判定する IsDigit"
description: "unicode.IsDigit は、文字が十進数の数字かを返します。ASCII の 0〜9 は 1 回の範囲比較で判定し、それ以外の文字だけ Unicode の数字の表を引きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/digit.go"
lines: [8, 13]
function: "IsDigit"
difficulty: 1
format: 2
tags: [Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`unicode.IsDigit(r)` は、文字 `r` が十進数の数字（0 から 9 の仲間）かを返します。`'7'` は `true`、`'a'` は `false` です。

Unicode には、ASCII の `0` から `9` 以外にも、アラビア数字やインド数字などの数字があります。この関数は、そうした文字も `true` にします。

## コード

```go:line-numbers=8
func IsDigit(r rune) bool {
	if r <= MaxLatin1 {
		return '0' <= r && r <= '9'
	}
	return isExcludingLatin(Digit, r)
}
```

## 前提知識

- **`MaxLatin1`**: Latin-1 の最大値、`0xFF`（255）です。ここまでの文字は、1 バイトに収まります。
- **文字の範囲比較**: `'0' <= r && r <= '9'` は、文字コードが連続する範囲に入っているかを調べます。
- **`isExcludingLatin`**: Latin-1 より大きい文字について、指定した表（ここでは `Digit`）を引いて判定する、内部の関数です。
- **Unicode の数字**: 数字のカテゴリには、多くの文字体系の数字が含まれています。例として、アラビア・インド数字の `'٣'`（U+0663）があります。

## 何をしているか

### 1. Latin-1 の範囲は範囲比較で判定する

```go:line-numbers=9
	if r <= MaxLatin1 {
		return '0' <= r && r <= '9'
	}
```

`'7'` は 55 なので、`'0'`（48）以上で `'9'`（57）以下です。`true` を返します。`'a'` は範囲の外なので `false` です。

### 2. それ以外は表で判定する

```go:line-numbers=12
	return isExcludingLatin(Digit, r)
```

`'٣'`（U+0663）は Latin-1 より大きいので、`Digit` の表を引きます。表には数字として登録されているので、`true` になります。

## ここがすごい

- **よく使う範囲を 1 つの比較で**: 文字列の中の数字の多くは ASCII です。その場合は、表を引かずに 2 回の比較で答えが出ます。
- **表を必要なときだけ使う**: 表の検索は、Latin-1 より大きい文字でだけ行われます。表そのものは大きいので、使わない場合の負担を減らしています。
- **意味で数字を定義する**: `'0'` から `'9'` だけを数字とする書き方と、Unicode の数字の定義を組み合わせています。ASCII 以外の数字も、標準の定義に沿って判定できます。

## まとめ

- 判定する文字の大部分が狭い範囲にあるなら、その範囲を先に比較で済ませる。
- 範囲の外の文字は、標準の表に任せると正しく判定できる。
- 「数字」の定義は、Unicode の表で決まっている。
