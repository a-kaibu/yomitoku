---
title: "16 ビットの値を上の桁から 2 バイトで足す bigEndian.AppendUint16"
description: "encoding/binary の bigEndian.AppendUint16。uint16 の値を、上の桁のバイトから順に 2 バイト、b の末尾に足す。ネットワークで使われるビッグエンディアンの書き込みに使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/binary/binary.go"
lines: [168, 173]
function: "AppendUint16"
difficulty: 1
tags: [入出力, ビット演算]
---

## ひとことで

`bigEndian.AppendUint16(b, v)` は、16 ビットの値 `v` を 2 バイトに分けて、`b` の末尾に足します。上の桁のバイトが先に来ます。

## コード

```go:line-numbers=168
func (bigEndian) AppendUint16(b []byte, v uint16) []byte {
	return append(b,
		byte(v>>8),
		byte(v),
	)
}
```

## 前提知識

- **ビッグエンディアン**: 数の上の桁のバイトを、先頭に置く書き方です。ネットワークのプロトコルで、よく使われます。
- **uint16**: 16 ビットの符号なし整数です。ちょうど 2 バイトの大きさです。
- **byte への切り詰め**: `byte(v>>8)` のように、ずらした値を 8 ビットに切り詰めて、バイトにします。

## 何をしているか

### 1. 上の桁、下の桁の順に足す

```go:line-numbers=169
	return append(b,
		byte(v>>8),
		byte(v),
	)
```

最初に `v` の上の 8 ビットを、次に下の 8 ビットを足します。`byte(v>>8)` は、`v` を 8 ビット右にずらしてから切り詰めるので、上の桁のバイトになります。

## ここがすごい

- **読む側の順と同じ**: 上の桁から書くので、ビッグエンディアンを読む側は、先頭から順に値を組み立てられます。
- **二行で完結**: 2 バイトの書き込みは、切り詰めの式を二つ並べるだけで書けます。

たとえば `v` が `0x0102` なら、先に `0x01`、次に `0x02` が足されます。並んだバイトを先頭から読むと、元の値 `0x0102` に戻ります。この順は、ネットワークの上で値を送るときの約束になっています。

## まとめ

- `AppendUint16` は、16 ビットの値を 2 バイトで足します。
- 上の桁のバイトが先頭に来ます。
- 各バイトは、ずらして `byte` に切り詰めて作ります。
