---
title: ジグラット法で、確率分布に従う f64 の乱数を、ほとんどの場合 1 回の比較で作る
description: Zig 標準ライブラリの ziggurat.next_f64。乱数の 1 つの値から、表の番号と小数の値を同時に作り、長方形の中に入るかを比べる。外れた場合だけ、曲線の下かを追加の判定で確かめる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random/ziggurat.zig
lines: [15, 51]
function: next_f64
difficulty: 3
format: 2
tags: [乱数, 最適化, 数値計算]
---

## ひとことで

`next_f64` は、ジグラット法で、目的の確率分布に従う小数の乱数を作る関数です。ほとんどの場合は、表を 1 回引いて比べるだけで値が決まります。曲線の下にあるかを調べるのは、まれな場合だけです。

## コード

::: code-group

```zig:line-numbers=15 [日本語訳]
pub fn next_f64(random: Random, comptime tables: ZigTable) f64 {
    while (true) {
        // 指数の部分を表の番号に使うことで、余分な乱数を 1 回減らして、浮動小数点数を部品から組み立てる。
        // 使われていない指数の部分を、表の引き当てに使う。
        const bits = random.int(u64);
        const i = @as(usize, @as(u8, @truncate(bits)));

        const u = blk: {
            if (tables.is_symmetric) {
                // [2, 4) の値を作り、[-1, 1) に縮める。
                const repr = ((0x3ff + 1) << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - 3.0;
            } else {
                // [1, 2) の値を作り、(0, 1) に縮める。
                const repr = (0x3ff << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - (1.0 - math.floatEps(f64) / 2.0);
            }
        };

        const x = u * tables.x[i];
        const test_x = if (tables.is_symmetric) @abs(x) else x;

        // |u| < tables.x[i+1] / tables.x[i]（または u < ...）と同じ意味。
        if (test_x < tables.x[i + 1]) {
            return x;
        }

        if (i == 0) {
            return tables.zero_case(random, u);
        }

        // f1 + DRanU() * (f0 - f1) < 1 と同じ意味。
        if (tables.f[i + 1] + (tables.f[i] - tables.f[i + 1]) * random.float(f64) < tables.pdf(x)) {
            return x;
        }
    }
}
```

```zig:line-numbers=15 [原文]
pub fn next_f64(random: Random, comptime tables: ZigTable) f64 {
    while (true) {
        // We manually construct a float from parts as we can avoid an extra random lookup here by
        // using the unused exponent for the lookup table entry.
        const bits = random.int(u64);
        const i = @as(usize, @as(u8, @truncate(bits)));

        const u = blk: {
            if (tables.is_symmetric) {
                // Generate a value in the range [2, 4) and scale into [-1, 1)
                const repr = ((0x3ff + 1) << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - 3.0;
            } else {
                // Generate a value in the range [1, 2) and scale into (0, 1)
                const repr = (0x3ff << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - (1.0 - math.floatEps(f64) / 2.0);
            }
        };

        const x = u * tables.x[i];
        const test_x = if (tables.is_symmetric) @abs(x) else x;

        // equivalent to |u| < tables.x[i+1] / tables.x[i] (or u < tables.x[i+1] / tables.x[i])
        if (test_x < tables.x[i + 1]) {
            return x;
        }

        if (i == 0) {
            return tables.zero_case(random, u);
        }

        // equivalent to f1 + DRanU() * (f0 - f1) < 1
        if (tables.f[i + 1] + (tables.f[i] - tables.f[i + 1]) * random.float(f64) < tables.pdf(x)) {
            return x;
        }
    }
}
```

:::

## 前提知識

- **ジグラット法（ziggurat）**: 確率の密度の曲線を、階段状の長方形の集まりで覆う乱数の作り方です。長方形の中に入る値は、曲線の下にあることが自明なので、判定が要りません。
- **表（tables）**: 長方形の境界の値や、曲線の高さを、あらかじめ並べた配列です。`tables.x` と `tables.f` があります。
- **仮数と指数の組立て**: 乱数のビットから、直接 2 から 4 の範囲の浮動小数点数を作るテクニックです。
- **拒否法**: 曲線の外に出た値を捨てて、もう一度やり直す方法です。ループの `while (true)` で行います。
- **`tables.zero_case`**: 一番下の長方形で、裾の部分を別の方法で作る関数です。

