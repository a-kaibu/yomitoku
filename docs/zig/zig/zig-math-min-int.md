---
title: 整数型の最小値を、符号があるかどうかで場合分けして求める
description: Zig 標準ライブラリの math.minInt。符号なしなら 0、符号付きなら最上位ビットだけが 1 の値の負数を返す。コンパイル時に決まる値。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1451, 1457]
function: minInt
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 型システム]
---

## ひとことで

`minInt` は、整数の型が表せる最小値を返す関数です。符号なしの型なら 0、符号付きの型なら負の最小値を返します。たとえば `i8` なら -128、`u8` なら 0 です。

## コード

```zig:line-numbers=1451
pub fn minInt(comptime T: type) comptime_int {
    const info = @typeInfo(T);
    const bit_count = info.int.bits;
    if (info.int.signedness == .unsigned) return 0;
    if (bit_count == 0) return 0;
    return -(1 << (bit_count - 1));
}
```

## 前提知識

- **符号なしの最小値**: 負の値を持たないので、最小は 0 です。
- **符号付きの最小値**: 2 の補数では、最上位ビットだけが 1 の値が最小になります。n ビットなら `-2^(n-1)` です。`i8` なら -128 です。
- **`maxInt`**: 同じファイルにある関数で、最大値を求めます。最小値と対で使われます。
- **`comptime_int`**: コンパイル時の任意精度の整数です。
- **符号の確認（`info.int.signedness`）**: 整数型の符号の有無を、型の情報から調べています。

## 何をしているか

### 1. 符号なしと、ビット数 0 の場合は 0

```zig:line-numbers=1452
    const info = @typeInfo(T);
    const bit_count = info.int.bits;
    if (info.int.signedness == .unsigned) return 0;
    if (bit_count == 0) return 0;
```

符号なしの型なら、最小値は 0 です。ビット数が 0 の型も、表せる値は 0 だけです。どちらも `return 0` で済みます。

### 2. 符号付きは負の最小値を作る

```zig:line-numbers=1456
    return -(1 << (bit_count - 1));
```

`1 << (bit_count - 1)` は、最上位ビットだけが立った値、つまり `2^(n-1)` です。前に `-` を付けると、符号付きの最小値になります。

## ここがすごい

- **場合分けが短い**: 符号なし、ビット数 0、符号付きの 3 つを、上から順に 1 行ずつで処理しています。
- **2 の補数の性質を使う**: 最小値は、最上位ビットだけが 1 の形で、符号付きの型の範囲に一致します。
- **`maxInt` と対**: 最大値と最小値を、同じ `1 <<` の考え方で書いているので、対応関係が読み取りやすいです。
- **型の情報を使う**: 符号の有無もビット数も、`@typeInfo` から取り出しています。型を手で書く必要がありません。

## まとめ

- `minInt` は、符号なしなら 0、符号付きなら負の最小値を返します。
- 符号付きの最小値は、最上位ビットだけが 1 の値の負数です。
- `maxInt` と対で、整数型の範囲を表します。
