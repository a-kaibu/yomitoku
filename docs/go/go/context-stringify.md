---
title: "context の表示名を決める stringify。文字列・Stringer・型名の順に使う"
description: "context の String メソッドで、値を読みやすい文字列にする関数 stringify。Stringer の実装、文字列、nil、それ以外の型名の順に判定し、表示に失敗しないようにしている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/context/context.go"
lines: [755, 765]
function: "stringify"
difficulty: 1
tags: [型システム, 設計パターン, ログ]
---

## ひとことで

`stringify(v)` は、context の `String()` の中で使われる、値を表示用の文字列に変える関数です。値が `String()` メソッドを持つならそれを使い、文字列ならそのまま使い、`nil` なら `"<nil>"` と表示し、それ以外は型の名前を表示します。

例えば `context.WithValue(ctx, "k", 1)` を表示すると、キーの `"k"` がそのまま出ます。値が構造体なら、型の名前だけが出ます。

## コード

```go:line-numbers=755
func stringify(v any) string {
	switch s := v.(type) {
	case stringer:
		return s.String()
	case string:
		return s
	case nil:
		return "<nil>"
	}
	return reflectlite.TypeOf(v).String()
}
```

## 前提知識

- **型による分岐 `switch v.(type)`**: 値の動的な型で処理を分ける書き方です。`case string:` のように書きます。
- **`Stringer` インタフェース**: `String() string` を持つ型のことです。`fmt` などが、値を表示するときに使います。
- **`nil` の扱い**: `any` 型の `nil` は、どの型の値も持たない特別な値です。`case nil:` で判定できます。
- **`reflectlite.TypeOf(v).String()`**: 値の型の名前（例えば `"main.Foo"`）を文字列で返します。

## 何をしているか

### 1. String メソッドを持つ値は、それを使う

```go:line-numbers=756
	switch s := v.(type) {
	case stringer:
		return s.String()
```

値が `stringer`（`String() string` を持つ型）なら、その `String()` の結果を使います。キーに独自の型を使っていても、その型が見やすい表示を用意していれば、それがそのまま出ます。

### 2. 文字列と nil は特別に扱う

```go:line-numbers=759
	case string:
		return s
	case nil:
		return "<nil>"
	}
```

文字列はそのまま表示します。`nil` は、型がないので `"<nil>"` と書きます。

### 3. それ以外は型の名前を出す

```go:line-numbers=764
	return reflectlite.TypeOf(v).String()
```

どれにも当てはまらなければ、値の型の名前を返します。値の中身を見せるわけではないので、大きな構造体でも表示が長くなりません。

## ここがすごい

- **表示が必ず終わる**: どんな型の値が来ても、いずれかの節で文字列を返します。表示のための関数が、`panic` などで落ちないように作られています。
- **中身を出さない**: 型の名前だけを出すので、パスワードのような値が、うっかりログに出ることを防げます。
- **型の選び方で表示を変えられる**: `String` メソッドを持つ型を作れば、表示も自分で決められます。`stringify` は、その手段を広く受け入れています。

## まとめ

- `stringify` は、context の表示に使う値を文字列に変えます。
- `Stringer` を持つ値はその `String()`、文字列はそのまま、`nil` は `"<nil>"`、それ以外は型の名前を出します。
- どの型でも必ず文字列を返すので、表示のための処理は落ちません。
- 型の名前だけを出すことで、値の中身が意図せず表示されるのを防ぎます。
