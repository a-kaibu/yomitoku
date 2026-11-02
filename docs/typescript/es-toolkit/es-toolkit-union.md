---
title: "二つの配列を合わせて、重複を除いた配列を作る"
description: "es-toolkit の union は、二つの配列を連結して重複を取り除く。concat で合わせてから uniq に渡す、2 段階の短い組み立て方を読む。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/union.ts
lines: [20, 22]
function: "union"
difficulty: 1
format: 2
tags: [イディオム, データ構造]
---

## ひとことで

`union(arr1, arr2)` は、二つの配列の要素を合わせて、同じ値を 1 つにまとめた配列を返す関数です。和集合とも呼ばれます。

```ts
union([1, 2], [2, 3])  // [1, 2, 3]
```

## コード

```ts:line-numbers=20
export function union<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
  return uniq(arr1.concat(arr2));
}
```

## 前提知識

- **和集合**: 二つの集まりのどちらかに入っている要素の集まりです。同じ要素は 1 回だけ数えます。
- **`concat`**: 配列を後ろにつなげて、新しい配列を作るメソッドです。元の配列は変わりません。
- **`uniq`**: 同じ配列の中の重複を取り除く関数で、同じプロジェクトにあります。

## 何をしているか

### 1. 二つの配列をつなげる

```ts:line-numbers=21
  return uniq(arr1.concat(arr2));
```

`arr1.concat(arr2)` で、二つの配列を 1 本の配列にします。この時点では、同じ値が複数残っています。

### 2. 重複を取り除く

同じ式の `uniq(...)` が、つなげた配列から重複を取り除きます。結果として、和集合になります。

## ここがすごい

- **2 段階の単純な構成**: 「つなげる」と「重複を消す」の 2 つだけで、和集合の定義をそのまま表しています。
- **仕事を分けている**: 重複の判定は `uniq` に任せ、`union` は組み立てに集中しています。
- **元を変えない**: `concat` は新しい配列を作るので、引数の配列は変わりません。

## まとめ

- `union` は、二つの配列の和集合を、重複を除いた配列で返す。
- まず `concat` で連結し、次に `uniq` で重複を取り除く。
- 元の配列は変わらず、判定の仕事は `uniq` に任せている。
