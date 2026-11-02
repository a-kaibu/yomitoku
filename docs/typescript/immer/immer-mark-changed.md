---
title: "変更の印を親の下書きまで一気にさかのぼらせる"
description: "immer の markChanged。深い場所の 1 つの値が変わったとき、その親、そのまた親へと印を付けていく。すでに印がある所で止まるので、無駄な再帰をしない。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/core/proxy.ts
lines: [347, 354]
function: "markChanged"
difficulty: 2
format: 2
tags: [再帰, メモリ管理, 設計パターン]
---

## ひとことで

`markChanged(state)` は、下書き（draft）の中の 1 つが変わったとき、その下書きに「変更あり」の印を付け、さらに親の下書きにも同じ印を付けていく関数です。immer は最後に「どこが変わったか」を見て、変わった部分だけを新しく作り直します。その判断材料になるのが、この関数の付けた印です。

```ts
const draft = { user: { name: "たろう" } }
// draft.user.name = "じろう" と書くと、user と draft（一番上）の両方に印が付く
```

## コード

```ts:line-numbers=347
export function markChanged(state: ImmerState) {
	if (!state.modified_) {
		state.modified_ = true
		if (state.parent_) {
			markChanged(state.parent_)
		}
	}
}
```

## 前提知識

- **下書き（draft）**: immer が元のオブジェクトの代わりに渡す、書き換え可能な見た目のオブジェクトです。実際の変更は後でまとめて行われます。
- **親（parent）**: ある下書きを中に持っている、ひとつ上の下書きのことです。`user` の親は一番上のオブジェクトです。
- **再帰**: 関数の中で、自分自身を別の引数で呼ぶことです。ここでは親をたどるために使っています。
- **`if (!state.modified_)`**: 「まだ変更の印がないなら」という条件です。`!` は「ではない」を表します。
- **終了条件**: 再帰が無限に続かないように、どこで止めるかを決めておく必要があります。

## 何をしているか

### 1. まだ印がなければ付ける

```ts:line-numbers=348
	if (!state.modified_) {
		state.modified_ = true
```

`modified_` は「この下書きは変わった」という印です。すでに `true` なら何もしません。ここが再帰の止まる場所になります。

### 2. 親にも同じことをする

```ts:line-numbers=350
		if (state.parent_) {
			markChanged(state.parent_)
		}
```

親がある（`parent_` が `null` でない）なら、親に対して同じ `markChanged` を呼びます。一番上の下書きは親を持たないので、ここで再帰が終わります。

## ここがすごい

- **印があれば止まる**: 変更の印が付いている下書きに再び出会ったら、そこで打ち切ります。同じ親を何度もたどらないので、たくさんの場所を同時に変えても処理は軽く済みます。
- **変わった道だけが印付きになる**: 変更を含む道筋だけに印が付くので、後の処理で「変わっていない枝」をまるごと再利用できます。これが immer の構造共有（変わらない部分を新しいオブジェクトと共有すること）の土台です。
- **短い再帰で足りる**: 親をたどる処理は、数行の再帰だけで書けます。ループと比べても、読んで意味がすぐにわかる形です。
- **状態を 1 つの真偽値に集約**: 変更の有無を 1 つの `modified_` だけで表すので、判定が単純です。

## まとめ

- 深い場所の変更は、親へ印を伝えて上まで届ける必要がある。
- 再帰の終わりは「すでに印がある」という条件にすると、無駄が減る。
- 変更の印があれば、後の処理は変わった部分だけを作り直せる。
- 再帰を書くときは、無限に続かない終了条件を最初に考える。
