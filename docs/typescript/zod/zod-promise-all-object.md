---
title: "オブジェクトの値になった Promise を、キーを保ったまま待つ"
description: "値が Promise のオブジェクトを受け取り、すべて解決したあとに同じキーを持つオブジェクトを返す promiseAllObject。Promise.all は配列しか扱えないので、キーと結果の対応を保つ工夫をしている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [474, 485]
function: "promiseAllObject"
difficulty: 2
format: 2
tags: [非同期, 設計パターン, イディオム]
---

## ひとことで

`promiseAllObject(obj)` は、値がすべて Promise のオブジェクトを受け取り、それらがすべて完了するのを待ってから、**同じキーを持つ値だけのオブジェクト** を返します。

```ts
const user = await promiseAllObject({
  name: fetchName(),
  age: fetchAge(),
})
// user = { name: '...', age: 30 }
```

`Promise.all` は配列しか受け取れません。キーの名前を持ったまま複数の非同期処理を待ちたいときに、この関数を使います。

## コード

```ts:line-numbers=474
export function promiseAllObject<T extends object>(promisesObj: T): Promise<{ [k in keyof T]: Awaited<T[k]> }> {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => (promisesObj as any)[key]);

  return Promise.all(promises).then((results) => {
    const resolvedObj: any = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]!] = results[i];
    }
    return resolvedObj;
  });
}
```

## 前提知識

- **Promise**: あとで結果が届く値です。`await` で完了を待てます。
- **`Promise.all(配列)`**: 配列の Promise をすべて待ち、結果を同じ順番の配列で返します。
- **`Awaited<T>`**: Promise の中の値の型を取り出す型です。
- **`Object.keys`**: オブジェクトのキーを配列で返します。

## 何をしているか

### 1. キーと Promise を別々の配列に分ける

```ts:line-numbers=475
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => (promisesObj as any)[key]);
```

キーの配列と、対応する Promise の配列を作ります。両方の順番は、同じキーの位置で揃っています。

### 2. まとめて待つ

```ts:line-numbers=478
  return Promise.all(promises).then((results) => {
```

`Promise.all` で、すべての Promise の完了を待ちます。結果は、配列の順番と同じ順番で届きます。

### 3. 結果を元のキーに戻す

```ts:line-numbers=479
    const resolvedObj: any = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]!] = results[i];
    }
    return resolvedObj;
```

結果の配列を、先ほどのキーの順番で読み出し、同じキーを持つオブジェクトに組み直します。

## ここがすごい

- **キーの順番を利用する**: `Object.keys` で作ったキーの並びと、`map` で作った Promise の並びは、同じ位置で対応しています。その対応を使うことで、キーの名前を Promise と一緒に運ぶ必要がありません。
- **並列に待つ**: `await` を 1 つずつ書くと、順番に待つことになります。`Promise.all` に渡すことで、すべての処理が同時に進みます。
- **型の正確さ**: 戻り値の型で、各キーの値が `Awaited` された型になるので、呼び出し側で値の型をそのまま使えます。

## まとめ

- 非同期の値を名前付きで待つには、キーと Promise の対応を保って `Promise.all` に渡す。
- 結果は、同じ順番でキーに戻す。
- 並列に待つことで、全体の時間が遅い処理の時間で済む。
