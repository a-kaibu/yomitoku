---
title: "受け付ける表記を switch で一覧にする。strconv.ParseBool"
description: "strconv.ParseBool は、\"true\" や \"1\"、\"F\" などの文字列を真偽値に変えます。受け付ける表記を switch の case に並べて、それ以外は構文エラーとして返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/internal/strconv/atob.go"
lines: [10, 18]
function: "ParseBool"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`strconv.ParseBool("true")` は `true` を返します。設定ファイルや、コマンドラインの引数などで、真偽値を文字で書いたものを読むときに使います。

受け付けるのは、決められた表記だけです。`"yes"` や `"on"` は受け付けず、エラーになります。

## コード

```go:line-numbers=10
func ParseBool(str string) (bool, error) {
	switch str {
	case "1", "t", "T", "true", "TRUE", "True":
		return true, nil
	case "0", "f", "F", "false", "FALSE", "False":
		return false, nil
	}
	return false, ErrSyntax
}
```

## 前提知識

- **`switch str`**: 文字列を値として `switch` できます。`case` の中に複数の値を並べると、どれかに一致すれば実行されます。
- **`ErrSyntax`**: 書式が正しくないことを表すエラーの値です。
- **名前付きでない戻り値 `(bool, error)`**: 値と、失敗したときの理由を、2 つの戻り値で返します。成功時は `nil` を返します。
- **`case` は上から順に比べられる**: 一致した時点で、その `case` の処理をして `switch` を出ます。

## 何をしているか

### 1. 真になる表記

```go:line-numbers=12
	case "1", "t", "T", "true", "TRUE", "True":
		return true, nil
```

`"1"`、`"t"`、`"true"` などは、すべて `true` です。大文字と小文字の組み合わせを、1 つずつ列挙しています。

### 2. 偽になる表記

```go:line-numbers=14
	case "0", "f", "F", "false", "FALSE", "False":
		return false, nil
```

`"0"`、`"f"`、`"false"` などは、すべて `false` です。こちらも表記を列挙します。

### 3. どれにも当てはまらない

```go:line-numbers=17
	return false, ErrSyntax
```

`"yes"` や `"on"` は、どの `case` にも当てはまりません。すると `false` と `ErrSyntax` を返します。値が `false` になるのは、呼び出し側がエラーを必ず確かめるための約束です。

## ここがすごい

- **受け付ける範囲を一目で示す**: 受け付ける表記が、コードの中にそのまま書かれています。「何が正しいか」を読んで確かめられます。
- **曖昧な表記を含めない**: `"yes"` や `"on"` を受け付けると、他の言語やツールの約束とずれる可能性があります。範囲を決めて、予想できる動きにしています。
- **エラーを値で返す**: 失敗は `ErrSyntax` という値で表します。呼び出し側は `err != nil` で判定でき、どの種類の失敗かも比べられます。

## まとめ

- 受け付ける値を決めるときは、`switch` で表記を並べると分かりやすい。
- 曖昧な表記は受け付けないと、動きが予想どおりになる。
- 失敗は、戻り値のエラーとして返す。
