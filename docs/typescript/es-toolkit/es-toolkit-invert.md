---
title: "値とキーを入れ替えて、逆引きのオブジェクトを作る"
description: "es-toolkit の invert。オブジェクトのキーと値を入れ替える。値が同じ項目が複数あると、後に出てきたキーが勝つ。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/invert.ts
lines: [19, 30]
function: "invert"
difficulty: 1
format: 2
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`invert(obj)` は、オブジェクトのキーと値を入れ替えた新しいオブジェクトを返す関数です。`{ a: 'x', b: 'y' }` は `{ x: 'a', y: 'b' }` になります。値から元のキーを引きたいときに便利です。

```ts
invert({ a: 'x', b: 'y' })  // { x: 'a', y: 'b' }
invert({ a: 1, b: 1 })      // { 1: 'b' }（同じ値は後のキーで上書きされる）
```

## コード

```ts:line-numbers=19
export function invert<K extends PropertyKey, V extends PropertyKey>(obj: Record<K, V>): Record<V, K> {
  const result = {} as Record<V, K>;

  const keys = Object.keys(obj) as K[];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    result[value] = key;
  }

  return result;
```

## 前提知識

- **キーと値の制約**: オブジェクトのキーになれるのは、文字列・数・Symbol（`PropertyKey`）だけです。そのため、値も `PropertyKey` である必要があります。
- **`Object.keys`**: オブジェクトのキーを配列で返す関数です。
- **`as K[]`**: `Object.keys` の戻り値を、キーの型として扱うための書き方です。実行時には何もしません。
- **上書き**: 同じキーに別の値を入れると、後の値で置き換わります。オブジェクトの仕組みとして、重複は残りません。

## 何をしているか

### 1. 空の結果と、キーの一覧を用意する

```ts:line-numbers=20
  const result = {} as Record<V, K>;

  const keys = Object.keys(obj) as K[];
```

入れ替えた結果を入れる空のオブジェクトを作り、元のキーの一覧を取り出します。

### 2. 値を新しいキーにし、キーを新しい値にする

```ts:line-numbers=24
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    result[value] = key;
  }
```

キーごとに、元の値 `value` を新しいキーにして、元のキー `key` を値として入れます。

## ここがすごい

- **入れ替えの 1 行**: `result[value] = key` の 1 行が、入れ替えの本体です。複雑な変換がありません。
- **重複の扱いが素直**: 同じ値が複数あると、後に来たキーで上書きされます。エラーにせず、規則が一つに決まっています。
- **型で制約を表す**: `PropertyKey` の制約により、値をキーに使える型だけに限定しています。型の段階で、無効な入れ替えを防いでいます。
- **元のデータを変えない**: 新しいオブジェクトを作るので、入力のオブジェクトはそのまま残ります。

## まとめ

- キーと値の入れ替えは、「値を新しいキーに、キーを新しい値に」で書ける。
- 値が重複すると、後に出たキーが残る。この規則を知っておくと、結果を予測しやすい。
- キーになれる型の制約を型で示すと、誤った入れ替えを防げる。
- 元のオブジェクトを変えない設計は、ほかのユーティリティ関数とそろう。
