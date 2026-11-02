---
title: "CSV のフィールドを引用符で囲むべきかを決める fieldNeedsQuotes"
description: "encoding/csv の Writer が、フィールドを二重引用符で囲む必要があるかを判定する関数。区切り文字・引用符・改行・先頭の空白などを確かめ、特別な例外として \\. も囲む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/csv/writer.go"
lines: [160, 184]
function: "fieldNeedsQuotes"
difficulty: 2
tags: [パース, 防御的プログラミング, 文字列処理]
---

## ひとことで

CSV の書き出しでは、フィールドの中身によって、二重引用符 `"` で囲むかどうかが変わります。`fieldNeedsQuotes(field)` は、そのフィールドを囲む必要があるかを `true` / `false` で返します。例えば `a,b` は、区切り文字を含むので囲みます。`hello` は囲まずに出せます。

囲まないと、読み込み側がフィールドの区切りを見誤ってしまいます。この関数は、その誤りを防ぐための判定を行います。

## コード

```go:line-numbers=160
func (w *Writer) fieldNeedsQuotes(field string) bool {
	if field == "" {
		return false
	}

	if field == `\.` {
		return true
	}

	if w.Comma < utf8.RuneSelf {
		for i := 0; i < len(field); i++ {
			c := field[i]
			if c == '\n' || c == '\r' || c == '"' || c == byte(w.Comma) {
				return true
			}
		}
	} else {
		if strings.ContainsRune(field, w.Comma) || strings.ContainsAny(field, "\"\r\n") {
			return true
		}
	}

	r1, _ := utf8.DecodeRuneInString(field)
	return unicode.IsSpace(r1)
}
```

## 前提知識

- **CSV**: 値をカンマなどの区切り文字で並べたテキスト形式です。1 行が 1 つのレコードになります。
- **区切り文字 `Comma`**: フィールドを分ける文字です。標準ではカンマですが、`Writer` の `Comma` で変えられます。
- **引用符で囲む**: 値の中に区切りや改行があるときに、`"..."` で囲むと、その中は 1 つのフィールドとして読まれます。
- **`utf8.RuneSelf`**: 128 のことです。区切り文字がこれより小さいかで、1 バイトで比べられるかを決めます。

## 何をしているか

### 1. 空と特別な文字列

```go:line-numbers=165
	if field == `\.` {
		return true
	}
```

空のフィールドは囲まなくてよいので、最初に `false` を返します。`\.` は、PostgreSQL の COPY 形式で「データの終わり」を表す特別な値なので、誤解されないように囲みます。

### 2. 区切り文字が 1 バイトのとき

```go:line-numbers=170
		for i := 0; i < len(field); i++ {
			c := field[i]
			if c == '\n' || c == '\r' || c == '"' || c == byte(w.Comma) {
				return true
			}
		}
```

区切り文字が ASCII なら、フィールドを 1 バイトずつ見て、改行、復帰、引用符、区切り文字のどれかがあれば囲みます。

### 3. 区切り文字が多バイトのとき

```go:line-numbers=177
			if strings.ContainsRune(field, w.Comma) || strings.ContainsAny(field, "\"\r\n") {
				return true
			}
```

区切り文字が ASCII でなければ、`strings.ContainsRune` で文字として探します。引用符や改行は、ASCII なので `ContainsAny` で探します。

### 4. 先頭が空白なら囲む

```go:line-numbers=182
	r1, _ := utf8.DecodeRuneInString(field)
	return unicode.IsSpace(r1)
```

先頭の文字が空白なら囲みます。読み込み側が、先頭の空白を取り除いてしまうことがあるからです。

## ここがすごい

- **速い道と一般的な道を分ける**: ほとんどの区切りは ASCII なので、バイトを 1 つずつ見る速い道を使います。例外だけ、文字として探します。
- **読み込み側の癖を見越す**: 先頭の空白や `\.` のような、読み込みで誤解されるものを、書き出しの時点で囲んでおきます。
- **囲むかどうかだけを返す**: 囲みの処理はしません。判定だけを分けておくことで、書き出し側が囲みの方法を決められます。

## まとめ

- `fieldNeedsQuotes` は、CSV のフィールドを `"` で囲むべきかを判定します。
- 空と `\.` は特別に扱い、区切り・引用符・改行を含むものは囲みます。
- 区切り文字が ASCII なら、バイト単位の速い判定を使います。
- 先頭が空白のフィールドも、読み込みの誤解を防ぐために囲みます。
