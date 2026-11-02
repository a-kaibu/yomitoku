---
title: "io.Pipe の読み取り。書き手が送ってきたバイト列を、読めるだけコピーする"
description: "io.Pipe の read。書き手が channel で送ったバイト列を受け取り、読み手の buffer に入るだけコピーして、コピーした長さを書き手へ返す。パイプが閉じられていれば、すぐに終わる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/io/pipe.go"
lines: [50, 65]
function: "read"
difficulty: 3
tags: [並行処理, 入出力, 非同期]
---

## ひとことで

`io.Pipe` の読み取り側は、書き込み側が channel で送ってきたバイト列を、自分のバッファへコピーします。読み取りの後で、コピーした長さを書き手へ返します。その長さを受け取った書き手が、残りを続けて送ります。

読み手の `Read` は、書き手が送ってくるまで待ちます。待ちの途中でパイプが閉じられたら、エラーで戻ります。

## コード

```go:line-numbers=50
func (p *pipe) read(b []byte) (n int, err error) {
	select {
	case <-p.done:
		return 0, p.readCloseError()
	default:
	}

	select {
	case bw := <-p.wrCh:
		nr := copy(b, bw)
		p.rdCh <- nr
		return nr, nil
	case <-p.done:
		return 0, p.readCloseError()
	}
}
```

## 前提知識

- **`copy`**: 小さい方の長さだけ、スライスの要素をコピーする組み込み関数です。コピーした数を返します。
- **`select` と `default`**: `default` があると、他の操作の準備ができていなくても、待たずに先へ進みます。
- **読み取りの約束**: `Read` は、読んだ数とエラーを返します。読んだ数が `b` より少なくても、エラーではありません。
- **`rdCh`**: 読み手が「何バイト読んだか」を書き手へ知らせる channel です。

## 何をしているか

### 1. 閉じていたら、すぐエラー

```go:line-numbers=51
	select {
	case <-p.done:
		return 0, p.readCloseError()
	default:
	}
```

読み始める前に、パイプが閉じられていないかを確かめます。閉じられていれば、すぐに読み終わりのエラーを返します。閉じられていなければ、`default` で何もせずに先へ進みます。

### 2. 書き手のバイト列を受け取る

```go:line-numbers=58
	case bw := <-p.wrCh:
		nr := copy(b, bw)
		p.rdCh <- nr
		return nr, nil
```

書き手が送ったバイト列 `bw` を受け取ります。`copy(b, bw)` で、読み手のバッファに入るだけコピーします。コピーした数を `rdCh` で書き手へ返し、その数を読み取りの結果にします。

書き手は、この数を受け取って、送ったうち読まれなかった部分を次に送ります。

### 3. 閉じられたら待ちをやめる

```go:line-numbers=62
	case <-p.done:
		return 0, p.readCloseError()
```

書き手が送ってくる前にパイプが閉じられると、この分岐が選ばれます。読めた数は 0 で、読み取りのエラーを返します。

## ここがすごい

- **部分的な読み取りを正しく伝える**: コピーの数を書き手に返すので、書き手は、読まれなかった残りを正確に知ることができます。
- **閉じられていれば、待たずに戻る**: 最初の `select` で閉じた状態を早く見つけます。待ちに入る前に、終わりを検出できます。
- **書き手と読み手の対応**: 送受信の組で、バイト列が 1 つずつ確実に渡されます。

## まとめ

- `read` は、書き手が送ったバイト列を、自分のバッファへ入るだけコピーします。
- コピーした数を、書き手へ `rdCh` で返します。
- パイプが閉じられていれば、読み取りのエラーで戻ります。
- 読み取りの待ちは、送信とパイプの終わりの両方を見て行います。
