---
title: "1 バイトをバッファの末尾へ書く bytes.Buffer.WriteByte"
description: "bytes.Buffer.WriteByte は、1 バイトをバッファの末尾へ書き足します。空きがあればその場で書き、なければ 1 バイトぶんの領域を広げてから書きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [303, 311]
function: "WriteByte"
difficulty: 1
format: 2
tags: [入出力, メモリ管理, 標準ライブラリ]
---

## ひとことで

`buf.WriteByte('\n')` は、改行の 1 バイトを末尾に書きます。エラーは、通常は `nil` です。1 文字ずつ組み立てる処理で、よく使われます。

## コード

```go:line-numbers=303
func (b *Buffer) WriteByte(c byte) error {
	b.lastRead = opInvalid
	m, ok := b.tryGrowByReslice(1)
	if !ok {
		m = b.grow(1)
	}
	b.buf[m] = c
	return nil
}
```

## 前提知識

- **1 バイト**: 8 ビットの値です。ASCII の文字は、1 バイトで表せます。
- **`lastRead`**: 直前の読み出しの種類を覚えておく欄です。書き込みをすると、読み戻しはできなくなります。
- **空きの確認**: 1 バイトぶんの空きがあれば、新しい配列を作らずに書けます。
- **`grow`**: 空きが足りないとき、領域を広げる内部の関数です。

## 何をしているか

### 1. 読み戻しの状態を無効にする

```go:line-numbers=304
	b.lastRead = opInvalid
```

書き込みをしたので、`lastRead` を `opInvalid` にします。直前の読み出しは、もう元に戻せません。

### 2. 空きに 1 バイトが収まるか確かめる

```go:line-numbers=305
	m, ok := b.tryGrowByReslice(1)
```

`tryGrowByReslice(1)` で、今の配列に 1 バイトの空きがあるかを試します。

### 3. 足りなければ広げる

```go:line-numbers=306
	if !ok {
		m = b.grow(1)
	}
```

空きが無ければ、`grow(1)` で 1 バイトぶんの領域を確保します。確保した位置 `m` を使います。

### 4. バイトを書いて成功を返す

```go:line-numbers=309
	b.buf[m] = c
	return nil
```

位置 `m` に `c` を書き、`nil` を返します。

## ここがすごい

- **空きを優先する**: 多くの書き込みは、配列を作り直さずに済みます。
- **エラーを返さない設計**: 1 バイトの書き込みは、失敗する場面がほとんどないので、`nil` を返すのが基本です。
- **1 バイトずつの組み立てに強い**: 文字を 1 つずつ足す処理が、簡単に書けます。

## まとめ

- 読み戻しの状態を無効にして、空きを確かめる。
- 足りなければ 1 バイトぶん広げ、末尾に書く。
- 失敗は基本的に起きないので、`nil` を返す。
