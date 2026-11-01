---
title: "直前に読んだ 1 バイトを読み戻す bytes.Buffer.UnreadByte"
description: "bytes.Buffer.UnreadByte は、直前の読み出しが 1 バイトのときに、読み取り位置を 1 つ戻します。直前の操作を lastRead で覚えておき、それ以外では失敗を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [431, 440]
function: "UnreadByte"
difficulty: 2
format: 2
tags: [入出力, パース, 標準ライブラリ]
---

## ひとことで

字句解析（トークナイザ）で、次のトークンを読んだら区切りだったので、その 1 バイトを読み戻したい場面があります。`UnreadByte` は、その 1 バイトを次の読み出しに残します。

## コード

```go:line-numbers=431
func (b *Buffer) UnreadByte() error {
	if b.lastRead == opInvalid {
		return errUnreadByte
	}
	b.lastRead = opInvalid
	if b.off > 0 {
		b.off--
	}
	return nil
}
```

## 前提知識

- **`lastRead`**: 直前の読み出しの種類を覚えておく欄です。`opInvalid` は、読み戻せない状態を表します。
- **読み取り位置 `off`**: 次に読むバイトの位置です。戻すには、この値を 1 つ減らします。
- **`errUnreadByte`**: 読み戻せないときのエラーです。
- **読み出しの後だけ戻せる**: 直前の読み出しの後でしか、1 バイトを戻せません。

## 何をしているか

### 1. 読み戻せる状態か確かめる

```go:line-numbers=432
	if b.lastRead == opInvalid {
		return errUnreadByte
	}
```

直前の操作が無効（`opInvalid`）なら、戻すべきバイトがありません。`errUnreadByte` を返して、失敗を伝えます。

### 2. 状態を無効にして位置を戻す

```go:line-numbers=435
	b.lastRead = opInvalid
	if b.off > 0 {
		b.off--
	}
```

戻したあとは、同じ操作をもう一度戻すことはできないので、`lastRead` を `opInvalid` にします。`off` が 0 より大きければ、1 つ減らします。

### 3. 成功を返す

```go:line-numbers=439
	return nil
```

戻せたら、`nil` を返します。

## ここがすごい

- **読み戻しを 1 回に限る**: 直前の 1 回だけ戻せるように状態を持つので、二重に戻して位置が狂うことがありません。
- **失敗を明示する**: 戻せない場合は、エラーで伝えます。黙って誤った位置へ動くことがありません。
- **状態管理が小さい**: 1 つの欄だけで、読み戻しが安全かを判断できます。

## まとめ

- 直前の読み出しの種類を `lastRead` で覚えておく。
- 戻せるときだけ `off` を 1 つ減らし、状態を無効にする。
- 戻せないときは、エラーで伝える。
