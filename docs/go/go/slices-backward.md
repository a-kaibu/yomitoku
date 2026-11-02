---
title: "後ろから要素を渡す slices.Backward。逆順のループをイテレータで書く"
description: "スライスの要素を後ろから順に、添字と値の組で渡す slices.Backward。逆順の for 文を、呼び出し側から見て 1 行で書けるようにしている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/slices/iter.go"
lines: [26, 34]
function: "Backward"
difficulty: 2
tags: [イテレータ, イディオム]
---

## ひとことで

`slices.Backward(s)` は、スライス `s` の要素を **最後から先頭へ** 順番に、添字と値の組として渡すイテレータです。`for i, v := range slices.Backward(s) { ... }` と書けます。

逆順に回す `for i := len(s) - 1; i >= 0; i--` を毎回書く代わりに、読みやすい形にまとめたものです。

## コード

```go:line-numbers=26
func Backward[Slice ~[]E, E any](s Slice) iter.Seq2[int, E] {
	return func(yield func(int, E) bool) {
		for i := len(s) - 1; i >= 0; i-- {
			if !yield(i, s[i]) {
				return
			}
		}
	}
}
```

## 前提知識

- **逆順のループ**: 末尾から先頭に向かって回すループです。添字は `len(s) - 1` から始まり、0 まで減っていきます。
- **`iter.Seq2`**: 2 つの値（ここでは添字と要素）を渡すイテレータの型です。`yield func(int, E) bool` の形です。
- **添字と値**: `s[i]` は `i` 番目の要素です。Go では `range` が、添字と値を組にして返してくれます。
- **`yield` の戻り値**: `false` が返ったら、呼び出し側が途中で止めたという意味です。

## 何をしているか

### 1. 末尾の添字から始める

```go:line-numbers=28
			for i := len(s) - 1; i >= 0; i-- {
				if !yield(i, s[i]) {
					return
				}
			}
```

`i` は最後の添字 `len(s) - 1` から始まります。1 つずつ減らしながら、0 になるまで回します。空のスライスでは、`len(s) - 1` が `-1` になるので、ループは 1 回も回りません。

### 2. 添字と値をまとめて渡す

`yield(i, s[i])` は、添字と要素を 1 回の呼び出しで渡します。呼び出し側は `i` と `v` の両方を使えます。

### 3. 途中で止まる

`yield` が `false` を返したら、`return` でイテレータを終わらせます。残りの要素は渡されません。

## ここがすごい

- **意図が伝わる呼び出し**: `slices.Backward(s)` と書けば、「後ろから回す」という意味がすぐに分かります。`i--` の書き間違いを防げます。
- **空のスライスも安全**: `len(s) - 1` が `-1` になるだけなので、特別な確認をしなくても、ループは何もしません。
- **同じ形の関数の並び**: `slices.All` と `slices.Backward` は、ループの向きだけが違います。呼び出し側は、同じ書き方で向きを選べます。

## まとめ

- `Backward` は、スライスを末尾から先頭へ、添字と値の組で渡すイテレータです。
- 逆順のループは、`len(s) - 1` から始めて 0 まで減らします。
- 空のスライスでは、ループは何もしません。
- `yield` が `false` を返したら、すぐに止まります。
