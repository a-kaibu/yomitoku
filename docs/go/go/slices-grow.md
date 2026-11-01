---
title: "追加に備えて容量を確保する slices.Grow"
description: "slices.Grow は、スライスに n 個ぶんの要素を追加できるように、容量を前もって広げます。長さは変えず、中身も変えません。繰り返しの append で配列を何度も作り直すのを防ぎます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [422, 431]
function: "Grow"
difficulty: 2
format: 2
tags: [メモリ管理, 最適化, 標準ライブラリ]
---

## ひとことで

`s = slices.Grow(s, 1000)` を呼んでから、1000 回 `append` すると、途中で配列を作り直さずに済みます。長さは変わらず、追加できる余裕だけが増えます。

## コード

::: code-group

```go:line-numbers=422 [日本語訳]
func Grow[S ~[]E, E any](s S, n int) S {
	if n < 0 {
		panic("cannot be negative")
	}
	if n -= cap(s) - len(s); n > 0 {
		// この式は、一度の確保だけで済む（テストで確認済み）。
		s = append(s[:cap(s)], make([]E, n)...)[:len(s)]
	}
	return s
}
```

```go:line-numbers=422 [原文]
func Grow[S ~[]E, E any](s S, n int) S {
	if n < 0 {
		panic("cannot be negative")
	}
	if n -= cap(s) - len(s); n > 0 {
		// This expression allocates only once (see test).
		s = append(s[:cap(s)], make([]E, n)...)[:len(s)]
	}
	return s
}
```

:::

## 前提知識

- **長さと容量**: `len` は今の要素数、`cap` は配列の確保された大きさです。`cap` を超えて追加すると、新しい配列を作って要素をコピーします。
- **`append` の増え方**: 容量が足りないときに、`append` は必要以上の大きさを確保します。何度も作り直すと、コピーの回数が増えます。
- **`make([]E, n)`**: 指定した長さのゼロ値のスライスを作ります。
- **負の値は誤り**: 追加する数が負なら、意味がないので `panic` にします。

## 何をしているか

### 1. 負の値を止める

```go:line-numbers=423
	if n < 0 {
		panic("cannot be negative")
	}
```

`n` が負なら、追加の見込みとして意味を持たないので、`panic` で止めます。

### 2. 足りない分だけ確保する

```go:line-numbers=426
	if n -= cap(s) - len(s); n > 0 {
		// この式は、一度の確保だけで済む（テストで確認済み）。
```

`cap(s) - len(s)` は、今の配列にまだ空いている場所の数です。`n` からその数を引き、残りが正なら、足りない分だけ確保します。コメントにあるとおり、この式は一度の確保で済みます。

### 3. 長さを保ったまま広げる

```go:line-numbers=428
		s = append(s[:cap(s)], make([]E, n)...)[:len(s)]
```

`append(s[:cap(s)], make([]E, n)...)` で、容量いっぱいまで広げたうえで、ゼロ値を足します。最後に `[:len(s)]` で、長さを元に戻します。中身は変わらず、容量だけが増えます。

## ここがすごい

- **長さを変えずに準備する**: 見た目の要素数は同じなので、既存のコードの動きを変えません。
- **一度の確保で済む**: 必要な分をまとめて確保するので、繰り返しの作り直しを減らせます。
- **空きを計算で求める**: `cap` と `len` の差を使うので、既に空いている分を無駄にしません。

## まとめ

- 容量だけを先に増やし、長さと中身は変えない。
- 必要な分を一度にまとめて確保するので、作り直しが減る。
- 空いている分を差し引いて、足りない分だけ確保する。