## 何をしているか

### 1. 乱数から値と表の番号を作る

::: code-group

```zig:line-numbers=19 [日本語訳]
        const bits = random.int(u64);
        const i = @as(usize, @as(u8, @truncate(bits)));

        const u = blk: {
            if (tables.is_symmetric) {
                // [2, 4) の値を作り、[-1, 1) に縮める。
                const repr = ((0x3ff + 1) << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - 3.0;
            } else {
                // [1, 2) の値を作り、(0, 1) に縮める。
                const repr = (0x3ff << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - (1.0 - math.floatEps(f64) / 2.0);
            }
        };
```

```zig:line-numbers=19 [原文]
        const bits = random.int(u64);
        const i = @as(usize, @as(u8, @truncate(bits)));

        const u = blk: {
            if (tables.is_symmetric) {
                // Generate a value in the range [2, 4) and scale into [-1, 1)
                const repr = ((0x3ff + 1) << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - 3.0;
            } else {
                // Generate a value in the range [1, 2) and scale into (0, 1)
                const repr = (0x3ff << 52) | (bits >> 12);
                break :blk @as(f64, @bitCast(repr)) - (1.0 - math.floatEps(f64) / 2.0);
            }
        };
```

:::

64 ビットの乱数のうち、下位 8 ビットを表の番号 `i` に使います。残りのビットを仮数にして、浮動小数点数を組み立てます。こうすると、乱数を 1 回引くだけで、値と番号が同時に決まります。

### 2. 長方形の中なら即座に返す

::: code-group

```zig:line-numbers=34 [日本語訳]
        const x = u * tables.x[i];
        const test_x = if (tables.is_symmetric) @abs(x) else x;

        // |u| < tables.x[i+1] / tables.x[i]（または u < ...）と同じ意味。
        if (test_x < tables.x[i + 1]) {
            return x;
        }
```

```zig:line-numbers=34 [原文]
        const x = u * tables.x[i];
        const test_x = if (tables.is_symmetric) @abs(x) else x;

        // equivalent to |u| < tables.x[i+1] / tables.x[i] (or u < tables.x[i+1] / tables.x[i])
        if (test_x < tables.x[i + 1]) {
            return x;
        }
```

:::

`x = u * tables.x[i]` が、次の境界より内側なら、その値を返します。ここが、ほとんどの場合の出口です。

### 3. 曲線の下かを確かめて、外れれば繰り返す

::: code-group

```zig:line-numbers=42 [日本語訳]
        if (i == 0) {
            return tables.zero_case(random, u);
        }

        // f1 + DRanU() * (f0 - f1) < 1 と同じ意味。
        if (tables.f[i + 1] + (tables.f[i] - tables.f[i + 1]) * random.float(f64) < tables.pdf(x)) {
            return x;
        }
```

```zig:line-numbers=42 [原文]
        if (i == 0) {
            return tables.zero_case(random, u);
        }

        // equivalent to f1 + DRanU() * (f0 - f1) < 1
        if (tables.f[i + 1] + (tables.f[i] - tables.f[i + 1]) * random.float(f64) < tables.pdf(x)) {
            return x;
        }
```

:::

番号が 0 なら、裾の専用の関数に任せます。それ以外は、2 つの高さの間で乱数を振り、曲線の下にあれば値を返します。外れれば、ループの先頭に戻ってやり直します。

## ここがすごい

- **ほとんどが 1 回の比較**: 長方形の中に入る確率が高いので、平均して少ない計算で値が決まります。
- **乱数を節約**: 下位ビットを番号に、残りを仮数に使うので、乱数を余分に引きません。
- **分布を表で変える**: 指数分布や正規分布など、違う分布でも、表を差し替えるだけで同じ関数を使えます。
- **拒否の理由が明快**: コメントが、2 つの判定がそれぞれ何と同じ意味かを説明しています。

## まとめ

- `next_f64` は、ジグラット法で確率分布に従う乱数を作ります。
- 乱数 1 回で番号と値を決め、ほとんどは長方形の中で終わります。
- 外れた場合は、曲線の下かを確かめて、必要なら繰り返します。
