---
title: "オブジェクトに自分の値として、属性を定義し直す"
description: "zod の own は、オブジェクトに自分自身の値として属性を定義し直す。継承されていた属性を、インスタンスの上で上書きするための小さな関数。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1159, 1162]
function: "own"
difficulty: 2
format: 2
tags: [データ構造, 設計パターン]
---

## ひとことで

`own(inst, key, value, enumerable)` は、オブジェクトに自分自身の属性として値を定義し、その値を返す関数です。プロトタイプ（継承元）に同じ名前の属性があっても、インスタンスの側で上書きできます。

```ts
const obj = own({}, 'name', 'zod')  // obj.name は 'zod'
```

## コード

```ts:line-numbers=1159
export function own<T>(inst: object, key: PropertyKey, value: T, enumerable = true): T {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
```

## 前提知識

- **プロトタイプ（継承元）**: オブジェクトが、属性を借りてくる別のオブジェクトです。インスタンスに属性が無いと、継承元の値が使われます。
- **`Object.defineProperty`**: 属性の値と、書き込みや列挙などの性質を細かく指定して定義するメソッドです。
- **列挙可能（enumerable）**: `Object.keys` などで、その属性が一覧に出るかどうかの性質です。

## 何をしているか

### 1. 属性を定義し直す

```ts:line-numbers=1160
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
```

`inst` に、`key` という名前で `value` を持つ属性を定義します。`configurable` と `writable` を `true` にしているので、後からも変更や削除ができます。`enumerable` は引数で受け取るので、呼び出す側が一覧に出すかを決められます。

### 2. 値を返す

```ts:line-numbers=1161
  return value;
```

定義した値をそのまま返します。呼び出す側は、同じ値を変数に入れてすぐに使えます。

## ここがすごい

- **継承を上書きする**: 継承元の属性を、インスタンスの自分の値で隠せます。
- **性質を指定できる**: 列挙の有無を引数で決められるので、同じ関数を用途に応じて使い分けられます。
- **値を返す**: 定義と同時に値が手に入るので、`own(...)` を式の中で書けます。

## まとめ

- `own` は、オブジェクトに自分の値として属性を定義し、その値を返す。
- 継承元の同じ名前の属性を、インスタンスの側で隠せる。
- 列挙の有無を引数で決められる。
