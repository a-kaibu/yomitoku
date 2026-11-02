---
title: "木の中で鍵の位置を探す go/token の tree.locate。ポインタのポインタを返す"
description: "go/token の内部の二分探索木で、鍵に対応する位置を探す locate。結果として、そこを指すポインタのポインタと、その親を返すので、挿入や削除をその場で書き換えられる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/tree.go"
lines: [112, 125]
function: "locate"
difficulty: 3
tags: [データ構造, アルゴリズム, 型システム]
---

## ひとことで

`go/token` パッケージは、ソースファイルの行の位置などを管理するために、内部で二分探索木を使っています。`t.locate(k)` は、鍵 `k` を探して、その鍵がある場所（または入るべき場所）を返します。戻り値は、子を指すポインタのポインタ `pos` と、その親 `parent` です。

ポインタのポインタを返すので、呼び出し側は、見つけた場所に新しいノードを差し込んだり、そこから削除したりできます。

## コード

```go:line-numbers=112
func (t *tree) locate(k key) (pos **node, parent *node) {
	pos, x := &t.root, t.root
	for x != nil {
		sign := compareKey(k, x.key)
		if sign < 0 {
			pos, x, parent = &x.left, x.left, x
		} else if sign > 0 {
			pos, x, parent = &x.right, x.right, x
		} else {
			break
		}
	}
	return pos, parent
}
```

## 前提知識

- **二分探索木**: 各ノードが、左の子は小さい鍵、右の子は大きい鍵を持つ木です。鍵を探すときは、大小を比べて左か右へ進みます。
- **ポインタのポインタ（`**node`）**: 「ポインタを指すポインタ」です。`pos` は、親の `left` や `right`、またはルート `t.root` そのものを指します。これで、そこに別のノードを書き込めます。
- **`compareKey`**: 2 つの鍵の大小を、負・0・正で返す関数です。
- **`&x.left`**: 構造体のフィールドのアドレスです。その場所を通じて、後で値を書き換えられます。

## 何をしているか

### 1. ルートから探し始める

```go:line-numbers=113
	pos, x := &t.root, t.root
	for x != nil {
```

`pos` は、ルートを指すポインタ `&t.root` から始めます。`x` は、今見ているノードです。`x` が `nil` になるまで、木を下っていきます。

### 2. 大小で左か右へ進む

```go:line-numbers=115
		sign := compareKey(k, x.key)
		if sign < 0 {
			pos, x, parent = &x.left, x.left, x
```

鍵 `k` と現在のノードの鍵を比べます。`k` が小さければ左へ、`pos` を `x.left` のアドレスにし、`x` と `parent` を更新します。`pos` は、親の左フィールドを指すので、ここに書き込めば、その子を差し替えられます。

### 3. 一致か、行き止まりで止まる

```go:line-numbers=118
		} else if sign > 0 {
			pos, x, parent = &x.right, x.right, x
		} else {
			break
		}
	}
	return pos, parent
```

大きければ右へ進みます。一致したら `break` で止まります。`x` が `nil` になれば、鍵はなく、`pos` は「ここに入るべき場所」を指したままです。

## ここがすごい

- **場所をポインタで表す**: 見つけた場所を値で返すと、差し込みのためにもう一度たどる必要があります。ポインタのポインタを返せば、その場で書き換えられます。
- **挿入と探索を 1 つの関数で**: 「見つからなかった場所」も正しく返るので、挿入も削除も同じ探索を使えます。
- **1 本の道をたどるだけ**: 木の高さに比例した回数で、目的の場所に着きます。

## まとめ

- `locate` は、二分探索木の中で鍵の場所を探します。
- 戻り値は、その場所を指すポインタのポインタと、親のノードです。
- ポインタのポインタを使うと、探した場所にそのまま書き込めます。
- 一致しなかったときは、入るべき場所を指したままになります。
