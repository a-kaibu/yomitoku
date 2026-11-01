---
title: "末尾が一致するかを長さを先に比べて確かめる strings.HasSuffix"
description: "strings.HasSuffix は、文字列が指定した接尾辞で終わるかを返します。HasPrefix と同じく、長さを先に比べてから末尾の部分を取り出して比べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/internal/stringslite/strings.go"
lines: [20, 22]
function: "HasSuffix"
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`strings.HasSuffix("main.go", ".go")` は `true` を返します。ファイル名の拡張子を確かめるときなどに使われます。

## コード

```go:line-numbers=20
func HasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}
```

## 前提知識

- **接尾辞（サフィックス）**: 文字列の末尾に付く部分です。
- **末尾の位置**: `len(s) - len(suffix)` は、末尾の部分が始まる位置です。
- **`HasPrefix` との対**: 先頭版と末尾版が、同じ考え方で並んでいます。
- **文字列の `==`**: 2 つの文字列の内容が同じかを比べます。

## 何をしているか

### 1. 長さを先に比べる

```go:line-numbers=21
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
```

接尾辞が元の文字列より長ければ、末尾が一致するはずがありません。`&&` によって、その場合は後ろの比較を行いません。

### 2. 末尾の部分と比べる

```go:line-numbers=21
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
```

`s[len(s)-len(suffix):]` で、末尾から接尾辞の長さぶんの部分を取り出し、`suffix` と比べます。一致すれば `true` です。

## ここがすごい

- **位置の計算を一度に書く**: 末尾の開始位置を、長さの差で求めます。添字を別に数える必要がありません。
- **コピーが起きない**: 末尾の部分は、元の文字列の一部を指すだけです。
- **先頭版と並べて読める**: `HasPrefix` と見比べると、どこが違うかがすぐ分かります。

## まとめ

- 接尾辞が長すぎれば `false` を返す。
- 末尾の同じ長さの部分を取り出して、接尾辞と比べる。
- 先頭版の `HasPrefix` と、同じ形で書かれている。
