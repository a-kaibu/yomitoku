---
title: "負の数の「-」の後を見張る encoding/json の stateNeg"
description: "JSON の数値の先頭にある「-」の後に来てよい文字だけを通す、状態機械の 1 つ。0 か 1〜9 以外は、その場で文法エラーにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [408, 418]
function: "stateNeg"
difficulty: 2
tags: [パース, 状態機械]
---

## ひとことで

`stateNeg` は、JSON の数値が `-` で始まったとき、その次に来る 1 文字を調べる状態の関数です。`-0` や `-12` は通しますが、`-a` や `-` だけで終わるものは、ここでエラーにします。

JSON の数値は `-` の後に必ず数字が続かなければならないので、この状態はそのルールを 1 か所に表しています。

## コード

```go:line-numbers=408
func stateNeg(s *scanner, c byte) int {
	if c == '0' {
		s.step = state0
		return scanContinue
	}
	if '1' <= c && c <= '9' {
		s.step = state1
		return scanContinue
	}
	return s.error(c, "in numeric literal")
}
```

## 前提知識

- **状態の関数**: 状態ごとに 1 つの関数を用意し、1 バイトを受け取って、次の状態と「続ける／エラー」を返します。`scanner` の `step` に入れて切り替えます。
- **`scanContinue`**: 「まだ読み続けてよい」という値です。
- **文字リテラル `'0'`**: 1 バイトの文字を表す書き方です。`c == '0'` は、そのバイトが `0` の文字かを比べます。
- **JSON の数値の規則**: 負の数は `-` の後に、`0` か、`1` から `9` の数字のどれかが続きます。`-01` のように 0 で始まる整数は、JSON では許されません。
- **`s.error`**: 文法エラーを作る関数です。どの文字で、どんな状況で失敗したかを、メッセージに入れます。

## 何をしているか

### 1. 「-」の次が 0 のとき

```go:line-numbers=409
	if c == '0' {
		s.step = state0
		return scanContinue
	}
```

次の文字が `0` なら、整数部分が 0 になった状態 `state0` へ進みます。`-0` の後には、小数点や `e` などが続けられるからです。`-01` の 2 つ目の `1` は、この状態で許されず、後で弾かれます。

### 1 と 9 の間の数字のとき

```go:line-numbers=413
	if '1' <= c && c <= '9' {
		s.step = state1
		return scanContinue
	}
```

`1` から `9` の数字なら、整数の桁が続く状態 `state1` へ進みます。ここでは、`-12` の `2` のような桁を、次の状態で受け付けます。

### それ以外はエラー

```go:line-numbers=417
	return s.error(c, "in numeric literal")
```

0 でも 1〜9 でもなければ、数値として成り立ちません。`s.error` が、「数値のリテラルの中で、この文字は不正」というエラーを作って返します。

## ここがすごい

- **ルールを状態に閉じ込める**: 「`-` の後の文字は 0 か 1〜9」というルールが、この関数の中だけにあります。他の場所で同じことを確かめる必要がありません。
- **次の状態を先に決める**: `s.step` を書き換えてから `scanContinue` を返すので、次のバイトは自動的に正しい状態で処理されます。条件分岐の入れ子が増えません。
- **エラーの文脈を持つ**: `"in numeric literal"` のように、どこで失敗したかを言葉で伝えます。エラーを見た人が、直す場所を見つけやすくなります。

## まとめ

- `stateNeg` は、数値の `-` の直後だけを見張る状態です。
- 0 なら `state0`、1〜9 なら `state1` へ進み、それ以外はエラーにします。
- 次の状態を `s.step` に入れてから返すので、状態の移動が 1 行で表せます。
- 文法のルールが、状態ごとの小さな関数に分かれて書かれています。
