---
title: "ASN.1 の一般化時刻を読む parseGeneralizedTime。読んだ後に書き戻して同じかを確かめる"
description: "encoding/asn1 の parseGeneralizedTime。文字列を決まった書式で時刻に変換し、その後で同じ書式に書き戻して、元の文字列と一致するかを確かめる。一致しなければ、正しくない時刻としてエラーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/asn1.go"
lines: [364, 377]
function: "parseGeneralizedTime"
difficulty: 2
tags: [日時, パース, 防御的プログラミング]
---

## ひとことで

`parseGeneralizedTime(bytes)` は、ASN.1 の一般化時刻の文字列を、`time.Time` の値に変換します。変換した後に、もう一度文字列に戻して、元と同じかを確かめます。

例えば、存在しない日付のように、読み取れても意味がない時刻があります。書き戻して比べると、そうした時刻を見つけられます。

## コード

```go:line-numbers=364
func parseGeneralizedTime(bytes []byte) (ret time.Time, err error) {
	const formatStr = "20060102150405.999999999Z0700"
	s := string(bytes)

	if ret, err = time.Parse(formatStr, s); err != nil {
		return
	}

	if serialized := ret.Format(formatStr); serialized != s {
		err = fmt.Errorf("asn1: time did not serialize back to the original value and may be invalid: given %q, but serialized as %q", s, serialized)
	}

	return
}
```

## 前提知識

- **一般化時刻**: ASN.1 で時刻を表す文字列の形式です。年、月、日、時、分、秒と、小数やタイムゾーンを含みます。
- **書式の文字列**: `time.Parse` と `Format` が使う、特別な書き方です。`20060102150405` は、年月日時分秒を表す決まった並びです。
- **書き戻し**: 時刻を、同じ書式の文字列に変えることです。元の文字列と比べるために使います。
- **`fmt.Errorf`**: 書式つきのエラーを作る関数です。ここでは、元の値と書き戻した値を、エラーの内容に含めます。

## 何をしているか

### 1. 書式に従って読む

```go:line-numbers=368
	if ret, err = time.Parse(formatStr, s); err != nil {
		return
	}
```

決まった書式で、文字列を時刻に変換します。失敗したら、そのエラーを返します。

### 2. 書き戻して比べる

```go:line-numbers=372
	if serialized := ret.Format(formatStr); serialized != s {
		err = fmt.Errorf("asn1: time did not serialize back to the original value and may be invalid: given %q, but serialized as %q", s, serialized)
	}
```

読んだ時刻を、同じ書式で文字列に戻します。元の文字列と違えば、時刻が正しくない可能性があるので、エラーを作ります。エラーには、元の値と書き戻した値の両方を入れます。

## ここがすごい

- **読めても確かめる**: 読み取りが成功しても、その結果が元の意味を保つかを、もう一度確かめます。「読めたから正しい」と思い込まない作りです。
- **誤りを具体的に伝える**: エラーのメッセージに、元の値と書き戻した値を並べます。どこがずれているかが、一目で分かります。
- **書式を一か所に**: `formatStr` という一つの定数で、読むときも書き戻すときも同じ書式を使います。二つの書式がずれる心配がありません。

## まとめ

- `parseGeneralizedTime` は、一般化時刻の文字列を時刻に変換します。
- 変換した時刻を同じ書式で書き戻し、元の文字列と比べます。
- 一致しなければ、元の値と書き戻した値を含むエラーを返します。
