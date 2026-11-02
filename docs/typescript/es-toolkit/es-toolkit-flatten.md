---
title: "入れ子の配列を、指定した深さまで平らにする"
description: "es-toolkit の flatten は、入れ子になった配列を指定した深さまで平らにする。再帰で深さを数え、型でも結果の型を深さに合わせて計算している。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/flatten.ts
lines: [17, 34]
function: "flatten"
difficulty: 2
format: 2
tags: [再帰, データ構造, 型システム]
---

## ひとことで

`flatten(arr, depth)` は、入れ子になった配列を、指定した深さまで平らにした新しい配列を返す関数です。深さを省略すると 1 段だけ平らにします。

```ts
flatten([1, [2, [3]]])     // [1, 2, [3]]
flatten([1, [2, [3]]], 2)  // [1, 2, 3]
```

## コード

```ts:line-numbers=17
export function flatten<T, D extends number = 1>(arr: readonly T[], depth = 1 as D): Array<FlatArray<T[], D>> {
  const result: Array<FlatArray<T[], D>> = [];
  const flooredDepth = Math.floor(depth);

  const recursive = (arr: readonly T[], currentDepth: number) => {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (Array.isArray(item) && currentDepth < flooredDepth) {
        recursive(item, currentDepth + 1);
      } else {
        result.push(item as FlatArray<T[], D>);
      }
    }
  };

  recursive(arr, 0);
  return result;
}
```

## 前提知識

- **再帰**: 関数が自分自身を呼び出す書き方です。入れ子の構造を、同じ手順で潜っていくときに向いています。
- **`Array.isArray`**: 値が配列かどうかを調べる関数です。
- **型の計算**: `FlatArray<T[], D>` のように、型の中で別の型を計算して決める仕組みです。深さの数によって、結果の型が変わります。

## 何をしているか

### 1. 深さを確かめて、中を調べる

```ts:line-numbers=21
  const recursive = (arr: readonly T[], currentDepth: number) => {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (Array.isArray(item) && currentDepth < flooredDepth) {
        recursive(item, currentDepth + 1);
      } else {
        result.push(item as FlatArray<T[], D>);
      }
    }
  };
```

要素が配列で、まだ指定した深さに届いていなければ、中に潜ります。それ以外は、そのまま結果に入れます。

### 2. 深さを整数にそろえる

```ts:line-numbers=19
  const flooredDepth = Math.floor(depth);
```

`2.7` のような小数が渡されても、切り捨てて整数の深さとして扱います。

## ここがすごい

- **深さの管理が 1 つの数**: `currentDepth` を 1 ずつ増やすだけで、どこまで潜るかを管理しています。
- **型でも深さが分かる**: 深さの型 `D` を使い、戻り値の型を計算しています。呼び出す人は、結果がどの要素型になるかを型の上で知れます。
- **結果を 1 つの配列に集める**: 再帰の途中で `result` に順に入れていくので、途中の配列を作り直す無駄がありません。

## まとめ

- `flatten` は、入れ子の配列を指定した深さまで平らにする。
- 再帰で深さを数えながら、配列の中を潜っていく。
- 型でも深さに応じた結果の型を計算し、呼び出し側に伝える。
