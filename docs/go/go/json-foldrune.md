---
title: "大文字小文字の仲間の中で最小の文字を選ぶ encoding/json の foldRune"
description: "JSON のキーの照合で、大文字小文字を区別せずに比べるための代表文字を決める foldRune。unicode.SimpleFold の輪をたどり、値が小さくなるまで進めて返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/fold.go"
lines: [42, 50]
function: "foldRune"
difficulty: 3
tags: [Unicode, 文字列処理, 標準ライブラリ]
---

## ひとことで

`foldRune(r)` は、文字 `r` の大文字小文字の仲間を順にたどり、その中で最初に現れる **最小の文字** を返します。例えば `'k'` を渡すと、`'K'` と、Unicode の特殊な記号 `'K'`（U+212A）の仲間の中から、最も小さい `'K'` が返ります。

`encoding/json` は、JSON を構造体の項目に入れるとき、キーの大文字小文字を区別せずに照合します。その比べ方の基になる値が、この関数で作られます。

## コード

```go:line-numbers=42
func foldRune(r rune) rune {
	for {
		r2 := unicode.SimpleFold(r)
		if r2 <= r {
			return r2
		}
		r = r2
	}
}
```

## 前提知識

- **大文字小文字の対応（case folding）**: 大文字と小文字を、同じ文字として扱うための対応です。Unicode では、2 文字以上が同じ仲間になることもあります。
- **`unicode.SimpleFold`**: 文字の「次の仲間」を返す関数です。仲間は輪のようにつながっていて、何回か呼ぶと元の文字に戻ります。
- **`for` の無限ループ**: `for { ... }` は条件のないループで、`return` で抜けます。
- **rune**: 1 文字の Unicode の値です。`<=` で大小を比べられます。

## 何をしているか

### 1. 次の仲間を調べる

```go:line-numbers=44
		r2 := unicode.SimpleFold(r)
```

`SimpleFold` で、今の文字 `r` の次の仲間 `r2` を求めます。仲間の輪は、必ず元の文字に戻ってくるので、この操作を続ければ全員を順に見られます。

### 2. 小さくなったら、そこで返す

```go:line-numbers=45
		if r2 <= r {
			return r2
		}
		r = r2
```

`r2` が `r` 以下なら、ここまでの中で一番小さい文字を見つけたということです。その値を返します。大きいままなら、次の仲間へ進みます。

ここで `r2 <= r` としているのは、輪をたどるうちに、値が下がる点を探すためです。`'k'` の輪は `'k'` → `'K'` → ... の順で回るので、`'K'` にたどり着いたところで止まります。

## ここがすごい

- **輪の性質を利用する**: 仲間は輪になっているので、「値が下がったら止める」だけで、最小値に行き着きます。全員の表を持つ必要がありません。
- **代表を決めるから比べやすい**: すべての仲間を同じ代表に変換すると、「大文字小文字を無視して等しいか」を、1 回の `==` で判定できます。
- **Unicode の特殊な例に自動で対応**: ケルビン記号のような例外も、輪の中に入っていれば同じ仕組みで扱えます。

## まとめ

- `foldRune` は、大文字小文字の仲間の中で最小の文字を代表として返します。
- `SimpleFold` を繰り返し呼び、値が下がったところで止めます。
- 代表を揃えておけば、大文字小文字を無視した比較が簡単になります。
- JSON のキーの照合は、この考え方で行われます。
