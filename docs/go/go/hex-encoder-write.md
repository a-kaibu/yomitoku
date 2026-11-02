---
title: "16 進数の書き込みを小分けにして、入力を一定の大きさずつ変換する"
description: "encoding/hex の encoder.Write。大きな入力を、バッファの半分の大きさずつ切り出して 16 進数にし、下の writer へ書く。途中で書き込みに失敗したら、その時点で止めて、書いた元のバイト数を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/hex/hex.go"
lines: [177, 191]
function: "Write"
difficulty: 2
tags: [入出力, メモリ管理, 防御的プログラミング]
---

## ひとことで

`hex.NewEncoder(w)` で作るエンコーダーは、書かれたバイト列を 16 進数の文字に変えて、下の `io.Writer` へ書きます。大きなデータが来ても、一度に全部を文字列にしないように、バッファの大きさで区切って少しずつ変換します。

## コード

```go:line-numbers=177
func (e *encoder) Write(p []byte) (n int, err error) {
	for len(p) > 0 && e.err == nil {
		chunkSize := bufferSize / 2
		if len(p) < chunkSize {
			chunkSize = len(p)
		}

		var written int
		encoded := Encode(e.out[:], p[:chunkSize])
		written, e.err = e.w.Write(e.out[:encoded])
		n += written / 2
		p = p[chunkSize:]
	}
	return n, e.err
}
```

## 前提知識

- **16 進数の表示**: 1 バイトを 2 桁の 16 進数（`0`〜`9`、`a`〜`f`）で表します。例えば `0x3f` は `3f` です。
- **バッファの大きさ**: `e.out` は、変換結果を入れておく固定の配列です。1 バイトは 2 文字になるので、入力の半分の大きさずつ切ります。
- **`e.err`**: 一度起きた書き込みのエラーを覚えておく変数です。エラーがあれば、以後は書きません。
- **戻り値の `n`**: 書いた元のバイト数です。16 進数の文字数の半分になります。

## 何をしているか

### 1. 1 回に変換する大きさを決める

```go:line-numbers=179
		chunkSize := bufferSize / 2
		if len(p) < chunkSize {
			chunkSize = len(p)
		}
```

1 回に変換するバイト数は、バッファの半分です。出力は 2 倍の長さになるので、バッファに収まります。残りの入力が少なければ、その長さに合わせます。

### 2. 変換して書き、書いた量を数える

```go:line-numbers=185
		encoded := Encode(e.out[:], p[:chunkSize])
		written, e.err = e.w.Write(e.out[:encoded])
		n += written / 2
		p = p[chunkSize:]
```

`Encode` で、切り出した部分を 16 進数にして、バッファに入れます。それを下の writer へ書きます。書けた文字数は 2 で割って、元のバイト数に直し、`n` に足します。残りの入力を `p` に入れ直します。

### 3. エラーが起きたら止まる

`for` の条件に `e.err == nil` があるので、書き込みに失敗すると、ループは次の回に進みません。最後に、書いた元のバイト数 `n` と、エラーを返します。

## ここがすごい

- **メモリを一定に保つ**: 入力全体を 16 進数の文字列にせず、バッファの大きさずつ処理します。大きなデータでも、使うメモリは変わりません。
- **書けた分を正しく数える**: 書けた文字数を 2 で割って、元のバイト数で返します。途中で失敗しても、どこまで書けたかが正しく分かります。
- **エラーを持ち続ける**: `e.err` に覚えておくことで、一度失敗したら、以後の書き込みを止められます。

## まとめ

- `Write` は、大きな入力をバッファの半分ずつ切って、16 進数に変換します。
- 変換結果は下の writer へ書き、書けた分を元のバイト数に直して数えます。
- エラーが起きたら、そこで止めて、書いた量とエラーを返します。
- 入力全体を一度に変換しないので、メモリが一定で済みます。
