---
title: "条件を満たす間だけ先頭を捨てる。findIndex で止まる位置を探す"
description: "es-toolkit の dropWhile。先頭から条件が真の間だけ要素を捨て、最初に条件が偽になった位置から後ろを返す。findIndex で位置を 1 回探すだけで済ませている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/dropWhile.ts
lines: [19, 30]
function: "dropWhile"
difficulty: 2
format: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

`dropWhile(arr, canContinueDropping)` は、配列の先頭から、条件が真である間だけ要素を捨て、条件が初めて偽になった位置から後ろを返す関数です。たとえば、先頭の空白を飛ばしたいときに使えます。

```ts
dropWhile([1, 2, 3, 1], (x) => x < 3) // [3, 1]
dropWhile([1, 2], (x) => x < 10)      // []（全部捨てられる）
```

## コード

```ts:line-numbers=19
export function dropWhile<T>(
  arr: readonly T[],
  canContinueDropping: (item: T, index: number, arr: readonly T[]) => boolean
): T[] {
  const dropEndIndex = arr.findIndex((item, index, arr) => !canContinueDropping(item, index, arr));

  if (dropEndIndex === -1) {
    return [];
  }

  return arr.slice(dropEndIndex);
}
```

## 前提知識

- **`findIndex`**: 配列の要素を先頭から調べ、条件を最初に満たした位置を返します。見つからなければ `-1` です。
- **`slice(start)`**: `start` 番目から末尾までを、コピーして返します。
- **「捨てる条件」と「残す条件」**: `canContinueDropping` は「まだ捨ててよいか」を返す関数です。その否定が「ここから残す」条件になります。
- **`!`（否定）**: 真偽を反転させます。`!canContinueDropping(…)` は、「捨てられない」つまり「残す」の判定です。

## 何をしているか

### 1. 最初に残すべき位置を探す

```ts:line-numbers=23
  const dropEndIndex = arr.findIndex((item, index, arr) => !canContinueDropping(item, index, arr));
```

`findIndex` に、「捨てられない要素」を満たす条件を渡します。最初に見つかった位置が、残す部分の始まりです。

### 2. 全部捨てられたときの扱い

```ts:line-numbers=25
  if (dropEndIndex === -1) {
    return [];
  }
```

見つからなかった（`-1`）ときは、すべての要素が捨てられたことを意味するので、空の配列を返します。

### 3. 残りを切り出す

```ts:line-numbers=29
  return arr.slice(dropEndIndex);
```

見つかった位置から末尾までを `slice` で取り出します。これが結果です。

## ここがすごい

- **条件の否定で「残す」位置を決める**: 「捨てる」条件を書くだけで、「残す」側の最初の位置を `findIndex` が見つけてくれます。ループの中で状態を持つ必要がありません。
- **見つからないを明示的に扱う**: `-1` の判定を入れているので、全部捨てられた場合を、はっきりと空配列で返せます。
- **1 回の走査で済む**: 位置を探す処理と、切り出す処理に分けても、配列を 2 回読むだけです。
- **条件が一度偽になったら止まる**: `findIndex` は最初の偽で止まります。残りの要素には条件を当てないので、後ろにどんな値があっても影響しません。

## まとめ

- 先頭から条件が真の間だけ捨てるには、「残す」条件の最初の位置を `findIndex` で探す。
- `findIndex` が `-1` を返したら、全部捨てたことになる。
- 条件の否定を使うと、捨てる条件から残す位置を直接求められる。
- 最初に偽になった位置で止まるので、後ろの要素の値は関係ない。
