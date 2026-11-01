---
title: "先頭が一致するかを長さを先に比べて確かめる strings.HasPrefix"
description: "strings.HasPrefix は、文字列が指定した接頭辞で始まるかを返します。長さを先に比べて、短すぎる場合は比較を省きます。実際の処理は internal の stringslite に置かれています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/internal/stringslite/strings.go"
lines: [16, 18]
function: "HasPrefix"
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`strings.HasPrefix("https://go.dev", "https://")` は `true` を返します。URL の種類や、コマンドの先頭語を判定するときに、よく使われる関数です。

## コード

```go:line-numbers=16
func HasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}
```

## 前提知識

- **接頭辞（プレフィックス）**: 文字列の先頭に付く部分です。
- **`len` の比較**: 接頭辞が元の文字列より長ければ、先頭が一致するはずがありません。
- **`s[:n]` の切り出し**: 先頭から `n` バイトを取り出します。コピーは起きません。
- **文字列の `==`**: 2 つの文字列の内容が同じかを比べます。

## 何をしているか

### 1. 長さを先に比べる

```go:line-numbers=17
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
```

`len(s) >= len(prefix)` を先に調べます。接頭辞のほうが長ければ、そこで `false` になります。`&&` は左が偽なら右を評価しないので、後ろの比較は走りません。

### 2. 先頭の部分と比べる

```go:line-numbers=17
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
```

`s[:len(prefix)]` で、`s` の先頭から接頭辞と同じ長さの部分を取り出し、`prefix` と比べます。一致すれば `true` です。

## ここがすごい

- **無駄な比較を省く**: 長さで先に判定すると、短い文字列への切り出しを行わずに済みます。
- **コピーなしで比べる**: 切り出しは同じ配列の一部を指すだけなので、大きな文字列でも余分な領域を使いません。
- **判定を一行にまとめる**: 2 つの条件を `&&` でつなぐだけなので、意図がそのまま読めます。

## まとめ

- 長さを先に比べて、接頭辞が長すぎれば `false` を返す。
- 先頭の同じ長さの部分を取り出して、接頭辞と比べる。
- `&&` の短絡評価によって、不要な比較が起きない。
