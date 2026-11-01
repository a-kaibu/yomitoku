---
title: "型名を前に付けて 1 と \"1\" を別のキーにするメモ化"
description: "引数 1 つの関数の結果をキャッシュする memoizeOne。キーを「型名:値」の文字列にして、数値の 1 と文字列の \"1\" や、undefined と \"undefined\" を区別している。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1907, 1918]
function: "memoizeOne"
difficulty: 2
format: 2
tags: [キャッシュ, ハッシュ, 防御的プログラミング]
---

## ひとことで

`memoizeOne(callback)` は、**引数を 1 つ取る関数** の結果を、引数ごとに覚えておく関数を返します。同じ引数でもう一度呼ばれたら、覚えている結果を返します。

引数は文字列・数値・真偽値・`undefined` のどれかに限られています。結果を保存する `Map` のキーに、**`'number:1'` のように「型名:値」をつなげた文字列** を使っているのがポイントです。

## コード

```ts:line-numbers=1907
export function memoizeOne<A extends string | number | boolean | undefined, T>(callback: (arg: A) => T): (arg: A) => T {
    const map = new Map<string, T>();
    return (arg: A) => {
        const key = `${typeof arg}:${arg}`;
        let value = map.get(key);
        if (value === undefined && !map.has(key)) {
            value = callback(arg);
            map.set(key, value);
        }
        return value!;
    };
}
```

## 前提知識

- **`A extends string | number | boolean | undefined`**: 引数の型 `A` は、この 4 種類のどれかでなければならない、という制約です。オブジェクトは渡せません。
- **`typeof arg`**: 値の種類を `'string'`、`'number'`、`'boolean'`、`'undefined'` などの文字列で返します。
- **テンプレートリテラル**: `` `${a}:${b}` `` は 2 つの値を `:` でつないだ文字列になります。値は文字列に変換されます。
- **`Map`**: キーと値の組を保存するデータ構造です。`get` で取り出し、`has` でキーがあるかを調べます。
- **`value!`**: 「`undefined` ではない」と TypeScript に伝えています。

## 何をしているか

### 処理の流れ


1. 引数から、`型名:値` の形のキーを作ります。

```ts:line-numbers=1910
        const key = `${typeof arg}:${arg}`;
```

2. `Map` からそのキーの値を取り出します。

```ts:line-numbers=1911
        let value = map.get(key);
```

3. 値が `undefined` で、**しかもキー自体が登録されていない** ときだけ、`callback` を実行して保存します。

```ts:line-numbers=1912
        if (value === undefined && !map.has(key)) {
            value = callback(arg);
            map.set(key, value);
        }
```

4. 値を返します。

キーの例です。

```
arg = 1         → 'number:1'
arg = '1'       → 'string:1'
arg = true      → 'boolean:true'
arg = 'true'    → 'string:true'
arg = undefined → 'undefined:undefined'
```

## ここがすごい

- **型が違えば別のキー**: `Map` のキーに引数をそのまま使えば区別はできますが、この関数はキーを文字列にそろえています。そのとき単に `String(arg)` にすると、`1` と `'1'`、`true` と `'true'` が同じキーになってしまいます。先頭に型名を付けるだけで、この衝突が起きなくなります。
- **「結果が `undefined`」も正しくキャッシュ**: `value === undefined && !map.has(key)` という条件がよくできています。`get` だけを見ると、「まだ計算していない」と「計算した結果が `undefined` だった」の区別がつきません。そこで、`get` が `undefined` を返したときだけ `has` で確かめています。値があるときは `get` 1 回で済み、`has` を呼ばないので、よくある場合の速さも保っています。
- **用途を絞って単純に**: 引数をプリミティブ（基本的な値）の 1 つだけに限っているので、キーの作り方を 1 行で書けます。

## まとめ

- 値を文字列のキーにするときは、型名を前に付けると型違いの衝突を防げる。
- `Map#get` が `undefined` を返したら、`has` で「本当に無いのか」を確かめる。
- 使い道を絞ると、汎用の実装よりずっと単純に書ける。
