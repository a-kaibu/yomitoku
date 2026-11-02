---
title: "平衡木の高さと釣り合いを検査する go/token の checkBalance"
description: "go/token の平衡二分木の検査 checkBalance。左右の部分木の高さの差が -2 から +2 の範囲にあるか、保存しておいた balance と height が実際と一致するかを確かめ、食い違えばパニックする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/tree.go"
lines: [93, 106]
function: "checkBalance"
difficulty: 3
tags: [データ構造, アルゴリズム, 防御的プログラミング]
---

## ひとことで

`go/token` の木は、左右の高さが大きく偏らないように作られています。このような木を **平衡木（バランス木）** と呼びます。`checkBalance` は、木の 1 つの節点について、その約束が守られているかを確かめる検査です。

検査は、テストや開発のときに使われます。もし値が合わなければ、実装の誤りとして、パニックで知らせます。

## コード

```go:line-numbers=93
func (n *node) checkBalance() {
	lheight, rheight := n.left.safeHeight(), n.right.safeHeight()
	balance := rheight - lheight
	if balance != n.balance {
		panic("bad node.balance")
	}
	if !(-2 <= balance && balance <= +2) {
		panic(fmt.Sprintf("node.balance out of range: %d", balance))
	}
	h := 1 + max(lheight, rheight)
	if h != n.height {
		panic("bad node.height")
	}
}
```

## 前提知識

- **平衡木**: 左右の部分木の高さの差が小さい、二分探索木です。どの節点でも差が 2 以内なので、木の高さは `log n` 程度に抑えられます。
- **balance と height**: 節点は、自分の右と左の高さの差 `balance` と、自分の高さ `height` を覚えています。挿入や削除のたびに更新されます。
- **`safeHeight`**: `nil` の部分木でも、高さ 0 として安全に返す関数です。
- **`max` 組み込み関数**: 2 つの値の大きい方を返します。

## 何をしているか

### 1. 高さを計算して差を確かめる

```go:line-numbers=94
	lheight, rheight := n.left.safeHeight(), n.right.safeHeight()
	balance := rheight - lheight
	if balance != n.balance {
		panic("bad node.balance")
	}
```

左右の部分木の高さを求めて、その差 `balance` を計算します。節点に保存してある `n.balance` と違えば、保存の仕方が間違っているので、パニックします。

### 2. 差が範囲内か確かめる

```go:line-numbers=99
	if !(-2 <= balance && balance <= +2) {
		panic(fmt.Sprintf("node.balance out of range: %d", balance))
	}
```

平衡木では、差が -2 から +2 の間に収まる約束です。範囲を外れていれば、回転による調整が正しく行われなかったことを意味するので、パニックで知らせます。

### 3. 高さが正しいか確かめる

```go:line-numbers=102
	h := 1 + max(lheight, rheight)
	if h != n.height {
		panic("bad node.height")
	}
```

自分の高さは、子の高さの大きいほうに 1 を足したものです。その値が保存してある `n.height` と違えば、高さの管理が正しくありません。

## ここがすごい

- **1 つの節点の約束を局所的に検査**: 木全体を見なくても、節点ごとに約束を確かめられます。木の全部の節点に適用すれば、全体の検査になります。
- **誤りを早く止める**: 値が違えば、すぐにパニックします。壊れた木の上で処理を続けて、おかしな結果が出ることを防ぎます。
- **保存値と計算値を比べる**: 挿入や削除で更新された保存値が、実際の形と合っているかを確かめます。キャッシュの整合性を確かめる典型的な方法です。

## まとめ

- `checkBalance` は、平衡木の 1 つの節点の約束を確かめます。
- 左右の高さの差が保存値と一致し、かつ -2 から +2 の範囲に収まることを検査します。
- 自分の高さが、子の高さの大きい方に 1 を足したものと一致するかを確かめます。
- 食い違いがあればパニックで知らせます。
