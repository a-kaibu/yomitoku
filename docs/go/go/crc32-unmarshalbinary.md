---
title: "CRC32 の計算途中の状態を読み戻す。識別子と表を確かめる"
description: "hash/crc32 の digest.UnmarshalBinary。保存しておいた計算途中の状態から、ハッシュの計算を再開する。識別子の文字、データの長さ、使う表の一致を順に確かめ、問題がなければ途中の値を戻す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/hash/crc32/crc32.go"
lines: [183, 195]
function: "UnmarshalBinary"
difficulty: 2
tags: [防御的プログラミング, 数値計算, 入出力]
---

## ひとことで

`d.UnmarshalBinary(b)` は、以前に保存した CRC32 の計算途中の状態 `b` を読み込んで、計算を続けられるように戻します。保存したバイト列の中には、識別子、途中の値、表の情報が入っています。

途中の状態を別の計算に読み込むと、結果が静かに狂ってしまいます。そのため、この関数は、読み込む前に三つのことを確かめます。

## コード

```go:line-numbers=183
func (d *digest) UnmarshalBinary(b []byte) error {
	if len(b) < len(magic) || string(b[:len(magic)]) != magic {
		return errors.New("hash/crc32: invalid hash state identifier")
	}
	if len(b) != marshaledSize {
		return errors.New("hash/crc32: invalid hash state size")
	}
	if tableSum(d.tab) != byteorder.BEUint32(b[4:]) {
		return errors.New("hash/crc32: tables do not match")
	}
	d.crc = byteorder.BEUint32(b[8:])
	return nil
}
```

## 前提知識

- **CRC32**: データの誤りを見つけるための、32 ビットの検査値です。データを順番に計算しながら、途中の値を持ち続けます。
- **`magic`**: 保存された状態の先頭に付く識別子です。別の種類のデータを、誤って読むことを防ぎます。
- **`marshaledSize`**: 保存された状態の決まった長さです。長さが違えば、壊れているか、別のものです。
- **表（tab）**: CRC32 の計算に使う、あらかじめ作られた表です。表が違えば、同じデータでも計算結果が変わります。

## 何をしているか

### 1. 識別子と長さを確かめる

```go:line-numbers=184
	if len(b) < len(magic) || string(b[:len(magic)]) != magic {
		return errors.New("hash/crc32: invalid hash state identifier")
	}
	if len(b) != marshaledSize {
		return errors.New("hash/crc32: invalid hash state size")
	}
```

先頭の識別子が違えば、この状態はこの計算のものではありません。長さが決まった大きさと違っても、読むことはできません。どちらの場合も、エラーを返します。

### 2. 表が一致するかを確かめる

```go:line-numbers=190
	if tableSum(d.tab) != byteorder.BEUint32(b[4:]) {
		return errors.New("hash/crc32: tables do not match")
	}
	d.crc = byteorder.BEUint32(b[8:])
```

保存されていた表の検査値と、今の表の検査値を比べます。違えば、途中の値は別の表で作られたものなので、使えません。一致した場合だけ、保存された途中の値 `crc` を読み込みます。

## ここがすごい

- **三段階で確かめる**: 識別子、長さ、表の一致の順に確かめます。どの段階で壊れたかが、エラーの文字から分かります。
- **誤りを静かに通さない**: 途中の状態を、確かめずに読むと、後の結果が一見正しく見えて狂ってしまいます。最初に止めるのが安全です。
- **値は最後に入れる**: 確かめが全部済んでから、`d.crc` に値を入れます。失敗したときに、中途半端な状態が残りません。

## まとめ

- `UnmarshalBinary` は、保存された計算途中の CRC32 の状態を読み込みます。
- 識別子、長さ、表の一致の三つを、順に確かめます。
- すべて合格したときだけ、途中の値を入れます。
