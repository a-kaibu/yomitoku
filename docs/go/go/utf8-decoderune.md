---
title: "1 回で抜ける for ループ。インライン化のための奇妙な書き方"
description: "UTF-8 のバイト列から先頭の 1 文字を取り出す utf8.DecodeRune。ASCII だけを先に処理する部分を、わざと変わった for ループで書いて、コンパイラにインライン展開させています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/unicode/utf8/utf8.go"
lines: [157, 169]
function: "DecodeRune"
difficulty: 3
format: 2
tags: [Unicode, 最適化, 文字列処理, 標準ライブラリ, ハック]
---

## ひとことで

`utf8.DecodeRune(p)` は、UTF-8 でエンコードされたバイト列 `p` の **先頭の 1 文字（ルーン）と、そのバイト数** を返します。
`[]byte("あい")` なら `('あ', 3)`、`[]byte("Go")` なら `('G', 1)` です。

この関数の前半は、コメント自身が「奇妙だが効果的」と言っている書き方をしています。**1 回目で必ず抜ける `for` ループ** です。これは、関数をコンパイラにインライン展開してもらうための工夫です。

## コード

::: code-group

```go:line-numbers=157 [日本語訳]
func DecodeRune(p []byte) (r rune, size int) {
	// ASCII 文字用のインライン化できる高速パス。#48195 を参照。
	// この実装は変わっているが、関数をインライン化可能に
	// するには効果的である。
	for _, b := range p {
		if b < RuneSelf {
			return rune(b), 1
		}
		break
	}
	r, size = decodeRuneSlow(p)
	return
}
```

```go:line-numbers=157 [原文]
func DecodeRune(p []byte) (r rune, size int) {
	// Inlineable fast path for ASCII characters; see #48195.
	// This implementation is weird but effective at rendering the
	// function inlineable.
	for _, b := range p {
		if b < RuneSelf {
			return rune(b), 1
		}
		break
	}
	r, size = decodeRuneSlow(p)
	return
}
```

:::

## 前提知識

- **UTF-8**: 文字を 1〜4 バイトで表す方式です。ASCII（英数字など）は 1 バイトで、値は 128 未満です。日本語は多くが 3 バイトです。
- **ルーン（rune）**: Go で 1 文字（Unicode のコードポイント）を表す型です。中身は 32 ビット整数です。
- **`utf8.RuneSelf`**: 128 のことです。これ未満のバイトは、それだけで 1 文字の ASCII です。
- **`for _, b := range p`**: スライス `p` の要素を先頭から 1 つずつ `b` に入れて繰り返します。`_` は使わない値（位置）を捨てる記号です。
- **インライン展開**: 関数呼び出しを、呼び出し先の中身で置き換えるコンパイラの最適化です。呼び出しのコストがなくなり、さらに周りのコードと一緒に最適化できます。Go のコンパイラは「小さい関数」だけをインライン展開します。

## 何をしているか

### 1. 先頭が ASCII ならすぐ返す

```go:line-numbers=161
	for _, b := range p {
		if b < RuneSelf {
			return rune(b), 1
		}
		break
	}
```

`range p` で先頭のバイト `b` を取り出し、128 未満ならそれが 1 文字なので `(rune(b), 1)` を返します。
ASCII でなければ `break` でループを抜けます。`p` が空ならループは 1 回も回りません。

つまりこのループは **「先頭のバイトがあれば見る」** という意味で、繰り返しはしません。

### 2. それ以外は遅い道へ

```go:line-numbers=167
	r, size = decodeRuneSlow(p)
	return
```

ASCII 以外の文字（日本語など）や空のスライス、不正なバイト列は、別の関数 `decodeRuneSlow` に任せます。

### なぜこんな書き方をするのか

素直に書くとこうなります。

```go
if len(p) > 0 && p[0] < RuneSelf {
	return rune(p[0]), 1
}
```

意味は同じですが、`p[0]` にはコンパイラが「範囲外ではないか」を確かめる処理（境界チェック）を入れます。範囲外なら `panic` する処理も含まれるので、関数の「コスト」が上がり、インライン展開の基準を超えてしまうことがありました（コメントの issue 48195）。

`range` で取り出した要素は、言語の仕組み上、必ず範囲内です。だから境界チェックも `panic` の処理も入らず、関数が小さくなってインライン展開されるのです。

## ここがすごい

- **ASCII の処理が呼び出し元に溶け込む**: インライン展開されると、`DecodeRune` を呼んでいる側のループの中に「128 未満ならそのまま」という数命令が直接埋め込まれます。英語のテキストのように ASCII がほとんどのデータでは、ほぼすべての文字がこの速い道を通ります。
- **速い道と遅い道を分ける**: 小さくてよく通る部分だけを残し、大きくてたまにしか通らない部分（`decodeRuneSlow`）を別の関数に追い出しています。これはインライン展開を効かせるための定番の分け方です。
- **奇妙さをコメントで説明**:「なぜ変な書き方なのか」を issue 番号つきで残しているので、後から誰かが「素直な書き方」に直して遅くしてしまう事故を防げます。

## まとめ

- Go のコンパイラは小さい関数だけをインライン展開するので、よく通る部分を小さく保つと速くなる。
- `range` で取り出した要素は境界チェックが不要で、コードが小さくなる。
- 速い道（ファストパス）と遅い道を別の関数に分けるのは、インライン化の定番テクニック。
- 意図的に変わった書き方をするときは、理由をコメントに残す。
