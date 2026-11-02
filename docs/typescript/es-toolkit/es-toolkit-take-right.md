---
title: "配列の末尾から、指定した数だけ取り出す。負の添字の落とし穴を避ける"
description: "es-toolkit の takeRight。配列の末尾から count 個を取り出す。count が 0 以下のときは空の配列を返し、slice(-0) が全件を返す罠を避けている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/takeRight.ts
lines: [22, 27]
function: "takeRight"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`takeRight(arr, count)` は、配列の末尾から `count` 個の要素を取り出して、新しい配列として返す関数です。たとえば `takeRight([1, 2, 3, 4], 2)` は `[3, 4]` です。元の配列は変わりません。

```ts
takeRight([1, 2, 3, 4], 2) // [3, 4]
takeRight([1, 2, 3, 4], 0) // []（0 個なので空）
```

## コード

```ts:line-numbers=22
export function takeRight<T>(arr: readonly T[], count: number): T[] {
  if (count <= 0 || arr.length === 0) {
    return [];
  }
  return arr.slice(-count);
}
```

## 前提知識

- **`slice(start)`**: 配列の `start` 番目から末尾までを、コピーして返します。`start` に負の数を入れると、末尾からの位置になります。
- **`slice(-2)`**: 末尾の 2 個を取り出します。`-2` は「後ろから 2 番目の位置」だからです。
- **`slice(-0)`**: `-0` は `0` と同じなので、先頭からの位置 `0` と解釈され、配列全体を返してしまいます。
- **短絡評価（`||`）**: `a || b` は、`a` が真なら `b` を見ずに止まります。ここでは、条件を並べて早めに返すために使われています。

## 何をしているか

### 1. 0 個や空配列なら、すぐに空を返す

```ts:line-numbers=23
  if (count <= 0 || arr.length === 0) {
    return [];
  }
```

`count` が `0` 以下のとき、または配列が空のときは、取り出すものがありません。空の配列を返して終わります。

### 2. 末尾から切り出す

```ts:line-numbers=26
  return arr.slice(-count);
```

`slice(-count)` で、末尾の `count` 個をコピーします。`count` が配列の長さより大きくても、`slice` は配列の先頭までを返すので、安全です。

## ここがすごい

- **`count <= 0` の判定が、罠を防ぐ**: `slice(-0)` は全件を返すので、もし `count` が 0 のときに何も対策しないと、すべての要素を返してしまいます。先に 0 を弾くことで、その誤りを防いでいます。
- **大きすぎる数にも強い**: `count` が配列の長さより大きくても、`slice` が範囲内に切ってくれるので、特別な処理は要りません。
- **元の配列を変えない**: `slice` は新しい配列を返すので、呼び出し元の配列は書き換わりません。
- **条件の順序**: 0 以下と空の判定を先にまとめ、本体の `slice` は 1 行で済ませています。読み手は、何が特別な場合なのかを先に知れます。

## まとめ

- 末尾から取り出すには、`slice` に負の数を渡すと簡単。
- ただし `slice(-0)` は全件を返すので、0 の場合は先に弾く。
- `slice` は範囲外の値を安全に扱うので、大きすぎる数も問題ない。
- 元の配列を変えない関数は、データを共有しても安心して使える。
