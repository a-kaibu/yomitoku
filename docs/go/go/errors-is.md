---
title: "包まれたエラーを一枚ずつはがして、目的のエラーを探す errors.Is の中身"
description: "errors.Is は、エラーが目的の値を包んでいるかを調べます。Unwrap メソッドで一段ずつたどり、Is メソッドにも判定を任せます。包み方が木の形でも、再帰で全部調べます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2018 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/errors/wrap.go"
lines: [54, 79]
function: "is"
difficulty: 3
format: 2
tags: [エラー処理, 再帰, 設計パターン, 標準ライブラリ]
---

## ひとことで

`errors.Is(err, target)` は、`err` が `target` と同じエラーか、または `target` を包んでいるかを調べます。`fmt.Errorf("読み込み失敗: %w", io.EOF)` のように包まれたエラーでも、`errors.Is(err, io.EOF)` は `true` になります。

中身の `is` 関数は、包みを一段ずつはがしながら、目的のエラーが出てくるかを調べます。

## コード

```go:line-numbers=54
func is(err, target error, targetComparable bool) bool {
	for {
		if targetComparable && err == target {
			return true
		}
		if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
			return true
		}
		switch x := err.(type) {
		case interface{ Unwrap() error }:
			err = x.Unwrap()
			if err == nil {
				return false
			}
		case interface{ Unwrap() []error }:
			for _, err := range x.Unwrap() {
				if is(err, target, targetComparable) {
					return true
				}
			}
			return false
		default:
			return false
		}
	}
}
```

## 前提知識

- **`error` インターフェース**: `Error() string` を持つ型です。エラーは値として渡されるので、包む・包まれるという関係を作れます。
- **`Unwrap`**: 包んでいる内側のエラーを返すメソッドです。`Unwrap() error` は 1 つを、`Unwrap() []error` は複数を返します。
- **型スイッチ `switch x := err.(type)`**: 値の型を調べて、その型に応じた処理を書けます。インターフェースの型も `case` に書けます。
- **`targetComparable`**: `target` が `==` で比べられる型かを、呼び出し元が先に調べた結果です。比べられない型で `==` を使うと、実行時に `panic` するので、この確認が必要です。

## 何をしているか

`err` が `fmt.Errorf("%w", io.EOF)` で作られたもの（`io.EOF` を包んでいる）で、`target = io.EOF` とします。

### 1. まず同じかを比べる

```go:line-numbers=56
		if targetComparable && err == target {
			return true
		}
```

最初の `err` は包みそのものなので、`io.EOF` とは違います。次の手順に進みます。

### 2. Is メソッドに任せる

```go:line-numbers=59
		if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
			return true
		}
```

エラーが `Is(error) bool` を持っていれば、その判定を使います。標準の型では持っていないことが多いですが、独自のエラー型で、より柔らかい一致を決められます。

### 3. 包まれた内側へ進む

```go:line-numbers=62
		switch x := err.(type) {
		case interface{ Unwrap() error }:
			err = x.Unwrap()
			if err == nil {
				return false
			}
```

包みを 1 段はがして、`err` を内側の `io.EOF` にします。次のループで、`err == target` が真になり、`true` を返します。

### 4. 複数に包まれている場合

```go:line-numbers=68
		case interface{ Unwrap() []error }:
			for _, err := range x.Unwrap() {
				if is(err, target, targetComparable) {
					return true
				}
			}
			return false
```

包みが複数のエラーを持つ場合は、それぞれを `is` で再帰的に調べます。1 つでも見つかれば `true` です。

## ここがすごい

- **包みの形に合わせて再帰する**: 1 つだけ包むなら、ループで一段ずつ進みます。複数なら、木の枝ごとに再帰します。どちらも同じ関数の中に収まっています。
- **`==` を安全に使う**: 比べられない型のエラーで `==` を使うと、実行時に `panic` します。`targetComparable` を先に確かめておくことで、この危険を防いでいます。
- **判定を相手に任せる道を残す**: `Is` メソッドがあれば、そちらの判定を使えます。一致の定義を、エラーを作る側が決められます。

## まとめ

- 包まれたエラーは、`Unwrap` で一段ずつはがして調べる。
- 包みが複数の場合は、再帰で全部の枝を調べる。
- `==` を使う前に、比べられる型かを確かめる。
