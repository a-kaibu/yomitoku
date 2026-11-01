---
title: "大文字小文字を無視した比較を、ASCII と Unicode の二段構えで速くする"
description: "大文字と小文字の違いを無視して 2 つの文字列が等しいかを調べる strings.EqualFold。ASCII 専用の速い道と、Unicode の文字の輪をたどる一般の道を使い分けます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [1210, 1285]
function: "EqualFold"
difficulty: 3
format: 2
tags: [文字列処理, Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.EqualFold("Go", "GO")` は `true` を返します。大文字・小文字の違いを無視して（ケースフォールディングして）2 つの文字列が同じかを調べる関数です。
`"σ"` と `"Σ"` のような ASCII 以外の文字にも対応しています。

素直に書くと「両方を小文字に変換してから比べる」ですが、それだと新しい文字列を 2 つも作ります。この関数は **1 文字ずつ、その場で比べる** ので、メモリを確保しません。

## コード

::: code-group

```go:line-numbers=1210 [日本語訳]
func EqualFold(s, t string) bool {
	// ASCII 用の高速パス
	i := 0
	for n := min(len(s), len(t)); i < n; i++ {
		sr := s[i]
		tr := t[i]
		if sr|tr >= utf8.RuneSelf {
			goto hasUnicode
		}

		// 単純な場合。
		if tr == sr {
			continue
		}

		// 以降の処理を簡単にするため sr < tr にそろえる。
		if tr < sr {
			tr, sr = sr, tr
		}
		// ASCII だけなので、sr/tr は大文字と小文字のはず。
		if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
			continue
		}
		return false
	}
	// 両方の文字列を使い切ったか確かめる。
	return len(s) == len(t)

hasUnicode:
	s = s[i:]
	t = t[i:]
	for _, sr := range s {
		// t を使い切っていれば、文字列は等しくない。
		if len(t) == 0 {
			return false
		}

		// 2 つ目の文字列から先頭のルーンを取り出す。
		tr, size := utf8.DecodeRuneInString(t)
		t = t[size:]

		// 一致すれば続ける。一致しなければ false を返す。

		// 単純な場合。
		if tr == sr {
			continue
		}

		// 以降の処理を簡単にするため sr < tr にそろえる。
		if tr < sr {
			tr, sr = sr, tr
		}
		// ASCII かどうかの高速チェック。
		if tr < utf8.RuneSelf {
			// ASCII だけなので、sr/tr は大文字と小文字のはず。
			if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
				continue
			}
			return false
		}

		// 一般の場合。SimpleFold(x) は x より大きい次の同値なルーンを返し、
		// なければ小さい値に一周して戻る。
		r := unicode.SimpleFold(sr)
		for r != sr && r < tr {
			r = unicode.SimpleFold(r)
		}
		if r == tr {
			continue
		}
		return false
	}

	// 最初の文字列が空なので、2 つ目も空か確かめる。
	return len(t) == 0
}
```

```go:line-numbers=1210 [原文]
func EqualFold(s, t string) bool {
	// ASCII fast path
	i := 0
	for n := min(len(s), len(t)); i < n; i++ {
		sr := s[i]
		tr := t[i]
		if sr|tr >= utf8.RuneSelf {
			goto hasUnicode
		}

		// Easy case.
		if tr == sr {
			continue
		}

		// Make sr < tr to simplify what follows.
		if tr < sr {
			tr, sr = sr, tr
		}
		// ASCII only, sr/tr must be upper/lower case
		if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
			continue
		}
		return false
	}
	// Check if we've exhausted both strings.
	return len(s) == len(t)

