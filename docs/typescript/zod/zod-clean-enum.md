---
title: "TypeScript の enum から、数字の逆引きキーを外す"
description: "TypeScript の enum をオブジェクトにすると、値から名前を引ける逆引きのキーが混ざる。cleanEnum は、キーが数字として読めないものだけを残して値の一覧を作る。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1079, 1086]
function: "cleanEnum"
difficulty: 2
format: 2
tags: [型システム, データ構造, イディオム]
---

## ひとことで

`cleanEnum(obj)` は、TypeScript の `enum` を変換したオブジェクトから、**本当の値の一覧** だけを取り出します。

```ts
enum Color { Red, Green }
// Color は { Red: 0, Green: 1, 0: 'Red', 1: 'Green' } という形になる
cleanEnum(Color) // ['Red', 'Green'] の値 0, 1 ではなく、値の一覧
```

数値の `enum` は、値から名前を引けるように、数字のキーの逆引きも持ちます。Zod では、その逆引きを除いた値だけを、選択肢として扱います。

## コード

::: code-group

```ts:line-numbers=1079 [日本語訳]
export function cleanEnum(obj: Record<string, EnumValue>): EnumValue[] {
  return Object.entries(obj)
    .filter(([k, _]) => {
      // // NaN を返すなら数字ではないので、文字列のキー
      return Number.isNaN(Number.parseInt(k, 10));
    })
    .map((el) => el[1]);
}
```

```ts:line-numbers=1079 [原文]
export function cleanEnum(obj: Record<string, EnumValue>): EnumValue[] {
  return Object.entries(obj)
    .filter(([k, _]) => {
      // return true if NaN, meaning it's not a number, thus a string key
      return Number.isNaN(Number.parseInt(k, 10));
    })
    .map((el) => el[1]);
}
```

:::

## 前提知識

- **`enum`**: 名前付きの定数の集まりを作る TypeScript の機能です。数値の `enum` は、JavaScript のオブジェクトに変換されます。
- **逆引き**: `Color[0]` で `'Red'` が得られるように、値から名前を引けるキーです。
- **`Object.entries(obj)`**: キーと値の組を配列で返します。
- **`Number.parseInt(k, 10)`**: 文字列を 10 進数の整数に変えます。数字として読めなければ `NaN` になります。
- **`Number.isNaN`**: 値が `NaN` かを調べます。

## 何をしているか

### 1. 組を取り出す

```ts:line-numbers=1080
  return Object.entries(obj)
```

オブジェクトのキーと値の組を、配列にして取り出します。

### 2. 数字のキーを除く

```ts:line-numbers=1081
    .filter(([k, _]) => {
      // return true if NaN, meaning it's not a number, thus a string key
      return Number.isNaN(Number.parseInt(k, 10));
    })
```

キーを整数に変えて、`NaN` になるもの（数字として読めないキー）だけを残します。逆引きのキーは `'0'` や `'1'` のような数字なので、ここで外れます。

### 3. 値だけを返す

```ts:line-numbers=1085
    .map((el) => el[1]);
```

残った組から、値の部分だけを取り出します。

## ここがすごい

- **名前の判定を逆に使う**: 「数字かどうか」で逆引きを見分けるので、enum の定義を読まなくても、どんな enum にも同じ処理が使えます。
- **値の並びは元の順番を保つ**: `Object.entries` の順番を変えないので、選択肢の表示順が定義と同じになります。
- **文字列の値を持つ enum にも対応**: 文字列の enum には逆引きがありません。その場合は、すべてのキーが数字として読めないので、そのまま残ります。

## まとめ

- TypeScript の数値 enum には、逆引きの数字のキーが混ざる。
- キーを数字に変えて `NaN` かどうかで、逆引きだけを外せる。
- 型の仕組みと実際のオブジェクトの形の違いを、関数で吸収できる。
