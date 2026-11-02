---
title: "同じ鍵の要素を、オブジェクトの同じ欄にまとめる"
description: "es-toolkit の groupBy。各要素に鍵を付けて、同じ鍵の要素を配列にまとめる。Object.hasOwn で、キーの存在を確かめてから配列を作っている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/groupBy.ts
lines: [39, 57]
function: "groupBy"
difficulty: 2
format: 2
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`groupBy(arr, getKeyFromItem)` は、配列の要素を「鍵」ごとに分けて、オブジェクトにまとめる関数です。鍵は、各要素を受け取る関数が決めます。たとえば、人のリストを年齢で分けると、年齢ごとに人の配列がまとまります。

```ts
groupBy(['apple', 'avocado', 'banana'], (s) => s[0])
// { a: ['apple', 'avocado'], b: ['banana'] }
```

## コード

```ts:line-numbers=39
export function groupBy<T, K extends PropertyKey>(
  arr: readonly T[],
  getKeyFromItem: (item: T, index: number, array: readonly T[]) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const key = getKeyFromItem(item, i, arr);

    if (!Object.hasOwn(result, key)) {
      result[key] = [];
    }

    result[key].push(item);
  }

  return result;
}
```

## 前提知識

- **鍵（キー）**: オブジェクトの欄の名前です。`{ a: [...] }` の `a` がキーです。
- **`Object.hasOwn(obj, key)`**: オブジェクトが、そのキーを自分で持っているかを判定します。
- **`push`**: 配列の末尾に要素を追加するメソッドです。
- **`{} as Record<K, T[]>`**: 空のオブジェクトを、キーと配列の対応として扱う型にする書き方です。
- **`PropertyKey`**: オブジェクトのキーに使える型（文字列、数、Symbol）をまとめた型です。

## 何をしているか

### 1. 空の結果を用意する

```ts:line-numbers=43
  const result = {} as Record<K, T[]>;
```

まだ何もまとまっていない、空のオブジェクトを作ります。

### 2. 各要素の鍵を求める

```ts:line-numbers=46
    const item = arr[i];
    const key = getKeyFromItem(item, i, arr);
```

要素を 1 つずつ取り出し、鍵を決める関数に渡します。鍵の値は、要素の位置や配列全体も使って決められます。

### 3. 鍵がなければ配列を作り、要素を入れる

```ts:line-numbers=49
    if (!Object.hasOwn(result, key)) {
      result[key] = [];
    }

    result[key].push(item);
```

その鍵の欄がまだ無ければ、空の配列を作ります。そのうえで、要素を `push` で入れます。同じ鍵が来るたびに、同じ配列に足されていきます。

## ここがすごい

- **鍵の存在を先に確かめる**: `Object.hasOwn` で、そのキーがオブジェクトの自分の持ち物かを判定してから、配列を作ります。継承されたプロパティ（`toString` など）と衝突しません。
- **一度の走査で完了する**: 要素を 1 回ずつ見るだけで、すべての鍵の配列が揃います。並べ替えを先にする方法より、ずっと軽い処理です。
- **鍵の決め方を呼び出し側に任せる**: 関数の引数として鍵を決める関数を受け取るので、年齢でも名前の頭文字でも、同じ関数で扱えます。
- **型で結果の形を示す**: `Record<K, T[]>` の型により、鍵の種類と値の型が、呼び出し側でも分かります。

## まとめ

- 要素を鍵ごとにまとめるには、オブジェクトを作り、鍵がなければ配列を用意して `push` する。
- キーの存在は `Object.hasOwn` で確かめると、継承されたプロパティと混ざらない。
- 鍵を決める処理を引数にすると、同じ関数で色々な分け方ができる。
- 型の指定で、鍵と値の対応を明示すると、読む人にも伝わりやすい。