hasUnicode:
	s = s[i:]
	t = t[i:]
	for _, sr := range s {
		// If t is exhausted the strings are not equal.
		if len(t) == 0 {
			return false
		}

		// Extract first rune from second string.
		tr, size := utf8.DecodeRuneInString(t)
		t = t[size:]

		// If they match, keep going; if not, return false.

		// Easy case.
		if tr == sr {
			continue
		}

		// Make sr < tr to simplify what follows.
		if tr < sr {
			tr, sr = sr, tr
		}
		// Fast check for ASCII.
		if tr < utf8.RuneSelf {
			// ASCII only, sr/tr must be upper/lower case
			if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
				continue
			}
			return false
		}

		// General case. SimpleFold(x) returns the next equivalent rune > x
		// or wraps around to smaller values.
		r := unicode.SimpleFold(sr)
		for r != sr && r < tr {
			r = unicode.SimpleFold(r)
		}
		if r == tr {
			continue
		}
		return false
	}

	// First string is empty, so check if the second one is also empty.
	return len(t) == 0
}
```

:::

## 前提知識

- **バイトとルーン**: Go の文字列はバイトの並びで、日本語などは UTF-8 で複数バイトになります。1 文字（Unicode のコードポイント）を Go では **ルーン（rune）** と呼びます。
- **`for _, sr := range s`**: 文字列を `range` で回すと、1 バイトずつではなく **1 ルーンずつ** 取り出されます。
- **`utf8.DecodeRuneInString(t)`**: 文字列の先頭の 1 ルーンと、それが何バイトだったかを返します。
- **`goto`**: 指定したラベル（ここでは `hasUnicode:`）へ処理を飛ばします。Go にもあり、このように「途中で別のやり方に切り替える」場面で使われます。
- **`tr, sr = sr, tr`**: 2 つの変数を一度に入れ替える Go の書き方です。
- **`'a' - 'A'`**: 文字はそのまま数値として計算できます。ASCII では小文字は大文字より 32 大きいので、この値は 32 です。

## 何をしているか

### 1. ASCII の速い道

```go:line-numbers=1212
	i := 0
	for n := min(len(s), len(t)); i < n; i++ {
		sr := s[i]
		tr := t[i]
		if sr|tr >= utf8.RuneSelf {
			goto hasUnicode
		}

		// 単純な場合。
		if tr == sr {
			continue
		}

		// 以降の処理を簡単にするため sr < tr にそろえる。
		if tr < sr {
			tr, sr = sr, tr
		}
		// ASCII だけなので、sr/tr は大文字と小文字のはず。
		if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
			continue
		}
		return false
	}
	// 両方の文字列を使い切ったか確かめる。
	return len(s) == len(t)
```

1 バイトずつ比べます。 `sr|tr >= utf8.RuneSelf` は、**2 つのバイトのどちらかが 128 以上か** を 1 回の比較で調べています。そうなら Unicode の処理（`hasUnicode`）へ切り替えます。

同じなら次へ。違う場合は、まず小さいほうを `sr` にそろえます。こうすると「`sr` が大文字で、`tr` がその小文字か」の 1 通りだけ調べればよくなります。`'A'` と `'a'` なら `'A' + 32 == 'a'` なので一致とみなします。

### 2. Unicode の道

```go:line-numbers=1238
hasUnicode:
	s = s[i:]
	t = t[i:]
	for _, sr := range s {
		// t を使い切っていれば、文字列は等しくない。
		if len(t) == 0 {
			return false
		}

		// 2 つ目の文字列から先頭のルーンを取り出す。
		tr, size := utf8.DecodeRuneInString(t)
		t = t[size:]

		// 一致すれば続ける。一致しなければ false を返す。

		// 単純な場合。
		if tr == sr {
			continue
		}

		// 以降の処理を簡単にするため sr < tr にそろえる。
		if tr < sr {
			tr, sr = sr, tr
		}
		// ASCII かどうかの高速チェック。
		if tr < utf8.RuneSelf {
			// ASCII だけなので、sr/tr は大文字と小文字のはず。
			if 'A' <= sr && sr <= 'Z' && tr == sr+'a'-'A' {
				continue
			}
			return false
		}

		// 一般の場合。SimpleFold(x) は x より大きい次の同値なルーンを返し、
		// なければ小さい値に一周して戻る。
		r := unicode.SimpleFold(sr)
		for r != sr && r < tr {
			r = unicode.SimpleFold(r)
		}
		if r == tr {
			continue
		}
		return false
	}

	// 最初の文字列が空なので、2 つ目も空か確かめる。
	return len(t) == 0
```

ASCII でない文字が出てきた位置から先を、ルーン単位で比べます。ASCII のときと同じく、小さいほうを `sr` にそろえます。

ポイントはす。`unicode.SimpleFold(r)` は「`r` と同じとみなされる文字のうち、次に大きいもの」を返し、いちばん大きいものの次は小さいほうへ戻ります。たとえば K の仲間は `K`（U+004B）→ `k`（U+006B）→ `K`（ケルビン記号 U+212A）→ `K` と **輪** になっています。この輪を `sr` から順にたどり、`tr` に到達すれば同じ文字とみなします。

## ここがすごい

- **メモリを確保しない**: 小文字に変換した新しい文字列を作らないので、ガベージ（不要になったメモリ）が出ません。比較だけのためにメモリを使わない設計です。
- **2 つのバイトをまとめて検査**: `sr|tr >= 128` は「どちらかの最上位ビットが立っているか」を OR 1 回で調べる小技です。
- **小さいほうにそろえる**: 入れ替えによって、調べるべき組み合わせが半分になります。
- **輪をたどる発想**: 同じとみなす文字が 3 つ以上ある場合（K とケルビン記号など）にも、`SimpleFold` の輪を途中まで回るだけで対応できます。`r < tr` で止めるので、余計に回りません。

## まとめ

- 比較のためだけに変換後の文字列を作らず、1 文字ずつその場で比べるとメモリを節約できる。
- ASCII の速い道と、Unicode の一般の道を分けると、よくある入力で速くなる。
- 2 つの値の大小をそろえると、場合分けを減らせる。
- Unicode では「大文字と小文字」が 1 対 1 とは限らない。
