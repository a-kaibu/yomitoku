---
title: "値のエンコード関数を型から選ぶ valueEncoder。無効な値は null 相当の処理に"
description: "encoding/json の valueEncoder。reflect.Value を受け取り、値が有効かを確かめる。無効な値なら、専用のエンコーダーを返す。有効なら、その型に合うエンコーダーを型から選んで返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [375, 380]
function: "valueEncoder"
difficulty: 1
tags: [型システム, リフレクション, API設計]
---

## ひとことで

`valueEncoder(v)` は、値 `v` を JSON に変換するための関数を返します。値そのものを書くのではなく、「書き方を決める関数」を選んで返します。

値が無効なとき（例えば何も入っていないとき）には、特別な関数を返します。有効なときは、型に応じた関数を、型から選びます。

## コード

```go:line-numbers=375
func valueEncoder(v reflect.Value) encoderFunc {
	if !v.IsValid() {
		return invalidValueEncoder
	}
	return typeEncoder(v.Type())
}
```

## 前提知識

- **`reflect.Value`**: 実行時の値を表す型です。`IsValid` で、値が有効かを確かめられます。
- **エンコーダー（`encoderFunc`）**: 値を JSON に書き出す関数の型です。引数に値と設定を受け取ります。
- **`invalidValueEncoder`**: 無効な値を、`null` のような表記で書くための関数です。
- **`typeEncoder`**: 型を受け取り、その型のエンコーダーを探して返す関数です。結果は、一度作ると覚えておかれます。

## 何をしているか

### 1. 無効な値なら専用の関数を返す

```go:line-numbers=376
	if !v.IsValid() {
		return invalidValueEncoder
	}
```

値が無効なら、その値の型は分かりません。そのため、無効な値の専用の関数を返します。

### 2. 有効なら型から選ぶ

```go:line-numbers=379
	return typeEncoder(v.Type())
```

有効なら、値の型を取り出し、`typeEncoder` にその型のエンコーダーを探してもらいます。値の型ごとに、書き方が違うためです。

## ここがすごい

- **書き方を型で決める**: 値を見るたびに書き方を判断せず、型に対応する関数を一度選びます。
- **無効な値も扱える**: 何も入っていない値でも、エラーで止まらず、専用の書き方で処理します。
- **選ぶ処理と書く処理を分ける**: この関数は、どの関数で書くかを選ぶだけです。書く仕事は、選ばれた関数が担当します。

## まとめ

- `valueEncoder` は、値に合った JSON の書き方の関数を返します。
- 無効な値は、専用の関数で扱います。
- 有効な値は、型から書き方を選びます。
