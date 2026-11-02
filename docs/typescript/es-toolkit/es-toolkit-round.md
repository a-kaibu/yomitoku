---
title: "小数点以下の桁数を指定して四捨五入する"
description: "es-toolkit の round。10 の桁数乗を掛けて Math.round で整数にし、また割り戻す。桁数が整数でないときはエラーにする。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/round.ts
lines: [18, 24]
function: "round"
difficulty: 2
format: 2
tags: [数値計算, イディオム, 防御的プログラミング]
---

## ひとことで

`round(value, precision)` は、数を小数点以下 `precision` 桁で四捨五入する関数です。`round(3.14159, 2)` は `3.14` を返します。`precision` を省略すると、整数に四捨五入します。`Math.round` は小数点以下の桁を指定できないので、その隙間を埋める関数です。

```ts
round(3.14159, 2)  // 3.14
round(1234.5, -2)  // 1200（負の桁数なら、百の位で四捨五入）
round(2.5)         // 3
```

## コード

```ts:line-numbers=18
export function round(value: number, precision = 0): number {
  if (!Number.isInteger(precision)) {
    throw new Error('Precision must be an integer.');
  }
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}
```

## 前提知識

- **`Math.round`**: 小数を最も近い整数に四捨五入する組み込み関数です。`Math.round(2.5)` は `3` です。
- **`Math.pow(10, n)`**: 10 の `n` 乗を返します。`Math.pow(10, 2)` は `100` です。`**` 演算子でも同じ計算ができます。
- **桁の移動**: 数に 10 の累乗を掛けると、小数点の位置が右にずれます。割ると左にずれます。この性質を使うと、桁の単位で処理できます。
- **`Number.isInteger`**: 整数かどうかを判定します。

## 何をしているか

### 1. 桁数が整数かを確かめる

```ts:line-numbers=19
  if (!Number.isInteger(precision)) {
    throw new Error('Precision must be an integer.');
  }
```

`precision` が `1.5` のような小数だと、10 の何乗かが決まらないので、エラーにします。

### 2. 桁を整数の位置に移す

```ts:line-numbers=22
  const multiplier = Math.pow(10, precision);
```

`Math.pow(10, precision)` は、桁数に応じた倍率です。2 桁なら `100` です。

### 3. 四捨五入して、元の桁に戻す

```ts:line-numbers=23
  return Math.round(value * multiplier) / multiplier;
```

`value * multiplier` で、残したい桁を整数の位置に移します。`Math.round` で整数にしたあと、同じ倍率で割って元の桁に戻します。

## ここがすごい

- **既存の関数の隙間を埋める**: `Math.round` は整数しか扱えません。桁の倍率を掛けたり割ったりする 1 行で、任意の桁に広げています。
- **負の桁数も同じ式で扱える**: `precision` が負なら、倍率が `0.01` などの小さい数になり、百の位や十の位で四捨五入できます。
- **引数の検査が 1 つだけ**: 桁数が整数であることを確かめれば、倍率の計算が安全になります。
- **注意点**: 小数の計算には誤差が入るため、`1.005` のような値は、期待と違う結果になることがあります。この関数は簡潔さを優先しており、厳密な金額計算には別の方法が必要です。

## まとめ

- 指定した桁で四捨五入するには、倍率を掛けて `Math.round` し、割って戻す。
- 桁数は整数でなければならないので、先に検査する。
- 倍率の考え方は、負の桁数にもそのまま使える。
- 浮動小数点の誤差は残るので、金額などの厳密な計算には注意が要る。
