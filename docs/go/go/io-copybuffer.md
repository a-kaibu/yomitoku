---
title: "転送用の一時バッファを指定できる io.CopyBuffer"
description: "io.CopyBuffer は、Reader から Writer へデータを転送します。一時バッファを呼び出し側が渡せるので、何度もコピーするときに確保を減らせます。空のバッファは panic で止めます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [398, 403]
function: "CopyBuffer"
difficulty: 2
format: 2
tags: [入出力, 最適化, 標準ライブラリ]
---

## ひとことで

`io.CopyBuffer(dst, src, buf)` は、`src` の内容を `dst` へ書き写します。`buf` に作っておいた 32 KB のバッファを使えば、毎回の確保を省けます。

## コード

```go:line-numbers=398
func CopyBuffer(dst Writer, src Reader, buf []byte) (written int64, err error) {
	if buf != nil && len(buf) == 0 {
		panic("empty buffer in CopyBuffer")
	}
	return copyBuffer(dst, src, buf)
}
```

## 前提知識

- **`io.Copy`**: 同じ転送を、バッファを自動で用意して行う関数です。`CopyBuffer` は、その一時バッファを呼び出し側が決められる版です。
- **`nil` のバッファ**: `nil` を渡すと、転送の中でバッファを用意します。空でないスライスなら、そのまま使われます。
- **`len` と `nil`**: `buf != nil && len(buf) == 0` は、「バッファを渡したのに長さが 0」という誤りを表します。
- **`panic`**: 続けると危険な誤りを、即座に止めるための仕組みです。

## 何をしているか

### 1. 空のバッファを誤りとして止める

```go:line-numbers=399
	if buf != nil && len(buf) == 0 {
		panic("empty buffer in CopyBuffer")
	}
```

`buf` が `nil` ではないのに長さが 0 なら、転送を続けられません。`panic` で止めて、誤りを早く見つけられるようにしています。

### 2. 本体の転送に任せる

```go:line-numbers=402
	return copyBuffer(dst, src, buf)
```

条件を満たしたら、実際の転送は `copyBuffer` に任せます。`copyBuffer` は、`buf` が `nil` かどうかで、一時バッファを用意するかを決めます。

## ここがすごい

- **確保を呼び出し側で制御できる**: 大量の転送を続けるときは、同じバッファを使い回せるので、メモリの確保が減ります。
- **誤りを早く見つける**: 長さ 0 のバッファは、そのままでは書き写せません。すぐに止めるので、原因が分かりやすくなります。
- **`nil` と空を区別する**: 「バッファを指定しない」と「空のバッファを指定した」を区別して、意図しない動きを防ぎます。

## まとめ

- 一時バッファを呼び出し側が渡せるので、確保を減らせる。
- 空のバッファは `panic` で止め、誤りを早く見つける。
- 本体の転送は `copyBuffer` が担当する。
