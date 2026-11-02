---
title: "TypeScript の enum から、逆引きの項目を除いて値だけ取り出す"
description: "zod の getEnumValues は、数値の enum が持つ逆引き（値から名前への対応）を取り除き、本当の値の一覧を返す。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [276, 282]
function: "getEnumValues"
difficulty: 2
format: 2
tags: [型システム, イディオム, データ構造]
---

## ひとことで

`getEnumValues(entries)` は、TypeScript の `enum` の中身から、本当の値だけを一覧にして返す関数です。数値の `enum` は、JavaScript のオブジェクトになったときに、値から名前を引ける逆引きの項目を余分に持ちます。この関数は、その余分な項目を取り除きます。

```ts
enum Color { Red, Green }   // Color は { 0: 'Red', 1: 'Green', Red: 0, Green: 1 }
getEnumValues(Color)        // [0, 1]
```

## コード

```ts:line-numbers=276
export function getEnumValues(entries: EnumLike): EnumValue[] {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries)
    .filter(([k, _]) => numericValues.indexOf(+k) === -1)
    .map(([_, v]) => v);
  return values;
}
```

## 前提知識

- **`enum`**: 名前付きの定数をまとめる TypeScript の仕組みです。`enum Color { Red, Green }` のように書きます。
- **逆引き（リバースマッピング）**: 数値の `enum` は、JavaScript では「値 → 名前」の対応も持ちます。`Color[0]` が `"Red"` になるのはこのためです。
- **`Object.values` と `Object.entries`**: オブジェクトの値の配列や、「キーと値の組」の配列を返す組み込みの関数です。
- **`indexOf`**: 配列の中の値の位置を返します。見つからなければ `-1` です。
- **`+k`**: 文字列を数に変えます。逆引きのキー `"0"` は、`+k` で `0` になります。

## 何をしているか

### 1. 数値の値だけを集める

```ts:line-numbers=277
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
```

オブジェクトの値のうち、数であるものを `numericValues` に入れます。`Color` の場合は `[0, 1]` です。

### 2. 逆引きの項目を除く

```ts:line-numbers=278
  const values = Object.entries(entries)
    .filter(([k, _]) => numericValues.indexOf(+k) === -1)
    .map(([_, v]) => v);
```

キー `k` を数にしたとき、それが数値の値の一覧に入っている項目は、逆引きです。その項目を除外し、残りのキーと値の組だけを残します。

### 3. 値だけを取り出す

```ts:line-numbers=281
  return values;
```

残った組のうち、値だけを `map` で取り出して、結果にします。`Color` では、名前の `Red` と `Green` に対応する `0` と `1` が返ります。

## ここがすごい

- **enum の内部構造を、そのまま利用**: 逆引きの存在を前提に、数値の値とキーを照らし合わせて除く、という考え方です。複雑な型情報を使わずに、実行時の値だけで判断しています。
- **名前ではなく値を返す**: 結果は、利用者が入力として使う値の一覧です。スキーマの候補を作るときに、そのまま使えます。
- **文字列の enum にも安全**: 文字列の `enum` には逆引きがないので、除外される項目はありません。同じ関数で両方を扱えます。
- **読みやすい 3 段階**: 集める、除く、取り出す、の 3 つに分かれているので、何をしているかがすぐ分かります。

## まとめ

- 数値の `enum` は、値から名前への逆引きを余分に持つ。
- 数値の値とキーを比べれば、逆引きの項目を見分けて除ける。
- 実行時の値だけで判断できるので、型の複雑さに頼らずに済む。
- 処理を「集める・除く・取り出す」に分けると、読み手が流れを追いやすい。
