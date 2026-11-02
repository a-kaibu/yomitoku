---
title: "オブジェクトの値だけを変えた、新しいオブジェクトを作る"
description: "es-toolkit の mapValues。キーは変えずに、各値を関数で変換した新しいオブジェクトを作る。元のオブジェクトは書き換えない。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/mapValues.ts
lines: [19, 34]
function: "mapValues"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`mapValues(object, getNewValue)` は、オブジェクトの各値を関数で変換し、キーはそのままの新しいオブジェクトを返す関数です。たとえば、価格のオブジェクトの値をすべて税込みにするときに使えます。元のオブジェクトは変わりません。

```ts
mapValues({ a: 1, b: 2 }, (v) => v * 10)  // { a: 10, b: 20 }
```

## コード

```ts:line-numbers=19
export function mapValues<T extends object, K extends keyof T, V>(
  object: T,
  getNewValue: (value: T[K], key: K, object: T) => V
): Record<K, V> {
  const result = {} as Record<K, V>;
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as K;
    const value = object[key];

    result[key] = getNewValue(value, key, object);
  }

  return result;
}
```

## 前提知識

- **ジェネリクス `<T, K, V>`**: 引数や戻り値の型を、呼び出しごとに決める書き方です。`T` は元のオブジェクト、`K` はキー、`V` は新しい値の型です。
- **`keyof T`**: オブジェクトの型 `T` のキーの型を表します。
- **`Object.keys`**: オブジェクトのキーを配列にして返します。
- **`Record<K, V>`**: キーが `K`、値が `V` のオブジェクトの型です。
- **変換関数の引数**: `(値, キー, 元のオブジェクト)` の 3 つを渡すので、変換に必要な情報を使えます。

## 何をしているか

### 1. 結果の入れ物を用意する

```ts:line-numbers=23
  const result = {} as Record<K, V>;
  const keys = Object.keys(object);
```

空のオブジェクトを作り、元のオブジェクトのキーの一覧を取り出します。

### 2. キーごとに値を変換する

```ts:line-numbers=26
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as K;
    const value = object[key];

    result[key] = getNewValue(value, key, object);
```

キーを 1 つずつ取り出し、その値を関数に渡します。返ってきた値を、同じキーで結果に入れます。

### 3. 結果を返す

```ts:line-numbers=33
  return result;
```

すべてのキーの変換が終わった結果を返します。

## ここがすごい

- **元のデータを汚さない**: 新しいオブジェクトに結果を入れるので、呼び出し元の値は変わりません。Redux などの状態管理と相性がよい書き方です。
- **キーを変えない約束**: キーはそのまま使うので、変換後も同じ名前で値を取り出せます。キーの変換が必要な場合は、別の関数（`mapKeys`）を使い分けます。
- **変換関数に文脈を渡す**: キーや元のオブジェクトも渡すので、値の計算に他の情報が必要なときも同じ関数で済みます。
- **`Object.keys` に限る**: 継承されたプロパティは対象外です。自分のキーだけを変換するという、明確な範囲になっています。

## まとめ

- 値だけを変えた新しいオブジェクトは、キーを回して結果に入れると作れる。
- 元のオブジェクトを変えないので、安全に使い回せる。
- 変換関数に、値・キー・元のオブジェクトを渡すと、表現力が増す。
- キーを変える処理と値を変える処理は、役割を分けておくと理解しやすい。
