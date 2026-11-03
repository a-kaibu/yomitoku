---
title: "読んだ合計を足して、エラーの位置を直す rebaseError"
description: "encoding/base64 の rebaseError。デコーダの途中で見つかった CorruptInputError の位置に、それまでに読んだ合計の数を足す。それ以外のエラーは、そのまま返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/base64/base64.go"
lines: [458, 463]
function: "rebaseError"
difficulty: 2
tags: [エラー処理, 防御的プログラミング]
---

## ひとことで

`d.rebaseError(err)` は、デコーダの内部で見つかったエラーの位置を、入力全体の位置に直します。エラーでなければ、そのまま返します。

## コード

```go:line-numbers=458
func (d *decoder) rebaseError(err error) error {
	if e, ok := err.(CorruptInputError); ok {
		return CorruptInputError(int64(e) + d.total)
	}
	return err
}
```

## 前提知識

- **CorruptInputError**: 入力に、正しくない文字があった位置を表す型です。整数として位置を持ちます。
- **デコーダ**: 入力を少しずつ読みながら、元のデータに戻す処理です。読んだ量を `total` に持ちます。
- **型アサーション**: `err.(T)` で、インターフェースの値が型 `T` かどうかを調べ、その型として取り出します。

## 何をしているか

### 1. CorruptInputError なら位置を直す

```go:line-numbers=459
	if e, ok := err.(CorruptInputError); ok {
		return CorruptInputError(int64(e) + d.total)
	}
```

エラーが `CorruptInputError` なら、その位置にそれまでに読んだ合計 `d.total` を足して、新しいエラーとして返します。デコーダの内側から見た位置を、入力全体の位置に直すためです。

### 2. それ以外はそのまま返す

```go:line-numbers=462
	return err
```

他の種類のエラーなら、位置の情報がないので、そのまま返します。

## ここがすごい

- **エラーの位置を正しく保つ**: 途中の読み取りで見つかったエラーでも、利用者は入力全体のどこが悪いかを知ることができます。
- **型で判断する**: 文字列を比べるのではなく、型で判断するので、確実に位置の情報を持つエラーだけを直せます。

## まとめ

- `rebaseError` は、エラーの位置を入力全体の位置に直します。
- 位置を持つ `CorruptInputError` だけを対象にします。
- それ以外のエラーは、そのまま返します。
