---
title: "値の種類を、配列・Map・Set・オブジェクトのどれかに分ける"
description: "immer の getArchtype。下書きならその状態に入った種類を、そうでなければ値の見た目から、配列・Map・Set・オブジェクトのいずれかを返す。種類ごとの処理を分ける土台。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [116, 127]
function: "getArchtype"
difficulty: 2
format: 2
tags: [型システム, 設計パターン, データ構造]
---

## ひとことで

`getArchtype(thing)` は、値が配列・`Map`・`Set`・普通のオブジェクトのどれかを、列挙型の数で返す関数です。immer は、この結果で処理を振り分けます。たとえば、`Map` の中身の書き換えと、オブジェクトの中身の書き換えは、やり方が違うため、先に種類を調べます。

```ts
getArchtype([])           // ArchType.Array
getArchtype(new Map())    // ArchType.Map
getArchtype({})           // ArchType.Object
```

## コード

```ts:line-numbers=116
export function getArchtype(thing: any): ArchType {
	const state: undefined | ImmerState = thing[DRAFT_STATE]
	return state
		? state.type_
		: isArray(thing)
		? ArchType.Array
		: isMap(thing)
		? ArchType.Map
		: isSet(thing)
		? ArchType.Set
		: ArchType.Object
}
```

## 前提知識

- **`ArchType`**: 値の種類を表す数の定数です。`Object`、`Array`、`Map`、`Set` の 4 つがあります。数で持つと、比べるのが速くなります。
- **下書きの状態（`DRAFT_STATE`）**: 下書きには、その元の種類などを覚えた状態が付いています。`thing[DRAFT_STATE]` で取り出せます。
- **`Array.isArray`**: 配列かどうかを判定します。`typeof` では配列を見分けられないので、この関数を使います。
- **`instanceof`**: 値が、あるクラスから作られたかを判定します。`value instanceof Map` は、`Map` から作られたかを表します。
- **三項演算子の連鎖**: `条件 ? A : 条件 ? B : C` のように、条件を順に並べて値を選ぶ書き方です。

## 何をしているか

### 1. 下書きなら、その状態の種類を使う

```ts:line-numbers=117
	const state: undefined | ImmerState = thing[DRAFT_STATE]
	return state
		? state.type_
```

値が下書きなら、その状態に覚えてある種類（`type_`）を返します。下書きは、元の値の種類を既に知っているので、判定し直す必要がありません。

### 2. 下書きでなければ、値の見た目で判定する

```ts:line-numbers=120
		: isArray(thing)
		? ArchType.Array
		: isMap(thing)
		? ArchType.Map
		: isSet(thing)
		? ArchType.Set
		: ArchType.Object
```

配列なら `Array`、`Map` なら `Map`、`Set` なら `Set`、それ以外は `Object` を返します。判定は、先に配列、次に `Map`、次に `Set` の順で行われます。

## ここがすごい

- **下書きの情報を優先する**: 下書きは元の種類を覚えているので、その情報を使えば、判定の処理を省けます。
- **数で種類を表す**: 文字列の比較ではなく、数の比較で分岐できるので、よく呼ばれる関数でも速く動きます。
- **判定の順番に意味がある**: 配列は `typeof` で `object` に見えるため、`Array.isArray` を先に確かめています。
- **1 つの関数で振り分けの土台を作る**: 各処理は、この関数の戻り値で振り分ければよいので、種類の判定が 1 か所にまとまります。

## まとめ

- 値の種類を判定して数で返すと、後の処理を分岐しやすい。
- 下書きは元の種類を覚えているので、その情報を優先すると無駄がない。
- 配列は `typeof` では見分けられないので、`Array.isArray` を使う。
- 種類の判定を 1 か所にまとめると、処理の振り分けが統一される。
