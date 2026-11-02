---
title: "reduce と ?. で、深いパスの値を安全に取り出す"
description: "オブジェクトの入れ子を、キーの配列で順にたどって値を取り出す getElementAtPath。途中で undefined や null が出ても例外にせず、そこで止まる。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [469, 472]
function: "getElementAtPath"
difficulty: 1
format: 2
tags: [再帰, 防御的プログラミング, イディオム]
---

## ひとことで

`getElementAtPath(obj, path)` は、`obj.a.b[0]` のような **入れ子の値** を、キーの配列 `['a', 'b', 0]` で指定して取り出します。

```ts
getElementAtPath({ a: { b: [10, 20] } }, ['a', 'b', 1])  // 20
getElementAtPath({ a: null }, ['a', 'b'])                 // undefined（例外にはならない）
```

Zod ではエラーの位置（どのフィールドで失敗したか）を、このようなパスで表すため、その場所の値を取り出すときに使われます。

## コード

```ts:line-numbers=469
export function getElementAtPath(obj: any, path: (string | number)[] | null | undefined): any {
  if (!path) return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
```

## 前提知識

- **`reduce`**: 配列の要素を左から 1 つずつ処理し、途中の結果を次に渡しながら 1 つの値にまとめます。
- **オプショナルチェイニング `?.`**: 左側が `null` や `undefined` のとき、エラーにせず `undefined` を返す書き方です。
- **`acc?.[key]`**: 「`acc` が `null` でなければ `acc[key]` を読む」という意味です。
- **`path` の型 `(string | number)[]`**: キーに文字列も数字も使えることを表します。配列の添字は数字です。

## 何をしているか

### 1. パスが無ければ元の値を返す

```ts:line-numbers=470
  if (!path) return obj;
```

パスが `null` や `undefined` なら、何もたどらずに元のオブジェクトを返します。

### 2. キーを 1 つずつたどる

```ts:line-numbers=471
  return path.reduce((acc, key) => acc?.[key], obj);
```

`reduce` の初期値は `obj` です。各キーについて、今の値 `acc` から `acc[key]` を読み、その結果を次の回に渡します。

`{ a: { b: [10, 20] } }` と `['a', 'b', 1]` では、`obj` → `obj.a` → `obj.a.b` → `obj.a.b[1]` と進み、`20` になります。

途中で `null` が出たら、`?.` によってそれ以降はすべて `undefined` になります。

## ここがすごい

- **例外を防ぐ書き方が 1 行に収まる**: `obj.a.b` のような直接の書き方だと、途中の `a` が `null` のとき例外が出ます。`?.` を使うと、「たどれなければ `undefined`」という判定を、各段で自動的に行えます。
- **パスを値として扱える**: キーの配列はただのデータなので、エラーの位置を保存したり、別の場所に渡したりできます。
- **`reduce` の形が意図を表す**: 「1 段ずつ降りていく」という処理が、`reduce` の 1 行で読めます。

## まとめ

- 入れ子の値は、キーの配列でパスとして表すと扱いやすい。
- `?.` を `reduce` の中で使うと、途中で止まる探索が簡単に書ける。
- パスをデータとして持つと、エラーの場所を後から伝えられる。
