---
title: "木から最も小さい節点を外す go/token の deleteMin。ポインタのポインタで繋ぎ直す"
description: "go/token の二分探索木で、最も小さい節点を取り除く deleteMin。左へ進んで、左の子がなくなる節点を探し、その節点の右の子を、その位置へ繋ぎ直す。ポインタのポインタで親の参照を直接書き換える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/tree.go"
lines: [400, 410]
function: "deleteMin"
difficulty: 3
tags: [データ構造, アルゴリズム, 型システム]
---

## ひとことで

`deleteMin(zpos)` は、木の中で最も小さい節点を取り除きます。小さい値は、いつも左の子をたどった先にあります。取り除いたあとは、その節点の右の子を、取り除いた場所へつなぎます。

引数の `zpos` は、探し始める位置を指すポインタのポインタです。これで、親の参照を直接書き換えられます。

## コード

```go:line-numbers=400
func (t *tree) deleteMin(zpos **node) (z *node) {
	for (*zpos).left != nil {
		zpos = &(*zpos).left
	}
	z = *zpos
	*zpos = z.right
	if *zpos != nil {
		(*zpos).parent = z.parent
	}
	return z
}
```

## 前提知識

- **最も小さい節点**: 左の子を持たない節点です。左をたどれるだけたどると、そこに着きます。
- **ポインタのポインタ（`**node`）**: 親の `left` や、木の根を指す場所への参照です。そこに値を書けば、木の形が変わります。
- **親への参照の更新**: 節点を取り除くと、その右の子の親も変わります。`parent` を正しく直す必要があります。
- **戻り値 `z`**: 取り除いた節点です。呼び出し側は、その節点の値を使えます。

## 何をしているか

### 1. 左をたどって、最も小さい節点を探す

```go:line-numbers=401
	for (*zpos).left != nil {
		zpos = &(*zpos).left
	}
```

今の位置の節点に左の子があるあいだ、`zpos` を左の子の場所へ動かします。左の子がなくなったところで、そこが最小の節点を指す場所になります。

### 2. その節点を取り出し、右の子を繋ぐ

```go:line-numbers=404
	z = *zpos
	*zpos = z.right
	if *zpos != nil {
		(*zpos).parent = z.parent
	}
	return z
```

`z` に最小の節点を入れます。その場所には、`z` の右の子を入れて、`z` を木から外します。右の子が存在すれば、その親を `z` の親に付け替えます。最後に、取り除いた `z` を返します。

## ここがすごい

- **場所を指すだけで書き換える**: `zpos` が指す場所に直接書くので、親の場合分けが要りません。根でも子でも、同じ 1 行で繋ぎ直せます。
- **右の子を失わない**: 最小の節点は左の子を持たないので、その右の部分木を、そのまま上へ持ち上げて繋ぐだけで、木の順序が保たれます。
- **親の情報も直す**: `parent` の更新を忘れないことで、後で `next` のように親をたどる処理が正しく働きます。

## まとめ

- `deleteMin` は、木で最も小さい節点を取り除きます。
- 左の子がなくなる節点まで、ポインタのポインタで進みます。
- その節点の右の子を、取り除いた場所へ繋ぎます。
- 親の参照も直して、木の整合性を保ちます。
