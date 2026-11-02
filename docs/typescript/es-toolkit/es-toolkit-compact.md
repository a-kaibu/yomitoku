---
title: "配列から、偽になる値を取り除く"
description: "es-toolkit の compact は、配列から false や 0、空文字列、null、undefined などの偽の値を取り除く。値を一つずつ確かめて、真の値だけを新しい配列に集める。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/compact.ts
lines: [14, 25]
function: "compact"
difficulty: 1
format: 2
tags: [データ構造, 型システム]
---

## ひとことで

`compact(arr)` は、配列から「偽（falsy）」な値を取り除いた新しい配列を返す関数です。偽の値には、`false`、`0`、空文字列、`null`、`undefined`、`NaN` があります。

```ts
compact([0, 1, false, 2, '', 3])  // [1, 2, 3]
```

## コード

```ts:line-numbers=14
export function compact<T>(arr: readonly T[]): Array<NotFalsey<T>> {
  const result: Array<NotFalsey<T>> = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item) {
      result.push(item as NotFalsey<T>);
    }
  }

  return result;
}
```

## 前提知識

- **真と偽**: JavaScript では、`if` の中で値を調べると、真（truthy）か偽（falsy）のどちらかとして扱われます。偽になるのは、前に挙げた数種類の値です。
- **型の除外**: `NotFalsey<T>` は、偽になり得る型を取り除いた型です。戻り値の型で、結果に偽の値が残らないことを示します。
- **新しい配列**: 元の配列を変えず、残すものだけを集めた配列を作ります。

## 何をしているか

### 1. 空の配列を用意する

```ts:line-numbers=15
  const result: Array<NotFalsey<T>> = [];
```

真の値だけを集める入れ物です。型は、偽を除いた型の配列として宣言されています。

### 2. 一つずつ確かめて集める

```ts:line-numbers=17
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item) {
      result.push(item as NotFalsey<T>);
    }
  }
```

要素を先頭から順に取り出し、`if (item)` で真かどうかを確かめます。真のものだけを `result` に入れます。

### 3. 結果を返す

```ts:line-numbers=24
  return result;
```

集めた配列を返します。

## ここがすごい

- **真偽の判定を一つにまとめる**: `if (item)` の一行で、偽になる値をすべて判定できます。
- **型の上でも偽を除く**: `NotFalsey<T>` を戻り値に使うので、呼び出し側は偽の値の心配をせずに済みます。
- **元を変えない**: 新しい配列を作るので、元の配列はそのまま残ります。

### 注意点

- `0` や空文字列も取り除かれます。数や文字列を残したい場合は、この関数の対象にならないことに注意が必要です。

## まとめ

- `compact` は、配列から偽の値を取り除いた新しい配列を返す。
- `if (item)` で一つずつ確かめ、真の値だけを集める。
- 戻り値の型で、偽の値が残らないことを示す。
