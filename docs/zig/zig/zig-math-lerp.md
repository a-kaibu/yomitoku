---
title: 2 つの値を割合 t で混ぜる、線形補間を 1 回の積和で計算する
description: Zig 標準ライブラリの math.lerp。a から b へ t の割合で進んだ値を、(b - a) * t + a の形で、@mulAdd による 1 回の積和として計算する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1389, 1392]
function: lerp
difficulty: 2
format: 2
tags: [数値計算, 最適化, 標準ライブラリ]
---

## ひとことで

`lerp` は、2 つの値 `a` と `b` の間を、割合 `t` で取った値を返す関数です。`t` が 0 なら `a`、1 なら `b`、0.5 なら中間の値になります。アニメーションの途中の値や、色の混ぜ合わせなどで使われます。

## コード

```zig:line-numbers=1389
pub fn lerp(a: anytype, b: anytype, t: anytype) @TypeOf(a, b, t) {
    const Type = @TypeOf(a, b, t);
    return @mulAdd(Type, b - a, t, a);
}
```

## 前提知識

- **線形補間（linear interpolation）**: 2 つの値の間を、直線で結んだ上の点として求める計算です。`a + (b - a) * t` と書けます。
- **割合 `t`**: 0 から 1 の値で、どこまで進んだかを表します。
- **積和（multiply-add）**: `x * y + z` を、途中で丸めずに 1 回で計算する演算です。CPU にはこれを 1 命令で行えるものがあります。
- **`@mulAdd`**: 積和を計算する組み込み関数です。型を最初の引数で指定します。
- **`@TypeOf(a, b, t)`**: 3 つの引数から、結果の型を決める組み込み関数です。

## 何をしているか

### 1. 引数の型をそろえる

```zig:line-numbers=1390
    const Type = @TypeOf(a, b, t);
```

`@TypeOf(a, b, t)` で、3 つの引数の型をまとめて決めます。そのため、`f32` と `f64` が混ざると、コンパイル時に検査されます。

### 2. 積和を 1 回で計算する

```zig:line-numbers=1391
    return @mulAdd(Type, b - a, t, a);
```

`@mulAdd(Type, b - a, t, a)` は、`(b - a) * t + a` を 1 回の積和で計算します。`t` が 0 のときは `a`、1 のときは `b` になります。

## ここがすごい

- **端点が正確**: `t` が 0 や 1 のときに、ぴったり `a` と `b` が返ります。端で値がずれないので、アニメーションで安心して使えます。
- **1 回の積和**: 掛け算と足し算を別々にするより、丸めの誤差が減り、命令数も減ります。
- **型の一貫性**: 引数の型を 1 つに決めるので、混在した型での誤りが防がれます。
- **書き方が短い**: 数式をそのまま 1 行で書けるので、読み手が式の意味を追いやすくなっています。

## まとめ

- `lerp` は、`a` と `b` の間を割合 `t` で取った値を返します。
- 計算は `(b - a) * t + a` の積和で、1 回で行います。
- `t` が 0 と 1 のとき、端点の値が正確に返ります。
