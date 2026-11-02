---
title: "バッファから区切り文字までを切り出す bytes.Buffer.readSlice"
description: "bytes.Buffer の内部 readSlice。指定した区切り文字までのバイト列を、コピーせずに元のバッファのスライスとして返し、読み位置を進める。区切りが無ければ残り全部を返して io.EOF を付ける。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/buffer.go"
lines: [457, 468]
function: "readSlice"
difficulty: 2
tags: [入出力, メモリ管理, 文字列処理]
---

## ひとことで

`bytes.Buffer` は、バイト列を先頭から読み出せるバッファです。`readSlice(delim)` は、読み位置から区切り文字 `delim` までを取り出します。`ReadBytes('\n')` や `ReadString('\n')` は、この関数を使って 1 行を取り出します。

取り出した行は、バッファの中身を指すスライスです。新しいメモリにコピーしないのが特徴です。

## コード

```go:line-numbers=457
func (b *Buffer) readSlice(delim byte) (line []byte, err error) {
	i := IndexByte(b.buf[b.off:], delim)
	end := b.off + i + 1
	if i < 0 {
		end = len(b.buf)
		err = io.EOF
	}
	line = b.buf[b.off:end]
	b.off = end
	b.lastRead = opRead
	return line, err
}
```

## 前提知識

- **`b.buf` と `b.off`**: `buf` は保存されているバイト列、`off` は次に読む位置です。読んだ分だけ `off` を進めます。
- **`io.EOF`**: 読み終わりを表すエラーです。区切り文字が見つからなかったときに、残りを返して、このエラーを付けます。
- **`lastRead`**: 直前に何をしたかを覚える変数です。`UnreadByte` などが、その情報を使って戻れるかを判断します。
- **スライス式 `b.buf[b.off:end]`**: 元の配列の一部を指すスライスです。コピーは起きません。

## 何をしているか

### 1. 区切りを探して終わりの位置を決める

```go:line-numbers=458
	i := IndexByte(b.buf[b.off:], delim)
	end := b.off + i + 1
```

読み位置以降で、区切り文字の最初の位置を探します。`end` は、区切り文字を含めた終わりの位置です。区切りが見つからなければ `i` は `-1` なので、この `end` は使われません。

### 2. 区切りがなければ残り全部

```go:line-numbers=460
	if i < 0 {
		end = len(b.buf)
		err = io.EOF
	}
```

区切りがなければ、残り全部を 1 つの行として返します。そのとき、読み終わりを表す `io.EOF` を付けます。呼び出し側は、このエラーで「最後の行である」と分かります。

### 3. 読み位置を進めて返す

```go:line-numbers=464
	line = b.buf[b.off:end]
	b.off = end
	b.lastRead = opRead
	return line, err
```

`b.buf[b.off:end]` で、行をスライスとして取り出します。読み位置 `off` を `end` に進め、直前の操作を `opRead` として記録してから返します。

## ここがすごい

- **コピーをしない**: 行を返すのに、新しいバイト列を作りません。元のバッファの一部を指すだけなので、大きなデータでも速く読めます。
- **EOF で終わりを伝える**: 最後の行に区切りがなくても、正しく取り出せます。エラーの有無で、読み終わりを判断できます。
- **直前の操作を覚える**: `lastRead` を残すことで、直後に `UnreadByte` のような戻る操作が正しく働きます。

## まとめ

- `readSlice` は、区切り文字までのバイト列を、バッファの一部として返します。
- 区切りがなければ、残り全部を返し、`io.EOF` を付けます。
- 読み位置を進め、直前の操作を記録します。
- 行をコピーしないので、速く読めます。
