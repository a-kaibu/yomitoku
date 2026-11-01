---
title: "文字が含まれるかを真偽で返す strings.ContainsRune"
description: "strings.ContainsRune は、文字列に指定した rune が含まれるかを返します。IndexRune を呼び、結果が 0 以上かを確かめるだけの短い関数です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [72, 74]
function: "ContainsRune"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.ContainsRune("hello, 世界", '世')` は `true` を返します。文字が 1 つ含まれるかを確かめたいときに使います。

## コード

```go:line-numbers=72
func ContainsRune(s string, r rune) bool {
	return IndexRune(s, r) >= 0
}
```

## 前提知識

- **`rune`**: 1 文字を表す整数です。日本語の文字も 1 つの `rune` です。
- **`IndexRune`**: 文字が最初に現れる位置を返す関数です。見つからなければ `-1` を返します。
- **`>= 0` の判定**: 位置が 0 以上なら、含まれていることになります。
- **再利用**: 既にある探索を使い、意味を名前で表す書き方です。

## 何をしているか

### 1. IndexRune を呼ぶ

```go:line-numbers=73
	return IndexRune(s, r) >= 0
```

`IndexRune(s, r)` で、文字 `r` が現れる位置を探します。位置の値そのものは、この関数では使いません。

### 2. 位置が 0 以上かを返す

```go:line-numbers=73
	return IndexRune(s, r) >= 0
```

位置が 0 以上なら、見つかったことになります。`>= 0` の比較で、真偽に変えて返します。

## ここがすごい

- **意図がそのまま読める**: `if strings.ContainsRune(s, '世')` と書けば、含まれるかを確かめていると分かります。
- **探す処理を再利用する**: 文字の探索の仕組みは `IndexRune` に任せ、この関数は判定だけを担当します。
- **位置を気にしなくてよい**: 添字を使わない場面で、`-1` の扱いを書かずに済みます。

## まとめ

- `IndexRune` の結果が 0 以上かで、含まれるかを判定する。
- 探索は `IndexRune` に任せる。
- 位置を使わない場面で、読みやすく書ける。
