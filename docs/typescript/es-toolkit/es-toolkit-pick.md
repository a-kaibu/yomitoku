---
title: "指定したキーだけを取り出して、新しいオブジェクトを作る"
description: "es-toolkit の pick は、指定したキーの値だけを持つ新しいオブジェクトを作る。Object.hasOwn で、自分自身が持つキーだけを写す点が要所。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/pick.ts
lines: [18, 30]
function: "pick"
difficulty: 1
format: 2
tags: [イディオム, 防御的プログラミング, データ構造]
---

## ひとことで

`pick(obj, keys)` は、オブジェクトから必要なキーだけを取り出した新しいオブジェクトを返す関数です。元のオブジェクトは変わりません。

```ts
pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])  // { a: 1, c: 3 }
```

## コード

```ts:line-numbers=18
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}
```

## 前提知識

- **オブジェクトのキー**: `{ a: 1 }` の `a` のように、値に付けた名前です。JavaScript では文字列やシンボルで表されます。
- **`Object.hasOwn`**: あるオブジェクトが、継承ではなく自分自身でそのキーを持つかを調べるメソッドです。
- **`Pick<T, K>` 型**: T の中から K のキーだけを残した型です。戻り値の型を、呼び出した人が正しく推測できるように使われています。

## 何をしているか

### 1. 空のオブジェクトを用意する

```ts:line-numbers=19
  const result = {} as Pick<T, K>;
```

結果を入れる入れ物です。型は `Pick` で指定して、後の代入が型に合うようにしています。

### 2. キーを 1 つずつ確かめる

```ts:line-numbers=24
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
```

`obj` が自分で持っているキーだけを写します。`in` ではなく `Object.hasOwn` を使うことで、プロトタイプから継承された値が混ざるのを防いでいます。

## ここがすごい

- **元を変えない**: 新しい `{}` に写すので、呼び出し元のオブジェクトは影響を受けません。
- **存在しないキーを無視する**: 指定したキーが無くても、エラーにならず単に省かれます。
- **型で結果が絞られる**: 戻り値は `Pick<T, K>` なので、取り出したキーだけを使えるように型で保証されます。

## まとめ

- `pick` は、必要なキーだけを持つ新しいオブジェクトを作る。
- 自分のキーだけを見るために `Object.hasOwn` を使う。
- 元のオブジェクトは変わらず、型も指定したキーだけに絞られる。
