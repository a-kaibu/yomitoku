---
title: "コピーせずに []byte を文字列に変える strings.Builder の秘密"
description: "strings.Builder が組み立てたバイト列を、コピーなしで文字列として返すメソッド。unsafe を使って「同じメモリを文字列として見る」だけで済ませています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/builder.go"
lines: [46, 48]
function: "(*Builder).String"
difficulty: 3
tags: [メモリ管理, 最適化, 低レイヤ, 標準ライブラリ]
---

## ひとことで

`strings.Builder` は、文字列を少しずつ組み立てるための型です。`String()` は、組み立て終わった中身を文字列として返します。

ふつう Go では `string(b)` のように `[]byte`（バイトのスライス）を文字列に変換すると、**中身がまるごとコピー** されます。このメソッドは `unsafe` パッケージを使って、**コピーせずに同じメモリをそのまま文字列として扱います**。たった 1 行ですが、Builder の存在意義そのものと言える行です。

## コード

```go:line-numbers=46
func (b *Builder) String() string {
	return unsafe.String(unsafe.SliceData(b.buf), len(b.buf))
}
```

## 前提知識

- **文字列は変更できない**: Go の文字列は一度作ると中身を変えられません（イミュータブル）。だから複数の場所で安心して共有できます。
- **`[]byte` は変更できる**: バイトのスライスは中身を書き換えられます。そのため `string(b)` で変換するとき、Go は「後で `b` が書き換えられても文字列が変わらないように」コピーを作ります。
- **`unsafe` パッケージ**: Go の型の安全性をあえて破る機能です。正しく使わないとメモリを壊すので、標準ライブラリなど特別な場所でだけ使われます。
- **`unsafe.SliceData(b.buf)`**: スライスの中身が置かれているメモリの先頭を指すポインタを返します。
- **`unsafe.String(ptr, len)`**: ポインタと長さから、そのメモリを指す文字列を作ります。コピーはしません。
- **メソッド**: `func (b *Builder) String()` は `Builder` 型に付いた関数で、`b.String()` のように呼びます。`b` は呼び出し元の Builder を指すポインタです。

## 何をしているか

### 1. バイト列の場所を取る

`unsafe.SliceData(b.buf)` で、Builder の内部バッファ `b.buf` の先頭アドレスを取り出します。

### 2. 同じ場所を文字列として見る

`unsafe.String(..., len(b.buf))` で、そのアドレスから `len(b.buf)` バイトを **文字列として見るだけ** の値を作ります。

たとえば `b.WriteString("Hello, ")`、`b.WriteString("Go")` のあとで `b.String()` を呼ぶと、内部バッファの 9 バイトをそのまま指す `"Hello, Go"` が返ります。新しいメモリは 1 バイトも使いません。

### なぜ安全なのか

文字列が変更されないためには、元の `b.buf` も変更されてはいけません。Builder は **書き足し（append）しかしない** ように作られています。すでに書いた部分を書き換えるメソッドはありません。容量が足りなくなったときは新しいバッファに移る（`grow`）ので、古いバッファ（返した文字列が指している場所）は変わりません。

`Reset()` も、バッファを書き換えるのではなく `nil` にして手放すだけです。

## ここがすごい

- **コピーゼロ**: 大きな文字列を組み立てる場合でも、最後の取り出しにコストがかかりません。`bytes.Buffer` の `String()` はコピーを作るので、文字列を作るのが目的なら `strings.Builder` のほうが有利です。
- **安全性を「設計」で守る**: `unsafe` そのものは危険ですが、「書き足ししかしない」という API の設計によって、文字列が後から変わることがないよう保証しています。危険な道具を、安全に使える範囲に閉じ込めています。
- **コピーされた Builder を検出する**: 値ごとコピーされた Builder に書き込むとこの保証が崩れるので、Builder は `copyCheck` という仕組みでそれを検出して `panic` します。

## まとめ

- Go の `string([]byte)` はコピーを作る。変更できる値と変更できない値を分けるため。
- 「後から書き換えない」と保証できるなら、`unsafe` でコピーを省ける。
- 危険な最適化は、API の設計で安全な範囲に閉じ込めて使う。
