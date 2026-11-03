---
title: 平均 1 の指数分布に従う小数を、ジグラットの表を使って作る
description: Zig 標準ライブラリの Random.floatExp。ジグラット法の指数分布の表で乱数を作り、f32 か f64 に変換して返す。待ち時間のモデルなどに使える。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [340, 347]
function: Random.floatExp
difficulty: 3
format: 2
tags: [乱数, 数値計算, 最適化]
---

## ひとことで

`floatExp` は、指数分布に従う乱数を作る関数です。指数分布は、次の出来事が起きるまでの待ち時間などを表す分布です。小さい値が多く、大きい値は少なく出ます。

## コード

```zig:line-numbers=340
pub fn floatExp(r: Random, comptime T: type) T {
    const value = ziggurat.next_f64(r, ziggurat.ExpDist);
    switch (T) {
        f32 => return @floatCast(value),
        f64 => return value,
        else => @compileError("unknown floating point type"),
    }
}
```

## 前提知識

- **指数分布**: 確率密度が `e^(-x)` で減っていく分布です。レートが 1 のとき、平均は 1 になります。
- **ジグラット法（ziggurat）**: 確率分布の形を、階段状の長方形の集まりで近似して、高速に乱数を作る手法です。ほとんどの場合は、1 回の比較と掛け算で済みます。
- **`ziggurat.ExpDist`**: 指数分布用の表です。ジグラット法の長方形の大きさなどが、この表に入っています。
- **`@floatCast`**: 浮動小数点数の型を変換する組み込み関数です。
- **レート**: 指数分布の強さを表す値です。平均はレートの逆数になります。

## 何をしているか

### 1. ジグラット法で f64 の値を作る

```zig:line-numbers=341
    const value = ziggurat.next_f64(r, ziggurat.ExpDist);
```

`ziggurat.next_f64` に指数分布の表を渡して、`f64` の乱数を作ります。表を引く部分が、速さの源です。

### 2. 型に合わせて返す

```zig:line-numbers=342
    switch (T) {
        f32 => return @floatCast(value),
        f64 => return value,
        else => @compileError("unknown floating point type"),
    }
```

`f32` を指定されたら、結果を `f32` に変換します。`f64` ならそのまま返します。それ以外の型は、コンパイルエラーになります。

## ここがすごい

- **表を使って速い**: 多くの場合、表の 1 回の参照だけで値が決まります。複雑な関数の計算を、毎回行わずに済みます。
- **レートの指定は割り算で**: 関数の注釈にあるとおり、レートを変えるときは `floatExp(...) / desiredRate` と書きます。
- **型を選べる**: `f32` と `f64` のどちらでも、同じ表から作れます。
- **正規分布版と対**: 同じ仕組みの `floatNorm` は、平均 0、標準偏差 1 の正規分布に従う乱数を作ります。

## まとめ

- `floatExp` は、平均 1 の指数分布に従う乱数を作ります。
- ジグラット法の指数分布の表を使い、高速に値を決めます。
- レートを変えるには、結果を割ります。
