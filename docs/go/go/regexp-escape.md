---
title: "正規表現の特殊文字を読み直せる形に書く regexp/syntax の escape"
description: "正規表現の 1 文字を、そのまま一致させる形で書き出す escape。印字できる特殊文字の前にだけ \\ を付け、制御文字は \\n や \\x0a のような書き方にする。Go の regexp の文字列表示で使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/regexp.go"
lines: [398, 434]
function: "escape"
difficulty: 2
tags: [正規表現, 文字列処理, Unicode]
---

## ひとことで

`regexp.QuoteMeta` は、正規表現の特殊文字を `\.` のように書き換えて、「文字そのものとして一致させる」形の文字列を作ります。`syntax` の内部には、正規表現を文字列に戻すための `escape` があり、1 文字を、読み直せる書き方で書き出します。

例えば `.` は `\.`、改行は `\n`、0x01 は `\x01` になります。

## コード

```go:line-numbers=398
func escape(b *strings.Builder, r rune, force bool) {
	if unicode.IsPrint(r) {
		if strings.ContainsRune(meta, r) || force {
			b.WriteRune('\\')
		}
		b.WriteRune(r)
		return
	}

	switch r {
	case '\a':
		b.WriteString(`\a`)
	case '\f':
		b.WriteString(`\f`)
	case '\n':
		b.WriteString(`\n`)
	case '\r':
		b.WriteString(`\r`)
	case '\t':
		b.WriteString(`\t`)
	case '\v':
		b.WriteString(`\v`)
	default:
		if r < 0x100 {
			b.WriteString(`\x`)
			s := strconv.FormatInt(int64(r), 16)
			if len(s) == 1 {
				b.WriteRune('0')
			}
			b.WriteString(s)
			break
		}
		b.WriteString(`\x{`)
		b.WriteString(strconv.FormatInt(int64(r), 16))
		b.WriteString(`}`)
	}
}
```

## 前提知識

- **メタ文字**: 正規表現で特別な意味を持つ文字です。`.`、`*`、`+`、`(` などがあります。そのまま書くと、特別な働きをしてしまいます。
- **`strings.Builder`**: 文字列を少しずつ書き足すための型です。`WriteRune` や `WriteString` で書きます。
- **`unicode.IsPrint`**: 文字が画面に表示できるかを判定する関数です。表示できない文字は、エスケープして書きます。
- **`\x` と `\x{...}`**: 16 進数で文字を表す書き方です。256 未満は `\xHH`、それ以上は `\x{HHHH}` の形です。

## 何をしているか

### 1. 表示できる文字は、必要ならバックスラッシュを付ける

```go:line-numbers=399
	if unicode.IsPrint(r) {
		if strings.ContainsRune(meta, r) || force {
			b.WriteRune('\\')
		}
		b.WriteRune(r)
		return
	}
```

表示できる文字は、そのまま書きます。ただし、`meta` に含まれる特殊文字や、`force` が真のときは、前に `\` を付けて文字として扱わせます。

### 2. 特別な制御文字は短い書き方にする

```go:line-numbers=407
	switch r {
	case '\a':
		b.WriteString(`\a`)
	case '\f':
		b.WriteString(`\f`)
	case '\n':
		b.WriteString(`\n`)
```

ベル、改ページ、改行などは、読みやすい短い書き方にします。`\a` や `\n` は、正規表現の中でも同じ意味で読めます。

### 3. 他の制御文字は 16 進数で書く

```go:line-numbers=421
		if r < 0x100 {
			b.WriteString(`\x`)
			s := strconv.FormatInt(int64(r), 16)
			if len(s) == 1 {
				b.WriteRune('0')
			}
			b.WriteString(s)
			break
		}
```

256 未満の文字は `\xHH` の形で書きます。16 進数の桁が 1 つのときは、前に `0` を足して 2 桁にそろえます。256 以上は、次の段階で `\x{...}` の形にします。

## ここがすごい

- **書き出した結果を正規表現として読める**: 出力された文字列を、もう一度正規表現として読むと、元の文字に戻ります。表示と解析が、互いに整合しています。
- **表示できるかで分ける**: 見えない文字だけをエスケープするので、普通の文字は読みやすいまま残ります。
- **2 桁にそろえる**: `\x0a` のように、必ず 2 桁で書くことで、読み手にも明確です。

## まとめ

- `escape` は、正規表現の 1 文字を、読み直せる形で書き出します。
- 表示できる文字は、特殊文字のときだけ `\` を付けます。
- `\a`、`\n` などの制御文字は、短い書き方にします。
- それ以外は、256 未満なら `\xHH`、それ以上なら `\x{...}` の形にします。
