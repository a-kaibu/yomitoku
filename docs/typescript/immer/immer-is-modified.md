---
title: "下書きの中で、どこか 1 つでも書き換えられたかを調べる"
description: "immer の isModified。下書きやその中の下書きが書き換えられたかを、印の値で返す。書き換えを含むかを、中身を比べずに判定できる。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [39, 42]
function: "isModified"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, メモリ管理]
---

## ひとことで

`isModified(value)` は、値が下書きで、その中（直接または内側の下書き）が書き換えられたかを判定する関数です。書き換えがあれば `true`、無ければ `false` を返します。下書きでない値は、常に `false` です。

```ts
produce({ a: { b: 1 } }, (draft) => {
  isModified(draft)        // false（まだ何も書き換えていない）
  draft.a.b = 2
  isModified(draft)        // true（内側の変更が、外側にも伝わる）
})
```

## コード

```ts:line-numbers=39
export function isModified(value: any): boolean {
	if (!isDraft(value)) return false
	return value[DRAFT_STATE].modified_
}
```

## 前提知識

- **下書きの印（`DRAFT_STATE`）**: 下書きが持つ、状態を入れた場所です。`modified_` はその中の、変更があったことを表す値です。
- **変更の印の伝播**: 内側の下書きを書き換えると、親の下書きにも変更の印が付きます。これは、immer の中で別の関数（`markChanged`）が行っています。
- **`!isDraft(value)`**: 下書きでない値を、先に弾く条件です。
- **真偽値の返し方**: 変更の有無を、状態の値そのままで返します。

## 何をしているか

### 1. 下書きでなければ、変更は無い

```ts:line-numbers=40
	if (!isDraft(value)) return false
```

渡された値が下書きでなければ、書き換えの話はできないので `false` を返します。

### 2. 下書きの変更の印を返す

```ts:line-numbers=41
	return value[DRAFT_STATE].modified_
```

下書きの状態にある `modified_` を返します。書き換えがあれば `true` です。内側の変更は、親へ伝わるように作られているので、この 1 つの値で十分です。

## ここがすごい

- **中身を比べなくていい**: 元の値と書き換えた値を比べると、大きなデータでは時間がかかります。変更の印を見るだけで、即座に答えが出ます。
- **内側の変更も見逃さない**: 変更の印は親へ伝わるので、深い場所の変更でも、一番上の下書きで `true` になります。
- **下書きでない値を安全に扱う**: 下書きでない値には、`false` を返すので、呼び出し側は種類を確かめずに使えます。
- **1 つの値で状態を表す**: 変更の有無を、1 つの真偽値として持っています。判定が単純で、速く動きます。

## まとめ

- 書き換えの有無は、比較ではなく、変更の印で判定すると速い。
- 内側の変更が親に伝わる仕組みがあるので、一番上の下書きを見るだけで十分。
- 下書きでない値には `false` を返すと、呼び出し側が楽になる。
- 変更を 1 つの印で持つ設計は、大きなデータを扱うライブラリで有効。
