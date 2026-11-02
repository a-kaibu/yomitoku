---
title: "数を上限と下限の間に収める。片方だけの指定もできる"
description: "es-toolkit の clamp。値を最小値と最大値の範囲に収める。上限だけを渡すと、下限なしで上から押さえる。引数の数で動きを切り替えている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/clamp.ts
lines: [50, 56]
function: "clamp"
difficulty: 1
format: 2
tags: [数値計算, イディオム, 型システム]
---

## ひとことで

`clamp(value, bound1, bound2?)` は、数 `value` を、指定した範囲の中に収めた値を返す関数です。範囲の両端を 2 つ渡すと、その間に収めます。端を 1 つだけ渡すと、その値を上限として扱います。たとえば、音量を 0 から 100 の間に収めたいときに使えます。

```ts
clamp(150, 0, 100)  // 100（上限を超えた分は切り捨てる）
clamp(-5, 0, 100)   // 0（下限より小さければ持ち上げる）
clamp(7, 10)        // 7（上限 10 を超えていないので、そのまま）
```

## コード

```ts:line-numbers=50
export function clamp(value: number, bound1: number, bound2?: number): number {
  if (bound2 == null) {
    return Math.min(value, bound1);
  }

  return Math.min(Math.max(value, bound1), bound2);
}
```

## 前提知識

- **`Math.min` と `Math.max`**: 引数の中の最小値、最大値を返す組み込み関数です。`Math.min(a, b)` は小さい方、`Math.max(a, b)` は大きい方です。
- **オプショナルな引数 `bound2?`**: `?` が付いた引数は、省略できます。省略されると `undefined` になります。
- **`== null`**: `null` と `undefined` の両方を、まとめて判定する比較です。
- **オーバーロード**: 同じ関数名に、引数の形が違う複数の宣言を書く仕組みです。ここでは、上限だけの呼び方と、範囲の呼び方を両方許しています。

## 何をしているか

### 1. 片方だけのときは、上限として扱う

```ts:line-numbers=51
  if (bound2 == null) {
    return Math.min(value, bound1);
  }
```

`bound2` が省略されていれば、`bound1` を上限とみなします。値が上限を超えていれば上限に、超えていなければそのままの値を返します。

### 2. 両方あるときは、下限と上限の両方で押さえる

```ts:line-numbers=55
  return Math.min(Math.max(value, bound1), bound2);
```

まず `Math.max(value, bound1)` で、下限より小さければ下限まで持ち上げます。その結果を `Math.min(…, bound2)` で、上限より大きければ上限まで押し下げます。順番を入れ替えても、範囲の中に収まるという結果は同じです。

## ここがすごい

- **2 つの組み合わせで範囲を作る**: 下限と上限は、それぞれ `max` と `min` の 1 回ずつで表せます。範囲の両端を、部品を重ねるだけで扱えています。
- **引数の数で振る舞いを変える**: 上限だけの呼び方は、もっとも単純な `min` 1 回で済みます。呼ぶ側は、よく使う形を短く書けます。
- **`== null` で両方の省略を一度に扱う**: `undefined` と `null` の両方を、ひとつの比較で判定しています。
- **型の宣言で呼び方を示す**: 宣言が複数あるので、エディタの補完で、どの呼び方ができるかが分かります。

## まとめ

- 範囲に収める処理は、下限との `max` と上限との `min` の組み合わせで書ける。
- 省略できる引数は、`undefined` の判定で振る舞いを切り替えられる。
- 上限だけ、下限だけといった形は、同じ関数のオーバーロードで扱うと便利。
- 順番を変えても結果が同じになる処理は、読みやすい順に書いてよい。
