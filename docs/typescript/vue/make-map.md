---
title: "1 回だけ表を作り、あとは in で判定する関数"
description: "カンマ区切りの文字列から、キーの有無を判定する関数を作る makeMap。Object.create(null) で作った表を閉じ込め、ビルド時に不要なら消えるように印を付けている。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/makeMap.ts
lines: [9, 14]
function: "makeMap"
difficulty: 1
format: 2
tags: [データ構造, 最適化, イディオム]
---

## ひとことで

`makeMap('a,b,c')` は、「この文字列はキー `a`、`b`、`c` のどれかか」を判定する関数を作ります。

```ts
const isBuiltIn = makeMap('div,span,p')
isBuiltIn('span') // true
isBuiltIn('table') // false
```

Vue の中には「HTML の要素名」「許される属性名」のような、長い名前の一覧がたくさんあります。それを毎回配列から探すのではなく、最初に **表（オブジェクト）** にしておくのがこの関数の目的です。

## コード

::: code-group

```ts:line-numbers=9 [日本語訳]
/*@__NO_SIDE_EFFECTS__ の印（副作用がないことを示す） */
export function makeMap(str: string): (key: string) => boolean {
  const map = Object.create(null)
  for (const key of str.split(',')) map[key] = 1
  return val => val in map
}
```

```ts:line-numbers=9 [原文]
/*@__NO_SIDE_EFFECTS__*/
export function makeMap(str: string): (key: string) => boolean {
  const map = Object.create(null)
  for (const key of str.split(',')) map[key] = 1
  return val => val in map
}
```

:::

## 前提知識

- **`Object.create(null)`**: 何のプロトタイプも持たない空のオブジェクトを作ります。普通の `{}` は `toString` のような名前を最初から持っているので、`'toString' in {}` が `true` になってしまいます。それを避けるための書き方です。
- **`split(',')`**: 文字列をカンマで区切って配列にします。
- **`for ... of`**: 配列の要素を 1 つずつ取り出します。
- **`val in map`**: オブジェクトにそのキーがあるかを調べます。
- **アロー関数**: `val => val in map` は、引数 `val` を受け取って判定結果を返す関数を短く書いたものです。

## 何をしているか

### 1. 表を作る

```ts:line-numbers=11
  const map = Object.create(null)
  for (const key of str.split(',')) map[key] = 1
```

まず空のオブジェクトを作り、カンマで区切った名前をキーとして 1 ずつ入れます。値は何でもよいので `1` を入れています。

`'div,span,p'` なら、表は `{ div: 1, span: 1, p: 1 }` になります。

### 2. 判定する関数を返す

```ts:line-numbers=13
  return val => val in map
```

返す関数は、表を覚えたまま（クロージャ）、キーが `in` で存在するかだけを調べます。文字列を分解するのは作るときの 1 回だけで、判定のたびに分解はしません。

## ここがすごい

- **分解は 1 回だけ**: 判定を何度呼んでも、文字列の分解は最初の 1 回です。配列の `includes` で毎回探すより、`in` での判定はずっと速くなります。
- **`Object.create(null)` で安全に**: 名前の中に `constructor` や `toString` があっても、表にはそれ以外のキーが入っていないので、誤って `true` になりません。
- **コメントで消されやすさを伝える**: ファイル先頭のコメントにあるとおり、この関数の呼び出しには `/*#__PURE__*/` の印を付けます。使われていない表は、ビルドのときに丸ごと取り除けます。

## まとめ

- 名前の一覧は、最初に表（オブジェクト）にしておくと判定が速い。
- `Object.create(null)` で作ると、プロトタイプの名前と衝突しない。
- 作るときに 1 回だけ重い処理をし、あとは軽い判定を返す、という分け方は定番の最適化。
