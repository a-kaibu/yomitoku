---
title: "表の中のエスケープの始まりを判定する tabwriter の startEscape"
description: "text/tabwriter の startEscape。書き込みの文字がエスケープの開始記号なら、それに対応する終わりの文字を覚える。\\xff は同じ文字で閉じ、< は > で、& は ; で閉じる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/text/tabwriter/tabwriter.go"
lines: [430, 439]
function: "startEscape"
difficulty: 2
tags: [パース, 状態機械, 文字列処理]
---

## ひとことで

`text/tabwriter` は、タブで区切った表を、列が揃うように整形して出力します。その中に、整形の対象にしない部分（エスケープ）を入れられます。`startEscape(ch)` は、エスケープが始まったときに、どの文字で終わるかを記録する関数です。

例えば `<` で始まれば、`>` が来るまでがエスケープになります。

## コード

```go:line-numbers=430
func (b *Writer) startEscape(ch byte) {
	switch ch {
	case Escape:
		b.endChar = Escape
	case '<':
		b.endChar = '>'
	case '&':
		b.endChar = ';'
	}
}
```

## 前提知識

- **エスケープ領域**: 中身をそのまま出力して、列の幅の計算に含めない部分です。HTML のタグなどを、表の中に書くときに使います。
- **`endChar`**: エスケープを終わらせる文字を覚えておく変数です。`0` ならエスケープ中ではありません。
- **`Escape`**: 特別な文字 `\xff` です。開始と終了が同じ文字の、最も単純なエスケープ記号です。
- **状態機械**: 「今エスケープ中か」を覚えて、次の文字で状態を変える仕組みです。

## 何をしているか

### 1. Escape 文字は同じ文字で終わる

```go:line-numbers=431
	switch ch {
	case Escape:
		b.endChar = Escape
```

開始の文字が `Escape`（`\xff`）なら、終わりも `Escape` です。同じ文字が再び来たら、エスケープを終えます。

### 2. 山括弧と & は対応する文字で終わる

```go:line-numbers=434
	case '<':
		b.endChar = '>'
	case '&':
		b.endChar = ';'
	}
```

`<` で始まれば、`>` で終わります。`&` で始まれば、`;` で終わります。これは、HTML のタグや実体参照（`&amp;` など）の形に合わせた対応です。

## ここがすごい

- **終わりの文字を覚えるだけで状態が表せる**: エスケープが始まったときに、終わりの文字だけを覚えておきます。あとは、その文字が来るまで読み進めればよいので、状態の管理が単純です。
- **対応を表で決める**: 開始の文字と終了の文字の組を、`switch` の中に並べています。新しい組を増やすのも簡単です。
- **それ以外は何もしない**: 知らない文字なら、`switch` の節に当たらず、エスケープは始まりません。通常の文字として扱われます。

## まとめ

- `startEscape` は、エスケープの開始文字を見て、終わりの文字を記録します。
- `\xff` は同じ文字で、`<` は `>` で、`&` は `;` で閉じます。
- 記録された終わりの文字が来るまで、その部分は整形の対象になりません。
- 開始でない文字には、何もしません。
