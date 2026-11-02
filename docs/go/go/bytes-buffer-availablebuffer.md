---
title: "空いている領域を一時的な書き込み先として返す bytes.Buffer.AvailableBuffer"
description: "bytes.Buffer.AvailableBuffer は、バッファの空いている領域を、長さ 0 のスライスとして返します。ここに append で書き、その結果を Write すると、余分なコピーを減らせます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [66, 66]
function: "AvailableBuffer"
difficulty: 2
format: 2
tags: [メモリ管理, 入出力, 最適化, 標準ライブラリ]
---

## ひとことで

`buf.AvailableBuffer()` は、空いている領域を指す、長さ 0 のスライスを返します。ここに `strconv.AppendInt` などで直接書くと、一時的なバッファを別に作らずに済みます。

## コード

```go:line-numbers=66
func (b *Buffer) AvailableBuffer() []byte { return b.buf[len(b.buf):] }
```

## 前提知識

- **長さ 0 で容量のあるスライス**: 長さは 0 でも、容量がある値は、後ろに `append` で書けます。
- **`b.buf[len(b.buf):]`**: 今の長さの位置から後ろを切り出すので、空いている領域の先頭を指します。
- **`Write` と組み合わせる**: 書いた結果を、そのまま `Write` に渡すと、2 回のコピーを避けられます。
- **変換用の一時バッファ**: 数を文字列にする前の、中間の置き場所として使われます。

## 何をしているか

### 1. 空いている領域の先頭を指す

```go:line-numbers=66
func (b *Buffer) AvailableBuffer() []byte { return b.buf[len(b.buf):] }
```

`b.buf[len(b.buf):]` は、書き込まれた部分のすぐ後ろを指します。長さは 0 なので、中身は空ですが、容量の分だけ後ろに書けます。

## ここがすごい

- **余分なバッファを作らない**: 一時的な領域を別に確保せず、バッファの空きをそのまま使えます。
- **書いたものをそのまま渡せる**: 書いた結果を `Write` に渡すと、コピーが 1 回減ります。
- **安全に書ける**: 書いた分だけが `Write` の対象になるので、関係ない領域を読むことがありません。

## まとめ

- 空いている領域を、長さ 0 のスライスとして返す。
- そこに直接書いて、結果を `Write` に渡せる。
- 一時的なバッファを作る手間が省ける。
