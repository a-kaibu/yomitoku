---
title: "整数を JSON の文字列に変える intEncoder。文字列として書く指定があれば引用符で囲む"
description: "encoding/json の intEncoder。整数の値を 10 進数の文字列にして、出力に書き込む。`string` の指定があれば、数字を引用符で囲む。引用符の付け外しを、小さな関数に任せている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [547, 553]
function: "intEncoder"
difficulty: 1
tags: [文字列処理, 型システム, 入出力]
---

## ひとことで

`intEncoder(e, v, opts)` は、整数の値を JSON の表記に変えて、出力に書き込みます。例えば `42` は、そのまま `42` と出力されます。

ただし、構造体のタグに `string` の指定があると、数字を `"42"` のように引用符で囲みます。この関数は、その指定を見て、引用符を付けるかどうかを決めます。

## コード

```go:line-numbers=547
func intEncoder(e *encodeState, v reflect.Value, opts encOpts) {
	b := e.AvailableBuffer()
	b = mayAppendQuote(b, opts.quoted)
	b = strconv.AppendInt(b, v.Int(), 10)
	b = mayAppendQuote(b, opts.quoted)
	e.Write(b)
}
```

## 前提知識

- **エンコード**: 値を、JSON などの決まった形の文字列に変えることです。
- **`encodeState`**: 出力を溜めておくための、内部の入れ物です。`AvailableBuffer` で、書き込み用の空いたバッファを借りられます。
- **`opts.quoted`**: 数字を引用符で囲むかどうかを表す設定です。構造体のタグに `string` があると、この値が真になります。
- **`strconv.AppendInt`**: 整数を 10 進数の文字に変換して、バイト列に追加する関数です。

## 何をしているか

### 1. 開きの引用符を必要なら付ける

```go:line-numbers=549
	b = mayAppendQuote(b, opts.quoted)
```

`quoted` が真なら、開きの引用符 `"` を先に追加します。偽なら何も追加しません。

### 2. 整数を文字に変えて追加する

```go:line-numbers=550
	b = strconv.AppendInt(b, v.Int(), 10)
```

`v.Int()` で取り出した整数を、10 進数の文字に変えて `b` に追加します。新しい文字列を作らず、バッファに直接書き込みます。

### 3. 閉じの引用符を付けて書き出す

```go:line-numbers=551
	b = mayAppendQuote(b, opts.quoted)
	e.Write(b)
```

同じ判定で、閉じの引用符を付けます。最後に、まとめたバイト列を出力に書き込みます。

## ここがすごい

- **同じ処理を二度呼ぶ**: 開きと閉じの引用符を、同じ関数で付けます。引用符の有無が一か所で決まるので、両端がずれることがありません。
- **バッファを使い回す**: `AvailableBuffer` で借りた領域に書いてから、まとめて `Write` します。小さな書き込みを何度も行わないので、速く動きます。
- **型の詳細を隠す**: 整数の変換は `strconv` に任せ、この関数は引用符の判断だけを担当します。

## まとめ

- `intEncoder` は、整数を 10 進数の文字に変えて出力します。
- `string` の指定があるときは、数字を引用符で囲みます。
- 引用符の付け方は `mayAppendQuote` で揃え、両端がずれないようにします。
