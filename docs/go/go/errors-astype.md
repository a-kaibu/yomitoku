---
title: "型を指定して、包まれた中から探す errors.AsType"
description: "errors.AsType は、エラーの鎖をたどって、型 E に合う最初のエラーを探します。型を値で渡す代わりに、型パラメータで指定するので、ポインタの変数を用意する必要がありません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2018 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/errors/wrap.go"
lines: [167, 174]
function: "AsType"
difficulty: 2
format: 2
tags: [エラー処理, ジェネリクス, 型システム, 標準ライブラリ]
---

## ひとことで

`errors.AsType[*fs.PathError](err)` は、`err` の中に `*fs.PathError` があれば、それを `(値, true)` で返します。従来の `errors.As` より、呼び出しが短く書けます。

## コード

::: code-group

```go:line-numbers=167 [日本語訳]
func AsType[E error](err error) (E, bool) {
	if err == nil {
		var zero E
		return zero, false
	}
	var pe *E // 見つけるまで遅延して確保する。
	return asType(err, &pe)
}
```

```go:line-numbers=167 [原文]
func AsType[E error](err error) (E, bool) {
	if err == nil {
		var zero E
		return zero, false
	}
	var pe *E // lazily initialized
	return asType(err, &pe)
}
```

:::

## 前提知識

- **エラーの包み**: `%w` などで、エラーが別のエラーを包むことがあります。包みを順にたどると、元の原因にたどり着けます。
- **型パラメータ `E error`**: 探したい型を、型引数として指定します。`error` を満たす型だけが使えます。
- **`errors.As`**: 従来の関数で、探した結果を、ポインタを渡して書き込ませる書き方でした。
- **ゼロ値**: 見つからないときに返す値です。型ごとに決まっています。

## 何をしているか

### 1. nil なら見つからない

```go:line-numbers=168
	if err == nil {
		var zero E
		return zero, false
```

エラーが `nil` なら、探すものがありません。`E` のゼロ値と `false` を返します。

### 2. 鎖をたどって探す

```go:line-numbers=172
	var pe *E // 見つけるまで遅延して確保する。
	return asType(err, &pe)
```

型を書き込む先として、`*E` のポインタを用意します。内部の `asType` が、包みをたどって、`E` に合うものを探し、見つかればポインタを通して結果を書き込みます。

### 3. 見つかった値を返す

```go:line-numbers=173
	return asType(err, &pe)
```

`asType` の戻り値をそのまま返します。見つかれば、その値と `true` になります。

## ここがすごい

- **変数を宣言しなくてよい**: 従来の `As` は、受け取り用の変数を先に宣言する必要がありました。型引数で指定すると、それが不要になります。
- **型が安全**: 戻り値は `E` の型なので、呼び出し側が型を変換する必要がありません。
- **包みを順にたどる**: 外側の文脈が何重に包まれていても、中にある目的の型を見つけられます。

## まとめ

- 型引数で探す型を指定し、ポインタの受け取り用変数を書かずに済む。
- `nil` は見つからないとして、ゼロ値と `false` を返す。
- 包まれたエラーの鎖を順にたどり、最初の一致を返す。
