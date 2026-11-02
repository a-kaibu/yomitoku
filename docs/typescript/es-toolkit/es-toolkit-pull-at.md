---
title: "指定した位置の要素を取り除き、取り除いた値を返す"
description: "es-toolkit の pullAt は、指定した位置の要素を配列から取り除く。大きい番号から順に消すことで、消した後の位置ずれを防いでいる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/pullAt.ts
lines: [19, 28]
function: "pullAt"
difficulty: 2
format: 2
tags: [データ構造, イディオム, 防御的プログラミング]
---

## ひとことで

`pullAt(arr, indices)` は、配列の指定した位置にある要素を取り除き、取り除いた値を配列で返す関数です。元の配列は書き換えられます。負の位置（末尾からの数え方）にも対応しています。

```ts
const arr = [10, 20, 30, 40]
pullAt(arr, [0, 2])  // [10, 30] を返し、arr は [20, 40] になる
```

## コード

```ts:line-numbers=19
export function pullAt<T>(arr: T[], indicesToRemove: readonly number[]): T[] {
  const removed = at(arr, indicesToRemove);
  const indices = new Set(indicesToRemove.map(index => (index < 0 ? index + arr.length : index)).sort((x, y) => y - x));

  for (const index of indices) {
    arr.splice(index, 1);
  }

  return removed;
}
```

## 前提知識

- **`splice`**: 配列の途中から要素を消したり入れたりする、配列の破壊的なメソッドです。`splice(i, 1)` は位置 `i` の要素を 1 つ消します。
- **破壊的な変更**: 元の配列を書き換えることです。`pullAt` は、この変更をわざと行う関数です。
- **負の位置**: `-1` は末尾の要素を指す、という数え方です。

## 何をしているか

### 1. 先に値を集める

```ts:line-numbers=20
  const removed = at(arr, indicesToRemove);
```

消す前に、取り出す値を集めておきます。消した後では値が取れないからです。

### 2. 位置を大きい順に並べる

```ts:line-numbers=21
  const indices = new Set(indicesToRemove.map(index => (index < 0 ? index + arr.length : index)).sort((x, y) => y - x));
```

負の位置を正の位置に直し、重複を除き、大きい順に並べます。

### 3. 後ろから消す

```ts:line-numbers=23
  for (const index of indices) {
    arr.splice(index, 1);
  }
```

後ろの位置から消していきます。前の位置を消すと後ろの要素がずれますが、後ろから消せば、まだ消していない位置はずれません。

## ここがすごい

- **位置ずれを防ぐ工夫**: 大きい番号から消すという順番だけで、消した後の位置が狂う問題を避けています。
- **負の位置に対応**: 末尾から数える指定も、同じ式でまとめて正の位置に直せます。
- **重複に強い**: `Set` を使うので、同じ位置を 2 回指定しても 1 回だけ消されます。

## まとめ

- `pullAt` は、指定した位置の要素を消して、その値を返す。
- 消す位置は大きい順に並べ、後ろから消すので位置がずれない。
- 負の位置も受け付け、重複した指定は 1 回にまとめられる。
