---
title: "接頭辞を取り除いて残りを返す bytes.CutPrefix。見つからなければ元のまま返す"
description: "bytes.CutPrefix。バイト列が指定の接頭辞で始まるかを調べ、始まっていれば接頭辞を除いた残りと true を返す。始まらなければ元のバイト列と false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/bytes.go"
lines: [1434, 1439]
function: "CutPrefix"
difficulty: 1
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`bytes.CutPrefix(s, prefix)` は、バイト列 `s` が `prefix` で始まるかを調べます。始まっていれば、`prefix` を取り除いた残りと `true` を返します。始まっていなければ、`s` をそのまま返して `false` を返します。

接頭辞を取り除くときに、「あるかどうか」の判定と、取り除く処理を一度にできる便利な関数です。

## コード

```go:line-numbers=1434
func CutPrefix(s, prefix []byte) (after []byte, found bool) {
	if !HasPrefix(s, prefix) {
		return s, false
	}
	return s[len(prefix):], true
}
```

## 前提知識

- **バイト列（`[]byte`）**: バイトを並べた配列です。文字列と似ていますが、書き換えられる点が違います。
- **接頭辞（prefix）**: 先頭に付いている部分です。例えば `"http://"` は URL の接頭辞です。
- **複数の戻り値**: Go の関数は、2 つ以上の値を同時に返せます。ここでは、結果と成功したかどうかの 2 つを返します。
- **スライス**: 配列の一部を指す値です。`s[len(prefix):]` は、接頭辞の後ろからの部分を指します。

## 何をしているか

### 1. 接頭辞で始まるかを調べる

```go:line-numbers=1435
	if !HasPrefix(s, prefix) {
		return s, false
	}
```

`HasPrefix` で、`s` が `prefix` で始まるかを確かめます。始まっていなければ、`s` をそのまま返して、見つからなかったことを `false` で知らせます。

### 2. 残りの部分を返す

```go:line-numbers=1438
	return s[len(prefix):], true
```

始まっていれば、`prefix` の長さの分だけ先を指すスライスを返します。コピーは作らず、元のバイト列の後ろ側を指すだけです。`true` で、取り除けたことを伝えます。

## ここがすごい

- **判定と取り除きを一度に**: 「あるか」を調べてから、別の関数で取り除く、という 2 段階の処理が要りません。
- **コピーをしない**: 戻り値は、元の配列の後ろの部分を指します。大きなデータでも、メモリを無駄に使いません。
- **結果の形が統一**: `(残り, 見つかったか)` の形は、`CutSuffix` や `Cut` とそろっています。覚えておくと、他の場面でもそのまま使えます。

## まとめ

- `CutPrefix` は、先頭の接頭辞を取り除いた残りと、成功したかを返します。
- 接頭辞がなければ、元のバイト列と `false` を返します。
- コピーを作らず、元の配列の後ろを指す形で返します。
