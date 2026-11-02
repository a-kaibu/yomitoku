---
title: "io.Pipe の書き込み。channel で読み手に渡し、読んだ分だけ進める"
description: "io.Pipe の write。バイト列を channel で読み手に渡し、読み手が返す読んだ長さを受け取って、残りを次に送る。途中でパイプが閉じられたら、すぐにエラーで戻る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/io/pipe.go"
lines: [76, 96]
function: "write"
difficulty: 3
tags: [並行処理, 入出力, 非同期]
---

## ひとことで

`io.Pipe()` は、書き込み側と読み取り側を、メモリの中でつなぐパイプです。書き込み側が `Write` を呼ぶと、データは読み取り側が `Read` するまで止まって待ちます。`(*pipe).write` は、その待ち合わせを channel で行う中心の関数です。

ファイルやネットワークを使わずに、「書く goroutine」と「読む goroutine」を直接つなげられます。

## コード

```go:line-numbers=76
func (p *pipe) write(b []byte) (n int, err error) {
	select {
	case <-p.done:
		return 0, p.writeCloseError()
	default:
		p.wrMu.Lock()
		defer p.wrMu.Unlock()
	}

	for once := true; once || len(b) > 0; once = false {
		select {
		case p.wrCh <- b:
			nw := <-p.rdCh
			b = b[nw:]
			n += nw
		case <-p.done:
			return n, p.writeCloseError()
		}
	}
	return n, nil
}
```

## 前提知識

- **channel**: goroutine の間で値をやり取りする通り道です。送信は、受け取る側が来るまで待ちます。
- **`select`**: 複数の channel 操作のうち、準備ができたものを 1 つ選んで実行する文です。`default` を付けると、どれも準備できていなければ、待たずに `default` を実行します。
- **`defer`**: 関数の終わりに実行する命令を予約する書き方です。`defer p.wrMu.Unlock()` は、関数を抜けるときに必ずロックを解除します。
- **`done` channel**: パイプが閉じられたことを知らせる channel です。閉じられると、受信がすぐに成功します。

## 何をしているか

### 1. 閉じていなければ書き込みロックを取る

```go:line-numbers=77
	select {
	case <-p.done:
		return 0, p.writeCloseError()
	default:
		p.wrMu.Lock()
		defer p.wrMu.Unlock()
	}
```

まず、パイプがすでに閉じていないかを確かめます。閉じていれば、エラーを返します。閉じていなければ、`default` に進んで書き込みのロック `wrMu` を取ります。`defer` で、関数の終わりに必ず解除します。書き込み者が 2 人同時に書いても、データが混ざらないようにするためです。

### 2. 読み手に渡して、読んだ分だけ進める

```go:line-numbers=85
	for once := true; once || len(b) > 0; once = false {
		select {
		case p.wrCh <- b:
			nw := <-p.rdCh
			b = b[nw:]
			n += nw
		case <-p.done:
			return n, p.writeCloseError()
		}
	}
```

`p.wrCh <- b` で、残りのバイト列を読み手へ送ります。読み手が `Read` を呼ぶと、この送信が成立します。その後、読み手が実際に読んだ長さ `nw` を `rdCh` から受け取ります。読めた分だけ `b` を後ろへずらし、`n` に足します。

読み手が一部だけ読むこともあるので、このように何回かに分けて送ります。`once` は、空の書き込みでも 1 回は送るための工夫です。

### 3. 途中で閉じられたら止める

```go:line-numbers=91
	case <-p.done:
		return n, p.writeCloseError()
```

送信を待っている間にパイプが閉じられたら、`done` が閉じて、この分岐が選ばれます。その時点までに書けたバイト数 `n` と、エラーを返します。

## ここがすごい

- **同期を channel で表す**: ロックと条件変数を使わずに、送受信の組で読み書きの順番を揃えています。読み手が読むまで、書き手は先へ進めません。
- **部分的な書き込みを正しく数える**: 読まれた長さだけ進め、残りを次へ送ります。途中で止まっても、いくつ書けたかが正しく返ります。
- **閉じたときの逃げ道**: `done` を `select` に入れているので、読み手が来なくても、閉じられれば必ず抜けられます。

## まとめ

- `io.Pipe` の書き込みは、channel を使って読み手とバイト列をやり取りします。
- 読み手が読んだ長さだけ、書き込み側の残りを進めます。
- 書き込みのロックで、複数の書き手の混ざりを防ぎます。
- パイプが閉じられたら、すぐにエラーで戻ります。
