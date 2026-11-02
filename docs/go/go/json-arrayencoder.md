---
title: "配列の要素を一つずつ JSON に書き出す arrayEncoder。要素の間だけカンマを付ける"
description: "encoding/json の arrayEncoder.encode。配列やスライスを、角括弧で囲んで書く。要素と要素の間にだけカンマを入れ、各要素は、要素の型に合ったエンコーダーで書く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [877, 887]
function: "encode"
difficulty: 1
tags: [パース, 入出力, 可読性]
---

## ひとことで

`ae.encode(e, v, opts)` は、配列やスライスの値を、JSON の配列の形で書き出します。例えば `[1, 2, 3]` の値は、`[1,2,3]` と書かれます。

JSON の配列は、要素をカンマで区切ります。最初の要素の前や、最後の要素の後にはカンマを付けません。この関数は、その決まりを、要素を一つずつ書くときに守ります。

## コード

```go:line-numbers=877
func (ae arrayEncoder) encode(e *encodeState, v reflect.Value, opts encOpts) {
	e.WriteByte('[')
	n := v.Len()
	for i := 0; i < n; i++ {
		if i > 0 {
			e.WriteByte(',')
		}
		ae.elemEnc(e, v.Index(i), opts)
	}
	e.WriteByte(']')
}
```

## 前提知識

- **`encodeState`**: JSON を書き溜めておくための入れ物です。`WriteByte` で一文字ずつ書けます。
- **`elemEnc`**: 要素の型に合った書き出し関数です。配列の型が決まった時点で、一度だけ選ばれます。
- **`v.Len()` と `v.Index(i)`**: 配列の長さを数え、i 番目の要素を取り出すメソッドです。
- **カンマの位置**: 要素を書く前に、それが最初の要素でなければカンマを付けます。こうすると、最後にカンマが残りません。

## 何をしているか

### 1. 開きの角括弧を書く

```go:line-numbers=878
	e.WriteByte('[')
	n := v.Len()
```

最初に `[` を書きます。続けて、配列の長さ `n` を調べます。

### 2. 要素の間にカンマを入れながら書く

```go:line-numbers=880
	for i := 0; i < n; i++ {
		if i > 0 {
			e.WriteByte(',')
		}
		ae.elemEnc(e, v.Index(i), opts)
	}
```

要素を先頭から順に取り出します。二つ目以降の要素の前にだけ、カンマを書きます。そのあと、`elemEnc` で要素を書きます。要素の型に応じた書き方が、自動的に使われます。

### 3. 閉じの角括弧を書く

```go:line-numbers=886
	e.WriteByte(']')
```

すべての要素を書いたら、最後に `]` を書いて終わります。

## ここがすごい

- **カンマの判断が簡単**: `i > 0` という一つの条件で、カンマの位置が決まります。最後の要素の後にカンマが残る心配がありません。
- **要素の書き方を選び直さない**: 要素の型ごとの処理は、事前に用意された `elemEnc` に任せます。要素を一つずつ判断しないので、速く動きます。
- **空の配列も正しく書ける**: 長さが 0 なら、要素のループは一度も回らず、`[]` と書かれます。特別扱いは要りません。

## まとめ

- `arrayEncoder.encode` は、配列の要素を角括弧で囲んで JSON に書きます。
- 要素の間にだけ、カンマを入れます。
- 要素の書き方は、型に合わせて用意された関数に任せます。
