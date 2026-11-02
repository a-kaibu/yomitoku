---
title: "オブジェクトのパターンを、キーごとに再帰で照合する"
description: "ts-pattern の matchPattern のオブジェクト部分。パターンの各キーについて、値が存在するか、または省略可能なパターンかを確かめてから、中身を再帰的に照合する。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [106, 113]
function: "matchPattern（オブジェクトの部分）"
difficulty: 3
format: 2
tags: [再帰, パース, 型システム]
---

## ひとことで

ts-pattern の `matchPattern` は、パターンと値が一致するかを調べる中心の関数です。ここで取り上げるのは、パターンが普通のオブジェクトの場合の処理です。パターンの各キーについて、値がそのキーを持っているか（または省略可能か）を確かめ、その中身を再び `matchPattern` で照合します。

```ts
match({ user: { age: 20 } })
  .with({ user: { age: P.number } }, () => 'ok')  // 'ok'
```

## コード

```ts:line-numbers=106
    return Reflect.ownKeys(pattern).every((k): boolean => {
      const subPattern = pattern[k];

      return (
        (k in value || isOptionalPattern(subPattern)) &&
        matchPattern(subPattern, value[k], select)
      );
    });
```

## 前提知識

- **`Reflect.ownKeys`**: オブジェクトの全てのキー（文字列のキーと Symbol のキーの両方）を配列で返す組み込み関数です。
- **`every`**: 配列の全要素が条件を満たすかを調べるメソッドです。1 つでも満たさなければ `false` です。
- **`k in value`**: キーが値に存在するかを調べる演算子です。継承されたものも含みます。
- **再帰**: 関数が自分自身を、より小さな部分に対して呼ぶことです。ここでは、パターンの中身を同じ関数で照合します。
- **省略可能なパターン**: `P.optional` で書かれたキーは、値に存在しなくても一致とみなします。

## 何をしているか

### 1. パターンの全キーを順に確かめる

```ts:line-numbers=106
    return Reflect.ownKeys(pattern).every((k): boolean => {
      const subPattern = pattern[k];
```

`Reflect.ownKeys(pattern)` で、パターンのキーを全部取り出し、`every` で、すべてのキーが一致するかを調べます。

### 2. キーが存在するか、または省略可能かを確かめる

```ts:line-numbers=109
      return (
        (k in value || isOptionalPattern(subPattern)) &&
```

値がそのキーを持っているか、またはパターンが `P.optional` なら、このキーは通過します。どちらでもなければ、一致しません。

### 3. 中身を再帰的に照合する

```ts:line-numbers=111
        matchPattern(subPattern, value[k], select)
```

キーの値を取り出して、対応するパターンで `matchPattern` を呼びます。入れ子の深さに関係なく、同じ処理が続きます。

## ここがすごい

- **存在と中身を別々に確かめる**: キーが無いことと、値が違うことを、2 段階で判定しています。省略可能なキーの扱いが、ここで自然に決まります。
- **Symbol のキーも対象**: `Object.keys` ではなく `Reflect.ownKeys` を使うので、Symbol で書かれたパターンも照合できます。
- **再帰で任意の深さに対応**: 入れ子のパターンを、1 つの関数の呼び出しの連鎖で扱えます。深さを決める必要がありません。
- **`every` で早く抜ける**: 1 つでも一致しないキーがあれば、残りを調べずに `false` を返します。

## まとめ

- オブジェクトのパターンは、キーごとに存在と中身を確かめる。
- 省略可能なキーは、存在しなくても一致とみなす特別扱いが必要。
- `Reflect.ownKeys` を使うと、Symbol のキーも含めて照合できる。
- 同じ関数を再帰的に呼ぶと、入れ子の構造をそのまま照合できる。
