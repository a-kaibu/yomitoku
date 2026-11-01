---
title: "中身を複製したスライスを作る slices.Clone"
description: "slices.Clone は、スライスの要素をコピーした新しいスライスを作ります。nil はそのまま nil を返し、長さ 0 の部分を複製するときの余計な参照も避けています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [355, 363]
function: "Clone"
difficulty: 2
format: 2
tags: [メモリ管理, ジェネリクス, 標準ライブラリ]
---

## ひとことで

`slices.Clone(s)` は、`s` と同じ中身を持つ、別の配列の新しいスライスを返します。新しい方に書き込んでも、元の `s` は変わりません。

## コード

::: code-group

```go:line-numbers=355 [日本語訳]
func Clone[S ~[]E, E any](s S) S {
	// nil かどうかを保つ。区別が意味を持つかもしれないので。
	if s == nil {
		return nil
	}
	// s[:0:0] は避ける。大きな配列の長さ 0 の部分を複製すると、
	// 不要なものが生き残ってしまうため。詳しくは https://go.dev/issue/68488 を参照。
	return append(S{}, s...)
}
```

```go:line-numbers=355 [原文]
func Clone[S ~[]E, E any](s S) S {
	// Preserve nilness in case it matters.
	if s == nil {
		return nil
	}
	// Avoid s[:0:0] as it leads to unwanted liveness when cloning a
	// zero-length slice of a large array; see https://go.dev/issue/68488.
	return append(S{}, s...)
}
```

:::

## 前提知識

- **スライスの共有**: 代入しただけでは、同じ配列を指すだけで、中身は共有されます。
- **`nil` の区別**: `nil` のスライスは、設定されていない状態を表すことがあります。
- **`append(S{}, s...)`**: 空のスライスに、`s` の要素をすべて追加する書き方です。新しい配列が作られます。
- **容量と GC**: 大きな配列の一部を指すスライスは、配列全体を生かしておくことがあります。

## 何をしているか

### 1. nil をそのまま返す

```go:line-numbers=356
	// nil かどうかを保つ。区別が意味を持つかもしれないので。
	if s == nil {
		return nil
	}
```

`nil` は、区別に意味があるかもしれないので、そのまま `nil` を返します。コメントにあるとおり、区別を守ることを優先しています。

### 2. 新しい配列に複製する

```go:line-numbers=360
	// s[:0:0] は避ける。大きな配列の長さ 0 の部分を複製すると、
	// 不要なものが生き残ってしまうため。詳しくは https://go.dev/issue/68488 を参照。
	return append(S{}, s...)
```

コメントにあるとおり、`s[:0:0]` は避けています。大きな配列の一部を長さ 0 で切ると、配列全体が生き残る原因になるからです。そこで、空のスライスに `append` で要素を入れ、新しい配列を作ります。

## ここがすごい

- **配列を完全に分ける**: 新しい配列を作るので、片方を書き換えても、もう片方には影響しません。
- **nil を保つ**: 空と未設定を、呼び出し側が区別できます。
- **GC の事情を考える**: 大きな配列を、不要に生かさない書き方を選んでいます。

## まとめ

- `nil` は `nil` のまま返し、区別を守る。
- 新しい配列に要素を追加して、完全に独立したスライスを作る。
- `s[:0:0]` を避け、大きな配列が不要に残らないようにする。
