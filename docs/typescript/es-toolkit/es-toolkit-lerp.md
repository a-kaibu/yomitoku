---
title: "2 つの値の間を、割合で滑らかにつなぐ"
description: "es-toolkit の lerp。開始値と終了値の間を、0 から 1 の割合で補間する。割合が 1 のときは終了値を返し、浮動小数点の誤差を避けている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/lerp.ts
lines: [23, 29]
function: "lerp"
difficulty: 2
format: 2
tags: [数値計算, アルゴリズム, イディオム]
---

## ひとことで

`lerp(start, stop, fraction)` は、`start` と `stop` の間の値を、割合 `fraction` で求める関数です（lerp は linear interpolation、線形補間の略です）。割合が `0` なら `start`、`1` なら `stop`、`0.5` なら中間を返します。アニメーションで、位置を少しずつ動かすときに使われます。

```ts
lerp(0, 100, 0.25)  // 25
lerp(10, 20, 0.5)   // 15
lerp(10, 20, 1)     // 20
```

## コード

```ts:line-numbers=23
export function lerp(start: number, stop: number, fraction: number): number {
  if (fraction === 1) {
    return stop;
  }

  return start + (stop - start) * fraction;
}
```

## 前提知識

- **補間（interpolation）**: 2 つの既知の値の間にある値を、推測して作ることです。線形補間は、比例で求める方法です。
- **割合（fraction）**: 0 から 1 までの数です。0 が始点、1 が終点を表します。
- **浮動小数点の誤差**: 小数の計算では、わずかな誤差が出ることがあります。割合が `1` のときに、計算式を使わずに `stop` を返すと、誤差を完全に避けられます。
- **`if` の早期 return**: 特別な場合を先に返して、本体の式を単純に保つ書き方です。

## 何をしているか

### 1. 割合が 1 なら終点をそのまま返す

```ts:line-numbers=24
  if (fraction === 1) {
    return stop;
  }
```

割合が `1` のときは、計算せずに `stop` を返します。計算すると、`start + (stop - start) * 1` が、わずかにずれることがあるためです。

### 2. 始点から、差の割合だけ進める

```ts:line-numbers=28
  return start + (stop - start) * fraction;
```

`stop - start` が、2 点の差です。その差に割合を掛けて、始点に足します。割合が `0` なら差に `0` を掛けるので、結果は `start` になります。

## ここがすごい

- **1 つの式で線形の関係を表す**: 「始点から、差の割合だけ進む」という考え方が、式そのものに現れています。
- **端の値を正確に返す**: 割合が `1` のときの特別扱いで、終点が正確に得られます。アニメーションの最後に、ぴったり目的地に着くために大切な処理です。
- **引数の順番が直感的**: `start`、`stop`、`fraction` の順に読めば、何をしているか分かります。
- **逆の計算もできる**: 値から割合を求める関数（`inverseLerp`）と対になっていて、2 つを組み合わせると、値の変換ができます。

## まとめ

- 2 点の間の値は、差に割合を掛けて始点に足すと求まる。
- 浮動小数点の誤差を避けるため、端の割合は特別に扱う。
- 補間は、アニメーションや値の変換で広く使われる基本の計算。
- 対になる逆の計算（割合を求める）と組み合わせると、値の変換が作れる。
