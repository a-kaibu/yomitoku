---
title: "JSON の文書の終わりを確かめる checkEOF。末尾に余計な文字がなければ成功とする"
description: "encoding/json/jsontext の decoderState.checkEOF。最上位の値を読み終えた後に、空白だけが残っているかを確かめる。空白の後に別の文字があれば誤りとして報告する。入力が終わっていれば成功とする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/jsontext/decode.go"
lines: [825, 835]
function: "checkEOF"
difficulty: 2
tags: [パース, 防御的プログラミング, エラー処理]
---

## ひとことで

`d.checkEOF(pos)` は、JSON の最上位の値を読み終わったあとに、余計なものが残っていないかを確かめます。例えば `{} x` は、`{}` の後ろに `x` が残っているので誤りです。

JSON の文書は、一つの値で終わらなければなりません。その後ろには空白だけが許されます。この関数は、その規則を確かめる最後の関門です。

## コード

```go:line-numbers=825
func (d *decoderState) checkEOF(pos int) error {
	switch pos, err := d.consumeWhitespace(pos); err {
	case nil:
		err := jsonwire.NewInvalidCharacterError(d.buf[pos:], "after top-level value")
		return wrapSyntacticError(d, err, pos, 0)
	case io.ErrUnexpectedEOF:
		return nil
	default:
		return err
	}
}
```

## 前提知識

- **最上位の値**: 文書の一番外側にある値です。JSON では、ここに一つだけ値が書かれます。
- **`consumeWhitespace`**: 空白を読み飛ばし、次の文字の位置を返す関数です。
- **`io.ErrUnexpectedEOF`**: 入力が途中で終わったことを表すエラーです。ここでは、入力の終わりとして扱われます。
- **`NewInvalidCharacterError`**: 不正な文字があったことを、説明とともに作るエラーです。

## 何をしているか

### 1. 空白の後に文字が残っていれば誤り

```go:line-numbers=826
	switch pos, err := d.consumeWhitespace(pos); err {
	case nil:
		err := jsonwire.NewInvalidCharacterError(d.buf[pos:], "after top-level value")
		return wrapSyntacticError(d, err, pos, 0)
```

空白を読み飛ばした結果、まだ文字が残っていれば、それは余計なものです。「最上位の値の後ろ」という説明とともに、誤りを作って返します。

### 2. 入力が終わっていれば成功とする

```go:line-numbers=830
	case io.ErrUnexpectedEOF:
		return nil
```

空白を読み切って、入力が終わった場合は、文書の終わりとして正しいので `nil` を返します。

### 3. それ以外のエラーはそのまま返す

```go:line-numbers=832
	default:
		return err
	}
```

上の二つ以外のエラーは、そのまま呼び出し側に返します。空白の読み取りで、別の誤りが起きたことを伝えます。

## ここがすごい

- **三つの結果を一つの switch に**: 余計な文字、正常な終わり、その他の誤りを、同じ `switch` の中で分けています。判断の表が一目で分かります。
- **誤りの位置を正確に伝える**: 余計な文字の位置を、誤りに含めます。利用者は、どこを直せばよいかが分かります。
- **正常な終わりを特別に扱う**: 入力の終わりは、誤りではなく、文書の完了です。その区別をエラーの種類で表しています。

## まとめ

- `checkEOF` は、最上位の値の後ろに余計な文字がないかを確かめます。
- 空白の後に文字が残れば、位置を示した誤りを返します。
- 入力の終わりは正常として `nil` を返します。
