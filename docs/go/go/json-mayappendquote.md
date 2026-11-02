---
title: "引用符を付けるかどうかを決める mayAppendQuote。付ける場合だけ末尾に追加する"
description: "encoding/json の mayAppendQuote。quoted が真のときだけ、バイト列の末尾に引用符 \" を追加する。開きと閉じの引用符を、同じ関数で条件つきに付けるための小さな部品。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [1334, 1339]
function: "mayAppendQuote"
difficulty: 1
tags: [文字列処理, 可読性, イディオム]
---

## ひとことで

`mayAppendQuote(b, quoted)` は、`quoted` が真のときだけ、バイト列 `b` の末尾に引用符 `"` を追加します。偽なら、`b` をそのまま返します。

名前の「may」は、「追加するかもしれない」という意味です。引用符を付けるかどうかは、呼び出し側の設定によって変わるからです。

## コード

```go:line-numbers=1334
func mayAppendQuote(b []byte, quoted bool) []byte {
	if quoted {
		b = append(b, '"')
	}
	return b
}
```

## 前提知識

- **引用符**: JSON の文字列を囲む `"` です。数字に付けると、文字列として扱われます。
- **`append`**: スライスの末尾に値を追加する組み込み関数です。容量が足りなければ、新しい配列を作ります。
- **真偽値の引数**: 「付けるかどうか」を表す値です。関数の中で `if` に使うと、条件つきの処理になります。
- **戻り値で渡す**: `b` を受け取って、更新された `b` を返す書き方です。Go のスライスは、この形でよく使われます。

## 何をしているか

### 1. 引用符が必要か判断する

```go:line-numbers=1335
	if quoted {
```

設定 `quoted` が真かを確かめます。真でなければ、このブロックは飛ばされます。

### 2. 引用符を末尾に追加する

```go:line-numbers=1336
		b = append(b, '"')
```

真のときは、バイト列の末尾に `"` を 1 文字追加します。

### 3. 更新したバイト列を返す

```go:line-numbers=1338
	return b
```

引用符を付けたかどうかに関係なく、最後にバイト列を返します。呼び出し側は、その結果を次の処理に渡せます。

## ここがすごい

- **条件を一行で表す**: 「付けるかどうか」の判断を、関数の中に閉じ込めています。呼び出し側は、真偽値を渡すだけです。
- **同じ関数で開きと閉じ**: 開きと閉じの引用符を、まったく同じ関数で付けるので、両側の判断が必ず一致します。
- **付けない場合も安全**: 偽のときは何も追加されず、そのまま返るので、どちらの場合も同じ書き方で使えます。

## まとめ

- `mayAppendQuote` は、真なら末尾に引用符を追加します。
- 偽なら、バイト列をそのまま返します。
- 開きと閉じの引用符を、同じ判断で揃えて付けるために使います。
