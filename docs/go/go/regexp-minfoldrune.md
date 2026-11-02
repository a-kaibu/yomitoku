---
title: "大文字小文字を同一視するとき、代表の文字を決める minFoldRune"
description: "大文字小文字を区別しない正規表現で、同じ文字の仲間の中から最も小さいコードポイントを代表にする関数。SimpleFold の輪をたどって最小値を探す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [380, 390]
function: "minFoldRune"
difficulty: 3
tags: [Unicode, 正規表現, アルゴリズム]
---

## ひとことで

`minFoldRune(r)` は、文字 `r` と、大文字小文字を同一視したときに仲間になる文字の中から、**最も小さいコードポイント** を返します。例えば `'k'`、`'K'`、そして Unicode のケルビン記号 `'K'`（U+212A）は、仲間です。その中で最小なのは `'K'`（U+004B）です。

正規表現のエンジンは、この代表の値を使って、同じ仲間の文字を 1 つに統一して扱います。

## コード

```go:line-numbers=380
func minFoldRune(r rune) rune {
	if r < minFold || r > maxFold {
		return r
	}
	m := r
	r0 := r
	for r = unicode.SimpleFold(r); r != r0; r = unicode.SimpleFold(r) {
		m = min(m, r)
	}
	return m
}
```

## 前提知識

- **コードポイント**: Unicode の 1 文字に付けられた番号です。`'A'` は 65、`'あ'` は 12354 です。
- **大文字小文字の対応（case folding）**: 大文字と小文字を、同じ文字として扱うための対応です。Unicode では 2 文字以上が同じ仲間になることもあります。
- **`unicode.SimpleFold`**: ある文字の「次の仲間」を返す関数です。仲間の輪を 1 つずつたどれます。
- **`min` 組み込み関数**: 引数の中で最も小さい値を返す Go の関数です。

## 何をしているか

### 1. 対象外の文字は、そのまま返す

```go:line-numbers=381
	if r < minFold || r > maxFold {
		return r
	}
```

仲間を持つ可能性がある範囲（`minFold` から `maxFold`）の外の文字は、大文字小文字の対応がありません。その場合は、そのまま `r` を返します。

### 2. 仲間の輪をたどって最小値を探す

```go:line-numbers=384
	m := r
	r0 := r
	for r = unicode.SimpleFold(r); r != r0; r = unicode.SimpleFold(r) {
		m = min(m, r)
	}
	return m
```

`m` に最小値を覚えておきます。`r0` は出発点です。`SimpleFold` で次の仲間へ進み、出発点に戻るまで、`min` で最小値を更新し続けます。

`SimpleFold` は仲間を輪のように返すので、必ず出発点に戻ってきます。その輪を一周すれば、全部の仲間を見たことになります。

## ここがすごい

- **輪を一周するだけで全部分かる**: 仲間の一覧を表にしておく代わりに、`SimpleFold` の輪をたどるだけで全員を見られます。表のデータを持たずに済みます。
- **ケルビン記号のような例外を自然に扱う**: `'k'` と `'K'` のような一般的な対応だけでなく、特殊な記号も同じ輪に入っています。関数は輪の中身を知らなくても正しく動きます。
- **範囲で素早く除外**: 最初の範囲判定で、仲間を持たない大多数の文字を早く返しています。

## まとめ

- `minFoldRune` は、大文字小文字の仲間の中で最小の文字を代表にします。
- 仲間の一覧は、`unicode.SimpleFold` の輪をたどって調べます。
- 仲間を持たない範囲の文字は、そのまま返します。
- 代表を決めておけば、正規表現のエンジンは、同じ仲間の文字を 1 つとして扱えます。
