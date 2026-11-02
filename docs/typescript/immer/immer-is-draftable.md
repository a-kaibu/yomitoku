---
title: "どの値を下書きにできるかを、種類ごとに判定する"
description: "immer の isDraftable。プレーンなオブジェクト、配列、Map、Set、そして印を付けたクラスだけを下書きにできる。判定の並びを読むと、immer の対象範囲が分かる。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [46, 56]
function: "isDraftable"
difficulty: 2
format: 2
tags: [型システム, 防御的プログラミング, 設計パターン]
---

## ひとことで

`isDraftable(value)` は、immer の下書き（draft）にできる値かを判定する関数です。プレーンなオブジェクト、配列、`Map`、`Set` は下書きにできます。さらに、`[immerable]` という印を付けたクラスのインスタンスも対象になります。それ以外の値は、そのまま使うしかありません。

```ts
isDraftable({ a: 1 })     // true
isDraftable([1, 2])       // true
isDraftable(new Map())    // true
isDraftable(42)           // false（数は下書きにできない）
```

## コード

```ts:line-numbers=46
export function isDraftable(value: any): boolean {
	if (!value) return false
	return (
		isPlainObject(value) ||
		isArray(value) ||
		!!value[DRAFTABLE] ||
		!!value[CONSTRUCTOR]?.[DRAFTABLE] ||
		isMap(value) ||
		isSet(value)
	)
}
```

## 前提知識

- **下書き（draft）**: immer が、元のデータの代わりに渡す書き換え可能なデータです。`produce` の中で、普通のオブジェクトのように書き換えられます。
- **プレーンオブジェクト**: `{}` や `Object.create(null)` のように、特別な継承を持たない、普通のオブジェクトです。
- **印（シンボル）**: `Symbol.for('immer-draftable')` のような、他と重ならない値をキーにした印です。クラスにこの印を付けると、immer に「下書きにしてよい」と伝えられます。
- **`!!`**: 値を真偽値にします。印が付いているかどうかを、真か偽かで判断するために使われています。
- **`?.`（オプショナルチェーン）**: `value[CONSTRUCTOR]?.[DRAFTABLE]` は、途中が無ければ `undefined` で止まる書き方です。

## 何をしているか

### 1. 値が無ければ、すぐに偽

```ts:line-numbers=47
	if (!value) return false
```

`null` や `undefined` や `0` などの偽の値は、下書きにできないので、ここで `false` を返します。

### 2. 種類ごとに、判定を並べる

```ts:line-numbers=48
	return (
		isPlainObject(value) ||
		isArray(value) ||
		!!value[DRAFTABLE] ||
		!!value[CONSTRUCTOR]?.[DRAFTABLE] ||
		isMap(value) ||
		isSet(value)
	)
```

プレーンオブジェクト、配列、印の付いたもの、印の付いたクラスのインスタンス、`Map`、`Set` のどれかに当てはまれば `true` です。`||` でつないでいるので、どれか 1 つでも当てはまれば、判定は終わります。

## ここがすごい

- **対象範囲を明示している**: 「どの値なら下書きにできるか」が、この 1 つの関数に全部書かれています。immer の対象範囲を知るための入口です。
- **印で拡張できる**: クラスの作者は、印を付けるだけで immer の対象に入れられます。immer 側がクラスの一覧を持つ必要がありません。
- **`constructor` の印も見る**: インスタンスの印が無くても、コンストラクタ（クラスの本体）に印があれば対象にします。どちらの書き方にも対応しています。
- **短絡評価で早く終わる**: `||` の左から順に調べ、当てはまったらそこで止まります。よくある配列やオブジェクトは、早い段階で判定されます。

## まとめ

- immer が扱える値は、プレーンなオブジェクト、配列、Map、Set、印付きのクラス。
- 印（Symbol）を使うと、ライブラリの作者が対象を拡張できる。
- 判定の並びを読むと、ライブラリの対象範囲と拡張の方法が分かる。
- 偽の値を最初に弾くと、後の判定を安全に書ける。
