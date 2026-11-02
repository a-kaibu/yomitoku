---
title: "配列から指定した値を除いた新しい配列を作る"
description: "es-toolkit の without は、配列から指定した値をすべて除いた新しい配列を返す。実際の仕事を difference に任せ、この関数は引数の形を整えるだけ。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/without.ts
lines: [23, 25]
function: "without"
difficulty: 1
format: 2
tags: [イディオム, データ構造]
---

## ひとことで

`without(array, ...values)` は、配列から指定した値を取り除いた新しい配列を返す関数です。元の配列は変わりません。

```ts
without([1, 2, 3, 2], 2)  // [1, 3]
```

## コード

```ts:line-numbers=23
export function without<T>(array: readonly T[], ...values: T[]): T[] {
  return difference(array, values);
}
```

## 前提知識

- **残余引数 `...values`**: 引数をいくつでも受け取り、1 つの配列にまとめる書き方です。`without(arr, 2, 3)` のように、除きたい値を並べて書けます。
- **差集合**: 片方の配列にあって、もう片方の配列に無い要素の集まりです。`difference` 関数は、この考え方で作られています。
- **新しい配列を返す**: 元の配列を変えず、結果を別の配列として返す設計です。

## 何をしているか

### 1. 差集合の関数に任せる

```ts:line-numbers=23
export function without<T>(array: readonly T[], ...values: T[]): T[] {
  return difference(array, values);
}
```

`values` は残余引数で配列になるので、そのまま `difference` に渡します。`difference` が、元の配列から `values` にあるものを除いて返します。

## ここがすごい

- **引数の書き方が自然**: 除きたい値を、配列ではなく並べて書けるので、呼び出しが読みやすくなっています。
- **仕事を 1 か所に集める**: 差集合の計算を `difference` に任せるので、`without` は引数の形を整えるだけになっています。
- **元の配列を守る**: 結果は新しい配列なので、呼び出し元のデータは影響を受けません。

## まとめ

- `without` は、配列から指定した値を除いた新しい配列を返す。
- 残余引数で、除く値を並べて書けるようにしている。
- 計算は `difference` に任せ、この関数は引数を渡すだけになっている。
