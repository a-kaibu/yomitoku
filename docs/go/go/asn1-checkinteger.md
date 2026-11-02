---
title: "ASN.1 の整数の符号化が無駄に長くないかを調べる checkInteger"
description: "encoding/asn1 の checkInteger。整数を表すバイト列が、必要以上に長く書かれていないかを確かめる。先頭の 2 バイトが、不要な 0 や 0xff の並びになっていれば、誤りとして報告する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/asn1/asn1.go"
lines: [82, 93]
function: "checkInteger"
difficulty: 2
tags: [パース, 防御的プログラミング, 数値計算]
---

## ひとことで

`checkInteger(bytes)` は、ASN.1 の整数を表すバイト列が、正しい最短の形で書かれているかを確かめます。例えば、本来要らない先頭の 0 が付いていれば、誤りとして報告します。

ASN.1 は、データを決まった形で表すための規格です。同じ値を表すのに、長さの違う書き方を許すと、比べたときに食い違いが起きるので、最短の形だけを認めます。

## コード

```go:line-numbers=82
func checkInteger(bytes []byte) error {
	if len(bytes) == 0 {
		return StructuralError{"empty integer"}
	}
	if len(bytes) == 1 {
		return nil
	}
	if (bytes[0] == 0 && bytes[1]&0x80 == 0) || (bytes[0] == 0xff && bytes[1]&0x80 == 0x80) {
		return StructuralError{"integer not minimally-encoded"}
	}
	return nil
}
```

## 前提知識

- **ASN.1**: 通信や証明書で使われる、データの形式を決める規格です。整数は、バイトの列で表されます。
- **二の補数**: 負の数を、ビットの並びで表す方法です。先頭のビットが 1 なら負の数になります。
- **最短の形**: 同じ値を表すのに、必要最小限のバイト数で書かれた形です。余計な先頭のバイトは付けません。
- **`StructuralError`**: 構造が正しくないことを表す、エラーの型です。

## 何をしているか

### 1. 空の場合を弾く

```go:line-numbers=83
	if len(bytes) == 0 {
		return StructuralError{"empty integer"}
	}
```

整数を表すバイトが一つもなければ、値がありません。エラーを返します。

### 2. 不要な先頭の 0 や 0xff を弾く

```go:line-numbers=89
	if (bytes[0] == 0 && bytes[1]&0x80 == 0) || (bytes[0] == 0xff && bytes[1]&0x80 == 0x80) {
		return StructuralError{"integer not minimally-encoded"}
	}
```

先頭が `0` で、次のバイトの最上位ビットが 0 なら、先頭の 0 は要りません。先頭が `0xff` で、次のバイトの最上位ビットが 1 なら、先頭の `0xff` も要りません。どちらの場合も、最短の形ではないので誤りです。

## ここがすごい

- **長さの違いを許さない**: 同じ値の書き方を一通りに決めることで、比べたときの食い違いを防げます。
- **二つのバイトだけで判断**: 最短の形かどうかは、先頭の二つのバイトだけで分かります。残りを見る必要がありません。
- **1 バイトの整数は正しい**: 長さが 1 のときは、そのまま `nil` を返します。最短の形になる仕組みを、ここで特別扱いしています。

## まとめ

- `checkInteger` は、整数のバイト列が最短の形で書かれているかを確かめます。
- 空のバイト列と、余計な先頭のバイトは、どちらもエラーにします。
- 先頭の二つのバイトだけで、最短かどうかを判定します。
