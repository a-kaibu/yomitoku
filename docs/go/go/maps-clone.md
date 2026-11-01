---
title: "中身を複製した新しいマップを作る maps.Clone"
description: "maps.Clone は、マップの中身を別のマップへ複製します。nil のマップはそのまま nil を返し、区別が意味を持つ場合に備えています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/maps/maps.go"
lines: [50, 56]
function: "Clone"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`maps.Clone(m)` は、`m` と同じ中身を持つ新しいマップを返します。新しい方を書き換えても、元の `m` は変わりません。

## コード

::: code-group

```go:line-numbers=50 [日本語訳]
func Clone[M ~map[K]V, K comparable, V any](m M) M {
	// nil のままにしておく。区別が意味を持つかもしれないので。
	if m == nil {
		return nil
	}
	return clone(m).(M)
}
```

```go:line-numbers=50 [原文]
func Clone[M ~map[K]V, K comparable, V any](m M) M {
	// Preserve nil in case it matters.
	if m == nil {
		return nil
	}
	return clone(m).(M)
}
```

:::

## 前提知識

- **マップの参照**: マップの値は、中身を指す参照です。代入しても、同じマップを指すだけで、複製にはなりません。
- **nil のマップ**: 宣言しただけのマップは `nil` です。読めますが、書き込むと `panic` します。
- **型パラメータ `M ~map[K]V`**: 名前付きのマップ型も受け取れるように、型の集合で制約しています。
- **型アサーション `.(M)`**: 内部で汎用の値として複製した結果を、元の型に戻すために使います。

## 何をしているか

### 1. nil をそのまま返す

```go:line-numbers=51
	// nil のままにしておく。区別が意味を持つかもしれないので。
	if m == nil {
		return nil
	}
```

コメントにあるとおり、`nil` と空のマップは、扱いが違う場合があります。`nil` のときは、新しいマップを作らずに `nil` を返します。こうすると、呼び出し側が「設定されていない」ことを区別できます。

### 2. 中身を複製する

```go:line-numbers=55
	return clone(m).(M)
```

`clone` は、マップの中身をすべてコピーした新しいマップを作ります。戻り値は一般の値なので、`.(M)` で元の型に戻します。

## ここがすごい

- **nil を区別する**: 空のマップと未設定のマップを、同じ扱いにしません。値の意味を変えずに複製できます。
- **中身だけをコピーする**: 複製されるのは、キーと値の組です。値が指すもの（ポインタなど）は、浅くコピーされる点に注意します。
- **型を保つ**: 名前付きのマップ型でも、同じ型の値が返るので、呼び出し側は型を変換せずに使えます。

## まとめ

- `nil` は `nil` のまま返し、区別を失わない。
- それ以外は、中身をコピーした新しいマップを作る。
- 値が指すものは浅くコピーされるので、そこは注意する。
