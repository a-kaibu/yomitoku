---
title: "Map に値が無ければ作って入れ、同じ値を返す"
description: "TypeScript コンパイラの getOrUpdate。Map の中にキーがあればその値を返し、無ければコールバックで作って入れてから返す。メモ化の基本の形。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [519, 526]
function: "getOrUpdate"
difficulty: 1
format: 2
tags: [キャッシュ, ハッシュ, メモリ管理]
---

## ひとことで

`getOrUpdate(map, key, callback)` は、`Map` からキーの値を取り出します。まだ無ければ、`callback` で値を作って `Map` に入れ、その値を返す関数です。「ある値を一度だけ作って、次からは使い回す」という、キャッシュの最も基本的な形です。

```ts
const cache = new Map<string, number>()
getOrUpdate(cache, 'a', () => 1)  // 1（作って入れる）
getOrUpdate(cache, 'a', () => 2)  // 1（既にあるので、作らずに返す）
```

## コード

```ts:line-numbers=519
export function getOrUpdate<K, V>(map: Map<K, V>, key: K, callback: () => V): V {
    if (map.has(key)) {
        return map.get(key)!;
    }
    const value = callback();
    map.set(key, value);
    return value;
}
```

## 前提知識

- **`Map`**: キーと値の組を覚える、組み込みのコレクションです。`map.has(key)`、`map.get(key)`、`map.set(key, value)` で扱います。
- **コールバックの遅延実行**: 値を作る関数を渡しておき、本当に必要になったときだけ呼ぶ仕組みです。無駄な計算を避けられます。
- **非 null の表明 `!`**: `map.get(key)!` は、値が `undefined` ではないと開発者が保証する書き方です。`has` で確かめた後なので、安全です。
- **キャッシュ**: 一度計算した結果を覚えておき、同じ計算を繰り返さない仕組みです。

## 何をしているか

### 1. 既にあれば、そのまま返す

```ts:line-numbers=520
    if (map.has(key)) {
        return map.get(key)!;
    }
```

`has` でキーがあるかを確かめ、あれば `get` で値を取り出して返します。作り直しはしません。

### 2. 無ければ作って入れる

```ts:line-numbers=523
    const value = callback();
    map.set(key, value);
    return value;
```

`callback()` で値を作り、`set` で `Map` に入れてから返します。次に同じキーで呼ばれたときは、1 の分岐で返されます。

## ここがすごい

- **作る処理を遅らせる**: 値を作る関数を渡すので、キーがあるときは、その計算がまったく走りません。無駄な計算を省けます。
- **呼び出し側が簡潔**: 「あれば使い、無ければ作る」という定型の処理を、1 行で呼べます。キャッシュの書き方が、どこでも同じになります。
- **`has` と `get` の 2 回の確認**: 「値が `undefined` かどうか」で判定すると、値そのものが `undefined` の場合に誤ります。キーの存在で判定するので、その誤りを避けています。
- **メモ化の土台**: コンパイラの中では、同じファイルの解析結果などを覚えるために使われています。仕組みは単純ですが、多くの場所で効きます。

## まとめ

- 「あれば取り出し、無ければ作る」は、`has` で確かめてから `set` するのが正確。
- 値を作る処理は、コールバックにして必要なときだけ呼ぶと無駄が減る。
- キーの有無で判定すると、値が `undefined` のときの誤りを避けられる。
- 単純な仕組みのキャッシュは、コンパイラのような大きなプログラムでも効果が大きい。
