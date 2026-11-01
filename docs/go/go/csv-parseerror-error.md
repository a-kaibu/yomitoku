---
title: "CSV の読み込み失敗を行と列で説明する ParseError.Error"
description: "csv.ParseError.Error は、CSV の読み込みに失敗した場所を文字列にします。フィールド数の誤りは行だけを、それ以外は行と列を示し、開始行が違えばその範囲も書きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/csv/reader.go"
lines: [74, 82]
function: "Error"
difficulty: 1
format: 2
tags: [パース, 文字列処理, エラー処理, 標準ライブラリ]
---

## ひとことで

CSV の読み込みで失敗すると、`record on line 3: wrong number of fields` のような文字列が得られます。どの行で何が起きたかが、エラーの文章にそのまま出ます。

## コード

```go:line-numbers=74
func (e *ParseError) Error() string {
	if e.Err == ErrFieldCount {
		return fmt.Sprintf("record on line %d: %v", e.Line, e.Err)
	}
	if e.StartLine != e.Line {
		return fmt.Sprintf("record on line %d; parse error on line %d, column %d: %v", e.StartLine, e.Line, e.Column, e.Err)
	}
	return fmt.Sprintf("parse error on line %d, column %d: %v", e.Line, e.Column, e.Err)
}
```

## 前提知識

- **`ParseError`**: CSV の読み込みで起きた失敗を表す構造体です。行番号、列番号、原因のエラーを持ちます。
- **`fmt.Sprintf`**: 書式を決めて文字列を組み立てる関数です。`%d` は数、`%v` は値をそのまま表します。
- **`ErrFieldCount`**: 1 行の項目数が、前の行と合わないときの原因を表すエラーです。
- **複数行にまたがるレコード**: 引用符の中で改行があると、1 件のレコードが複数の行にまたがります。そのとき開始行と終了行が違います。

## 何をしているか

### 1. 項目数の誤りは行だけを示す

```go:line-numbers=75
	if e.Err == ErrFieldCount {
		return fmt.Sprintf("record on line %d: %v", e.Line, e.Err)
	}
```

項目数が合わないときは、どの行で起きたかだけを書きます。列を指しても意味がないので、行番号だけで十分です。

### 2. 複数行のレコードは範囲を示す

```go:line-numbers=78
	if e.StartLine != e.Line {
		return fmt.Sprintf("record on line %d; parse error on line %d, column %d: %v", e.StartLine, e.Line, e.Column, e.Err)
	}
```

開始行と現在の行が違うときは、「開始行の終わり」と「失敗した行と列」を両方書きます。複数行にまたがるレコードでも、どこが悪いかを正確に伝えます。

### 3. それ以外は行と列を示す

```go:line-numbers=81
	return fmt.Sprintf("parse error on line %d, column %d: %v", e.Line, e.Column, e.Err)
```

普通の失敗は、行と列と原因を書きます。利用者は、表示された位置を開いて、その場所を直せます。

## ここがすごい

- **場所をそのまま伝える**: 行と列が文章に入るので、エラーを受けた人が、ファイルのどこを見ればよいか分かります。
- **場合ごとに文章を変える**: 不要な情報を省くので、読みやすい文章になります。
- **原因を失わない**: 元のエラーを `%v` で文字列に入れるので、どんな失敗かも同時に伝えられます。

## まとめ

- 失敗の種類ごとに、必要な情報だけを文章にする。
- 行と列を示すので、利用者が場所を特定できる。
- 原因のエラーを文章に含めて、失敗の中身も伝える。
