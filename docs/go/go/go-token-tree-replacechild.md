---
title: "親の子を差し替える go/token の replaceChild。3 通りの場所を見分ける"
description: "go/token の二分探索木で、ある親の子を別のノードに置き換える replaceChild。親が nil ならルート、左の子か右の子かを判定して、その場所を書き換える。違う場合はパニックで検出する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/tree.go"
lines: [217, 231]
function: "replaceChild"
difficulty: 2
tags: [データ構造, 防御的プログラミング, 型システム]
---

## ひとことで

`replaceChild(parent, old, new)` は、木の中で `parent` の子 `old` を、`new` に置き換えます。木の回転（形を整える操作）のときに使われる、小さな関数です。`parent` が `nil` なら、`old` はルートなので、ルートを差し替えます。

置き換える場所は、3 通りのどれかです。どれにも当てはまらなければ、木が壊れていると判断して、パニックします。

## コード

```go:line-numbers=217
func (t *tree) replaceChild(parent, old, new *node) {
	switch {
	case parent == nil:
		if t.root != old {
			panic("corrupt tree")
		}
		t.setRoot(new)
	case parent.left == old:
		parent.setLeft(new)
	case parent.right == old:
		parent.setRight(new)
	default:
		panic("corrupt tree")
	}
}
```

## 前提知識

- **二分探索木のルート**: 木の一番上のノードです。親を持たないので、親が `nil` で表されます。
- **回転**: 木の形を変えて、高さを揃える操作です。回転で子の入れ替えが起きるので、親の参照を正しく差し替える必要があります。
- **`setRoot`、`setLeft`、`setRight`**: それぞれ、ルート、左の子、右の子を設定する関数です。
- **パニック**: 「ありえないこと」が起きたときに、プログラムを止める仕組みです。木の中身が壊れていることを、早く知らせます。

## 何をしているか

### 1. 親がなければルートを差し替える

```go:line-numbers=219
	case parent == nil:
		if t.root != old {
			panic("corrupt tree")
		}
		t.setRoot(new)
```

親が `nil` なら、`old` はルートでなければなりません。違えば木が壊れているので、パニックします。正しければ、ルートを `new` に差し替えます。

### 2. 左の子なら左を差し替える

```go:line-numbers=224
	case parent.left == old:
		parent.setLeft(new)
```

`old` が親の左の子なら、左を `new` にします。

### 3. 右の子なら右を差し替える

```go:line-numbers=226
	case parent.right == old:
		parent.setRight(new)
```

`old` が親の右の子なら、右を `new` にします。どちらでもなければ、`default` で、木が壊れていると判断します。

## ここがすごい

- **場所ごとに関数を分ける**: 親の左、右、ルートのどれかを判定してから書き換えるので、正しい場所だけに書き込みます。
- **壊れたら早く止まる**: `old` の位置が合わない状態で書き換えると、木がさらに壊れます。パニックで、問題の発生場所を見つけやすくしています。
- **switch で場所を並べる**: 3 通りの場合が、上から順に見やすく並んでいます。

## まとめ

- `replaceChild` は、親の子 `old` を `new` に置き換えます。
- 親が `nil` ならルートを、左か右なら対応する子を差し替えます。
- どこにも当てはまらなければ、木が壊れているとしてパニックします。
- 木の回転などの操作が、この関数で安全に子を入れ替えます。
