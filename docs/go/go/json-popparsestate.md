---
title: "JSON の入れ子の深さを一つ戻す popParseState。最後の一段なら文書の終わりへ進む"
description: "encoding/json のスキャナの popParseState。配列やオブジェクトの入れ子から一段抜けるとき、解析の状態のスタックを一つ減らす。最後の一段だったときは、文書の終わりの状態へ移す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [190, 199]
function: "popParseState"
difficulty: 2
tags: [パース, 状態機械, データ構造]
---

## ひとことで

`s.popParseState()` は、JSON の入れ子の 1 段から抜けるときに呼ばれます。例えば `[[1]]` の内側の `]` を読んだときは、外側の配列の中に戻ります。最後の `]` なら、文書全体が終わります。

解析の途中で、今どの入れ子の中にいるかは、スタックで覚えています。この関数は、そのスタックの一番上を取り除き、次の状態を決めます。

## コード

```go:line-numbers=190
func (s *scanner) popParseState() {
	n := len(s.parseState) - 1
	s.parseState = s.parseState[0:n]
	if n == 0 {
		s.step = stateEndTop
		s.endTop = true
	} else {
		s.step = stateEndValue
	}
}
```

## 前提知識

- **スタック**: 後から入れたものを先に取り出す、後入れ先出しの入れ物です。入れ子の構造を覚えるのに向いています。
- **`parseState`**: 開いたままの配列やオブジェクトを、順番に覚えておくスタックです。`[` や `{` を読むと積まれ、対応する閉じ括弧で取り除かれます。
- **`endTop`**: 文書の終わりに達したことを表す真偽値です。一番外側の値が閉じられたときに真になります。
- **`stateEndTop`**: 文書の終わりを処理する状態です。空白だけが許されます。

## 何をしているか

### 1. スタックの一番上を取り除く

```go:line-numbers=191
	n := len(s.parseState) - 1
	s.parseState = s.parseState[0:n]
```

スタックの長さから 1 を引いた `n` が、新しい長さになります。`[0:n]` で、一番上の要素を取り除いたスライスを作ります。

### 2. 最後の段なら文書の終わりへ

```go:line-numbers=193
	if n == 0 {
		s.step = stateEndTop
		s.endTop = true
	} else {
```

取り除いた後の長さが 0 なら、一番外側の値を閉じたことになります。状態を `stateEndTop` に変え、`endTop` を真にします。

### 3. 内側なら値の終わりを続ける

```go:line-numbers=197
		s.step = stateEndValue
	}
```

まだ外側の入れ子が残っているなら、今閉じた値の後の処理へ進みます。`stateEndValue` で、外側の配列やオブジェクトの続きを読みます。

## ここがすごい

- **深さの管理が一か所に集まる**: 入れ子を抜ける処理は、この関数だけです。どこで抜けても、同じ規則で状態が決まります。
- **文書の終わりを状態で表す**: `endTop` という別の印と、`stateEndTop` という状態が、文書の終わりを正しく知らせます。
- **スライスで高速に取り除く**: 配列の一番上を取るのに、先頭への新しい配列は作らず、長さだけを変えています。

## まとめ

- `popParseState` は、入れ子のスタックの一番上を取り除きます。
- 残りが 0 なら文書の終わり、そうでなければ外側の値の続きへ進みます。
- 入れ子の抜け方を、一つの関数で統一して扱います。
