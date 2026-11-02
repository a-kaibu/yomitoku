---
title: "正規表現の 1 文字の一致を判定する matchRune。種類ごとに 4 通り"
description: "正規表現の式の種類（1 文字・文字クラス・改行以外の任意文字・任意文字）に応じて、1 つの文字が一致するかを判定する関数。switch で式の種類を分けている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [1310, 1327]
function: "matchRune"
difficulty: 2
tags: [正規表現, 文字列処理, 設計パターン]
---

## ひとことで

`matchRune(re, r)` は、正規表現の式 `re` が、1 文字 `r` にマッチするかを判定します。式の種類 `re.Op` によって、判定の仕方が変わります。例えば `a` なら同じ文字かを比べ、`[a-z]` なら範囲に入るかを調べ、`.` なら改行以外なら一致します。

## コード

```go:line-numbers=1310
func matchRune(re *Regexp, r rune) bool {
	switch re.Op {
	case OpLiteral:
		return len(re.Rune) == 1 && re.Rune[0] == r
	case OpCharClass:
		for i := 0; i < len(re.Rune); i += 2 {
			if re.Rune[i] <= r && r <= re.Rune[i+1] {
				return true
			}
		}
		return false
	case OpAnyCharNotNL:
		return r != '\n'
	case OpAnyChar:
		return true
	}
	return false
}
```

## 前提知識

- **正規表現の式の種類（演算子）**: パースされた式は、「1 文字」「文字クラス（`[...]`）」「`.`」などの種類を持ちます。`re.Op` でその種類が分かります。
- **文字クラスの表現**: `[a-z0-9]` は、範囲の組の並びとして `re.Rune` に入ります。`a-z` は `'a'` と `'z'` の組、`0-9` は `'0'` と `'9'` の組です。
- **`.`（任意文字）**: 改行以外のすべての文字に一致します。`(?s)` を付けると改行にも一致します。
- **`switch` の `case`**: `re.Op` の値ごとに、判定の節が分かれています。

## 何をしているか

### 1. 1 文字の式は、同じ文字かを比べる

```go:line-numbers=1312
	case OpLiteral:
		return len(re.Rune) == 1 && re.Rune[0] == r
```

`OpLiteral` は、`a` のような 1 文字の一致を表します。`re.Rune` の長さが 1 で、その 1 文字が `r` と同じなら一致です。

### 2. 文字クラスは範囲のどれかに入るか

```go:line-numbers=1314
	case OpCharClass:
		for i := 0; i < len(re.Rune); i += 2 {
			if re.Rune[i] <= r && r <= re.Rune[i+1] {
				return true
			}
		}
		return false
```

文字クラスは、範囲の組（下限と上限）が並んだものです。2 つずつ組にして、`r` がどれかの範囲に入っていれば `true` にします。範囲が 1 つも当てはまらなければ `false` です。

### 3. ドットと、任意の文字

```go:line-numbers=1321
	case OpAnyCharNotNL:
		return r != '\n'
	case OpAnyChar:
		return true
```

`OpAnyCharNotNL` は `.` で、改行以外は一致します。`OpAnyChar` は `(?s).` のように、改行も含めて一致します。

## ここがすごい

- **種類ごとに判定を書き分ける**: 1 文字、文字クラス、ドットを、それぞれ一番簡単な方法で判定しています。種類を増やしても、`case` を足すだけで済みます。
- **範囲の比べ方が速い**: 文字クラスを、1 文字ずつ並べた表ではなく、範囲の組で持っています。`[\x{4e00}-\x{9fff}]` のような大きな範囲も、1 組の比較で済みます。
- **既定の値は false**: どの `case` にも当てはまらなければ、最後の `return false` で一致しないことにしています。

## まとめ

- `matchRune` は、式の種類ごとに、1 文字が一致するかを判定します。
- 1 文字は同じかを比べ、文字クラスは範囲のどれかに入るかを調べます。
- ドットは改行以外に一致し、`(?s)` 付きのものは改行にも一致します。
- 範囲の組で持つことで、大きな文字クラスも少ない比較で判定できます。
