---
title: "値が含まれるかを真偽で返す slices.Contains"
description: "slices.Contains は、スライスに指定した値が含まれるかを true か false で返します。中身は slices.Index を呼び、添字が 0 以上かを確かめるだけの短い関数です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [117, 119]
function: "Contains"
difficulty: 1
format: 2
tags: [探索, ジェネリクス, 標準ライブラリ]
---

## ひとことで

`slices.Contains([]string{"go", "rust"}, "go")` は `true` を返します。「あるかないか」だけ知りたいときに、添字を気にせず使える関数です。

## コード

```go:line-numbers=117
func Contains[S ~[]E, E comparable](s S, v E) bool {
	return Index(s, v) >= 0
}
```

## 前提知識

- **`slices.Index`**: 値の添字を返す関数です。見つからなければ `-1` を返します。
- **`>= 0` の判定**: 添字は 0 以上なので、0 以上なら見つかったことになります。
- **`comparable` 制約**: 要素を `==` で比べられる型だけを受け付けます。
- **再利用**: 既にある関数を使って、新しい関数の意味を短く表します。

## 何をしているか

### 1. Index を呼ぶ

```go:line-numbers=118
	return Index(s, v) >= 0
```

`Index(s, v)` で、値 `v` の添字を探します。添字そのものの値は、ここでは使いません。

### 2. 添字が 0 以上かを返す

```go:line-numbers=118
	return Index(s, v) >= 0
```

添字が 0 以上なら、値が見つかったことになります。`>= 0` の比較で、真偽に変えて返します。

## ここがすごい

- **意味を名前で伝える**: 呼び出し側は「含まれるか」を直接書けるので、`Index` の `-1` を覚えておく必要がありません。
- **実装を再利用する**: 探す処理を `Index` に任せ、この関数は判定だけに集中しています。
- **読み手の負担が少ない**: `if slices.Contains(...)` と書けば、意図がそのまま読めます。

## まとめ

- `Index` の結果が 0 以上かで、含まれるかを判定する。
- 探す処理は `Index` に任せ、この関数は意味を短く表す。
- 添字を使わない場面で、読みやすく書ける。
