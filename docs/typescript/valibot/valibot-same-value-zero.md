---
title: "NaN を自分と等しいとみなす比較の数式"
description: "valibot の _isSameValueZero。=== では NaN が NaN と等しくならないので、その 1 点だけを足して、配列の検索などで使える比較にしている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_isSameValueZero/_isSameValueZero.ts
lines: [13, 15]
function: "_isSameValueZero"
difficulty: 1
format: 2
tags: [型システム, 防御的プログラミング, イディオム]
---

## ひとことで

`_isSameValueZero(value1, value2)` は、2 つの値が「同じ」かを判定する関数です。JavaScript の `===` と同じですが、**`NaN` 同士を等しいとみなす** 点だけが違います。valibot では、値が同じかどうかを調べる必要がある場面で使われています。

```ts
_isSameValueZero(1, 1)            // true
_isSameValueZero(NaN, NaN)        // true（=== なら false）
_isSameValueZero(0, -0)           // true（=== と同じ）
```

## コード

```ts:line-numbers=13
export function _isSameValueZero(value1: unknown, value2: unknown): boolean {
  return value1 === value2 || (Number.isNaN(value1) && Number.isNaN(value2));
}
```

## 前提知識

- **`===`（厳密等価）**: 2 つの値が同じかを調べる演算子です。`NaN === NaN` は `false` になります。
- **`NaN`**: 「数ではない」ことを表す特別な数です。計算が失敗したときなどに出てきます。
- **`Number.isNaN(x)`**: `x` が `NaN` なら `true` を返します。`isNaN` と違い、数字以外の値に対しては `false` を返すので、より厳密です。
- **`||`（または）と `&&`（かつ）**: 左が真なら右を見ずに真を返すのが `||`、両方が真のときだけ真になるのが `&&` です。

## 何をしているか

### 1. 普通の比較を先に行う

```ts:line-numbers=14
  return value1 === value2 || (Number.isNaN(value1) && Number.isNaN(value2));
```

まず `value1 === value2` を調べます。これで、ほとんどの値（数、文字列、同じオブジェクトなど）は判定できます。`||` の左側が `true` なら、右側は評価されません。

### 2. `NaN` 同士だけを特別扱いする

同じ行の `(Number.isNaN(value1) && Number.isNaN(value2))` の部分です。`===` で等しくなかった場合でも、両方が `NaN` なら、同じ値として扱います。片方だけが `NaN` なら `false` になります。

## ここがすごい

- **1 行で「=== + NaN の例外」を表している**: 数学で `NaN` を扱うと、自分と比べても等しくならず、検索や重複の判定で困ることがあります。その 1 点だけを補っています。
- **`Number.isNaN` を使う理由**: グローバルの `isNaN` は、数字でない値を先に数に変えてから判定するため、`isNaN("abc")` が `true` になります。`Number.isNaN` は変換をせず、本当に `NaN` のときだけ `true` にします。
- **`SameValueZero` という名前の由来**: JavaScript の `Array.prototype.includes` や `Map` のキーで使われる比較と同じ規則です。valibot の中でも、その規則に合わせて比べられるようになっています。
- **`0` と `-0` は区別しない**: 名前にある「Zero」の通り、`0` と `-0` は `===` と同じく等しいとみなします。`Object.is` とは違う点です。

## まとめ

- `===` は `NaN` を自分と等しいとみなさない。
- `||` で普通の比較を先に行い、`NaN` の場合だけを足すと、同じ規則を短く書ける。
- `Number.isNaN` は変換をしないので、`isNaN` より厳密に判定できる。
- `SameValueZero` は、`includes` や `Map` の比較規則として覚えておくと便利。
