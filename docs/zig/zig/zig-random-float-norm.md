---
title: 平均 0、標準偏差 1 の正規分布に従う小数を、ジグラット法で作る
description: Zig 標準ライブラリの Random.floatNorm。正規分布用のジグラット表から値を作り、f32 か f64 の型に合わせて返す。平均と標準偏差は、掛け算と足し算で変えられる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [328, 335]
function: Random.floatNorm
difficulty: 2
format: 2
tags: [乱数, 数値計算, 標準ライブラリ]
---

## ひとことで

`floatNorm` は、正規分布に従う小数の乱数を作る関数です。平均は 0、標準偏差は 1 です。ベルの形に値が集まり、0 の近くが最も出やすくなります。

## コード

```zig:line-numbers=328
pub fn floatNorm(r: Random, comptime T: type) T {
    const value = ziggurat.next_f64(r, ziggurat.NormDist);
    switch (T) {
        f32 => return @floatCast(value),
        f64 => return value,
        else => @compileError("unknown floating point type"),
    }
}
```

## 前提知識

- **正規分布**: 平均の周りに値が集まる、ベルの形の分布です。
- **標準正規分布**: 平均 0、標準偏差 1 の正規分布です。
- **ジグラット法**: 分布の曲線を長方形で覆い、高速に乱数を作る方法です。`ziggurat.next_f64` が、その仕組みを持っています。
- **`ziggurat.NormDist`**: 正規分布用の表です。
- **`@floatCast`**: 浮動小数点数の型を変換する組み込み関数です。

## 何をしているか

### 1. 正規分布の乱数を作る

```zig:line-numbers=329
    const value = ziggurat.next_f64(r, ziggurat.NormDist);
```

`ziggurat.next_f64` に正規分布の表を渡して、`f64` の乱数を作ります。

### 2. 型に合わせて返す

```zig:line-numbers=330
    switch (T) {
        f32 => return @floatCast(value),
        f64 => return value,
        else => @compileError("unknown floating point type"),
```

`f32` なら `@floatCast` で変換して返します。`f64` ならそのまま返します。それ以外の型は、コンパイルエラーになります。

## ここがすごい

- **表を差し替えるだけ**: 同じジグラット法の関数に、正規分布の表を渡すだけで済みます。指数分布の版と、仕組みを共有しています。
- **平均と標準偏差は後から変える**: 注釈にあるとおり、`floatNorm(...) * desiredStddev + desiredMean` で、任意の分布にできます。
- **型を選べる**: `f32` と `f64` の両方に対応します。
- **型の誤りを早く検出**: 対応しない型は、コンパイル時に止まります。

## まとめ

- `floatNorm` は、平均 0、標準偏差 1 の正規分布に従う乱数を作ります。
- ジグラット法と正規分布の表を組み合わせています。
- 掛け算と足し算で、平均と標準偏差を変えられます。
