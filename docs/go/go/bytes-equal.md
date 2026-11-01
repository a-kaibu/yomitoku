---
title: "`string(a) == string(b)` と書くと、コピーが起きない比較"
description: "bytes.Equal は、2 つのバイト列が同じ内容かを調べます。文字列に変換して比べる 1 行で書かれていて、その変換はコンパイラによってコピーなしで済むよう最適化されています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [21, 24]
function: "Equal"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`bytes.Equal(a, b)` は、2 つの `[]byte`（バイトのスライス）の中身が同じなら `true` を返します。`bytes.Equal([]byte("go"), []byte("go"))` は `true` です。

中身は 1 行だけで、両方を `string` に変換してから `==` で比べています。ふつうなら変換のたびにメモリをコピーしますが、この書き方は **コピーを起こさない** ように扱われます。

## コード

::: code-group

```go:line-numbers=21 [日本語訳]
func Equal(a, b []byte) bool {
	// cmd/compile も gccgo も、これらの文字列変換ではメモリを確保しない。
	return string(a) == string(b)
}
```

```go:line-numbers=21 [原文]
func Equal(a, b []byte) bool {
	// Neither cmd/compile nor gccgo allocates for these string conversions.
	return string(a) == string(b)
}
```

:::

## 前提知識

- **`[]byte` と `string`**: `[]byte` は変更できるバイトのスライス、`string` は変更できないバイトの並びです。`string(b)` は、変換時にバイトをコピーするのが普通です。
- **`string(a) == string(b)`**: 文字列の比較は、長さが同じで、内容も同じかを調べます。
- **コンパイラの最適化**: コンパイラは、プログラムの書き方を見て、より安いコードに置き換えることがあります。ここでは「比べるためだけに作る文字列」を、コピーなしで扱えるように最適化されます。

## 何をしているか

### 1. 両方を文字列とみなす

```go:line-numbers=23
	return string(a) == string(b)
```

`a` と `b` を `string` に変換して、`==` で比べます。変換したものは比べるだけで捨てられます。

### 2. 比較の結果

`a = []byte("go")`、`b = []byte("go")` なら、2 つの文字列は長さも中身も同じなので、`true` が返ります。`b` が `"Go"` なら、1 バイト目が違うので `false` です。

## ここがすごい

- **コピーを消す**: 比較だけのための変換なら、コンパイラは変換先の文字列を新しく作らず、元のバイトをそのまま比べられます。読みやすい 1 行で、速い比較ができます。
- **意図がコメントで書かれている**: コメントは「cmd/compile も gccgo も、この変換で確保しない」と書いています。この 1 行が、コンパイラの振る舞いに依存していることを読む人に伝えています。
- **`bytes.Compare` との使い分け**: 大きさの順も必要なら `bytes.Compare`、等しいかだけなら `bytes.Equal` と使い分けます。等しいかだけを調べる場合、この関数は分かりやすい書き方になっています。

## まとめ

- 比べるだけの `string` 変換は、コンパイラがコピーを消せる場合がある。
- 読みやすい 1 行の書き方が、速さと両立できることがある。
- コンパイラの最適化に頼るときは、その理由をコメントに書いておく。
