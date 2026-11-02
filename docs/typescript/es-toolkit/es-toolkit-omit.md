---
title: "指定したキーを除いて、新しいオブジェクトを作る"
description: "es-toolkit の omit は、指定したキーを除いた新しいオブジェクトを作る。まず全体をコピーしてから削除する、単純で読みやすい作りになっている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/omit.ts
lines: [18, 27]
function: "omit"
difficulty: 1
format: 2
tags: [イディオム, データ構造]
---

## ひとことで

`omit(obj, keys)` は、指定したキーを取り除いた新しいオブジェクトを返す関数です。元のオブジェクトは変わりません。

```ts
omit({ a: 1, b: 2, c: 3 }, ['b'])  // { a: 1, c: 3 }
```

## コード

```ts:line-numbers=18
export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...obj };

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    delete result[key];
  }

  return result as Omit<T, K>;
}
```

## 前提知識

- **スプレッド構文 `...`**: オブジェクトの中身を、すべて新しいオブジェクトに展開する書き方です。
- **`delete`**: オブジェクトから、あるキーを消す演算子です。
- **浅いコピー**: 1 段目のキーと値だけを新しくコピーし、中にある入れ子のオブジェクトは同じものを共有する形のコピーです。

## 何をしているか

### 1. 全体をコピーする

```ts:line-numbers=19
  const result = { ...obj };
```

元のオブジェクトの中身を、新しいオブジェクトにすべて写します。これで、後で消しても元は変わりません。

### 2. 指定されたキーを消す

```ts:line-numbers=21
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    delete result[key];
  }
```

除きたいキーを 1 つずつ `delete` で消します。

## ここがすごい

- **元を変えない**: 最初にコピーするので、呼び出し元のデータを壊しません。
- **書き方が単純**: コピーして消すだけなので、何が起きているかが一目で分かります。`pick` と対になる関数として、同じ形で書かれています。
- **型で結果が絞られる**: 戻り値は `Omit<T, K>` なので、消したキーは型の上でも使えなくなります。

## まとめ

- `omit` は、指定したキーを除いた新しいオブジェクトを作る。
- まず全体をコピーし、そこから必要なキーを消す。
- 元のオブジェクトは変わらず、型でも消したキーが外れる。
