---
title: "閉じる操作を空にした Reader を作る io.NopCloser"
description: "io.NopCloser は、Reader を ReadCloser に包み直します。Close は何もせず nil を返します。元の Reader が WriterTo を持っていれば、その性質も保ちます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [682, 687]
function: "NopCloser"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, 型システム]
---

## ひとことで

`io.NopCloser(strings.NewReader("abc"))` は、読むだけの `Reader` を `ReadCloser` に変えます。`Close` を呼んでも何もしません。閉じる必要のない読み手を、閉じる必要のある口に渡すときに使います。

## コード

```go:line-numbers=682
func NopCloser(r Reader) ReadCloser {
	if _, ok := r.(WriterTo); ok {
		return nopCloserWriterTo{r}
	}
	return nopCloser{r}
}
```

## 前提知識

- **`io.ReadCloser`**: `Read` と `Close` の 2 つを持つインターフェースです。ファイルなどは、閉じる操作が必要です。
- **インターフェースの包み直し**: 既存の値を、別の型で包んで、新しいインターフェースを満たすようにする方法です。
- **型アサーション `r.(WriterTo)`**: 値が `WriterTo` を実装しているかを、実行時に調べます。
- **`nil` の返り値**: 閉じるのが成功したことを表します。何もしないなら `nil` で十分です。

## 何をしているか

### 1. WriterTo を持つ Reader かを調べる

```go:line-numbers=683
	if _, ok := r.(WriterTo); ok {
		return nopCloserWriterTo{r}
	}
```

元の `r` が `WriterTo` を持っていれば、`nopCloserWriterTo` で包みます。`WriteTo` は、`Copy` などで効率のよい転送に使われるので、その性質を失わないようにしています。

### 2. 持たなければ基本の包みを使う

```go:line-numbers=686
	return nopCloser{r}
```

`WriteTo` を持たない場合は、`nopCloser` で包みます。こちらは `Read` と `Close` だけを提供します。

## ここがすごい

- **能力を落とさない**: 包んだあとも、元の Reader が速い転送を持っていれば、その道を残します。
- **閉じ方を一か所に決める**: 閉じる操作は何もしないと決めているので、呼び出し側は閉じる順番を気にしなくて済みます。
- **型で能力の有無を分ける**: 同じ `NopCloser` という名前でも、中身の型が 2 種類あることで、能力の違いを隠しません。

## まとめ

- 閉じる操作を空にした `ReadCloser` で、`Reader` を包む。
- `WriterTo` を持つ `Reader` は、その性質を保つ包みを使う。
- `Close` は何もせず、`nil` を返す。
