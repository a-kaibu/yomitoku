---
title: コンパイル時に「2 進数の桁数」を二分探索で求める
description: 整数の floor(log2) を、プログラムの実行前に計算する Zig のコード。桁数を 2 のべきで倍々に探し、そのあと二分探索で絞り込む。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/log2.zig
lines: [13, 41]
function: log2
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, ビット演算]
---

## ひとことで

`log2` は、数の **2 を底とする対数** を求める関数です。整数の場合は、「その数が 2 進数で何桁か（から 1 を引いたもの）」にあたる値を返します。
たとえば `log2(16)` は `4`（16 は 2 の 4 乗）、`log2(15)` は `3` です。

この関数は、値がコンパイル時に決まっている整数（`comptime_int`）の場合、**プログラムを作る段階で答えを計算してしまいます**。実行時には計算が要りません。

## コード

::: code-group

```zig:line-numbers=13 [日本語訳]
pub fn log2(x: anytype) @TypeOf(x) {
    const T = @TypeOf(x);
    return switch (@typeInfo(T)) {
        .comptime_float, .float => @log2(x),
        .comptime_int => comptime {
            std.debug.assert(x > 0);
            var x_shifted = x;
            // まず floorPowerOfTwo(x)（x 以下で最大の 2 のべき乗）を求める
            var shift_amt = 1;
            while (x_shifted >> (shift_amt << 1) != 0) shift_amt <<= 1;

            // 答えは [shift_amt, 2 * shift_amt - 1] の範囲にある
            // 二分探索を使えば O(log(N)) で求められる。
            var result = 0;
            while (shift_amt != 0) : (shift_amt >>= 1) {
                if (x_shifted >> shift_amt != 0) {
                    x_shifted >>= shift_amt;
                    result += shift_amt;
                }
            }
            return result;
        },
        .int => |int_info| math.log2_int(switch (int_info.signedness) {
            .signed => @Int(.unsigned, int_info.bits -| 1),
            .unsigned => T,
        }, @intCast(x)),
        else => @compileError("log2 not implemented for " ++ @typeName(T)),
    };
}
```

```zig:line-numbers=13 [原文]
pub fn log2(x: anytype) @TypeOf(x) {
    const T = @TypeOf(x);
    return switch (@typeInfo(T)) {
        .comptime_float, .float => @log2(x),
        .comptime_int => comptime {
            std.debug.assert(x > 0);
            var x_shifted = x;
            // First, calculate floorPowerOfTwo(x)
            var shift_amt = 1;
            while (x_shifted >> (shift_amt << 1) != 0) shift_amt <<= 1;

            // Answer is in the range [shift_amt, 2 * shift_amt - 1]
            // We can find it in O(log(N)) using binary search.
            var result = 0;
            while (shift_amt != 0) : (shift_amt >>= 1) {
                if (x_shifted >> shift_amt != 0) {
                    x_shifted >>= shift_amt;
                    result += shift_amt;
                }
            }
            return result;
        },
        .int => |int_info| math.log2_int(switch (int_info.signedness) {
            .signed => @Int(.unsigned, int_info.bits -| 1),
            .unsigned => T,
        }, @intCast(x)),
        else => @compileError("log2 not implemented for " ++ @typeName(T)),
    };
}
```

:::

## 前提知識

- **対数（log）**: 「2 を何回掛けるとこの数になるか」を表す数です。`log2(8)` は `3`、`log2(9)` は約 `3.17` です。整数の場合は小数点以下を切り捨てた値を返します。
- **`comptime`**: 値をプログラムの実行前（コンパイル時）に計算させる指定です。`comptime { ... }` のブロックは、中の計算がすべてコンパイル時に行われます。
- **`comptime_int`**: 大きさがまだ決まっていない整数リテラル（`16` のような値）の型です。
- **`switch (@typeInfo(T))`**: 型の種類によって処理を分ける書き方です。`.int` は整数型、`.float` は浮動小数点型です。
- **`>>` と `<<`**: ビットを右・左にずらす演算です。`x >> 1` は 2 で割ることに当たります。
- **`std.debug.assert`**: 条件が偽のときにエラーで止める確認の文です。ここでは「0 より大きい」ことを確かめています。
- **二分探索**: 候補を半分ずつ捨てて、答えを絞り込む方法です。

## 何をしているか

### 1. 型に応じて分岐する

```zig:line-numbers=15
    return switch (@typeInfo(T)) {
        .comptime_float, .float => @log2(x),
```

小数の場合は、組み込みの `@log2` をそのまま使います。整数の場合だけ、下の専用の計算に進みます。

### 2. コンパイル時に計算する（comptime_int）

```zig:line-numbers=17
        .comptime_int => comptime {
            std.debug.assert(x > 0);
            var x_shifted = x;
```

`comptime` ブロックの中は、コンパイラが実行して答えを決めます。`log2(0)` は定義されないので、先に `assert` で弾いています。

### 3. 2 のべきで倍々に探す

::: code-group

```zig:line-numbers=20 [日本語訳]
            // まず floorPowerOfTwo(x)（x 以下で最大の 2 のべき乗）を求める
            var shift_amt = 1;
            while (x_shifted >> (shift_amt << 1) != 0) shift_amt <<= 1;
```

```zig:line-numbers=20 [原文]
            // First, calculate floorPowerOfTwo(x)
            var shift_amt = 1;
            while (x_shifted >> (shift_amt << 1) != 0) shift_amt <<= 1;
```

:::

`shift_amt` は 1、2、4、8 … と倍々に増えていきます。`x_shifted >> (shift_amt << 1)` は、`x` を `2 * shift_amt` ビット右にずらした値です。これが 0 でない間は、まだ `x` が大きいということです。

たとえば `x = 16`（2 進数で 5 桁）のとき、`shift_amt` は 1、2、4 と進み、`shift_amt = 4` で止まります。この時点で答えは `[4, 7]` の範囲にあります。

### 4. 二分探索で答えを決める

::: code-group

```zig:line-numbers=24 [日本語訳]
            // 答えは [shift_amt, 2 * shift_amt - 1] の範囲にある
            // 二分探索を使えば O(log(N)) で求められる。
            var result = 0;
            while (shift_amt != 0) : (shift_amt >>= 1) {
                if (x_shifted >> shift_amt != 0) {
                    x_shifted >>= shift_amt;
                    result += shift_amt;
                }
            }
            return result;
```

```zig:line-numbers=24 [原文]
            // Answer is in the range [shift_amt, 2 * shift_amt - 1]
            // We can find it in O(log(N)) using binary search.
            var result = 0;
            while (shift_amt != 0) : (shift_amt >>= 1) {
                if (x_shifted >> shift_amt != 0) {
                    x_shifted >>= shift_amt;
                    result += shift_amt;
                }
            }
            return result;
```

:::

`shift_amt` を 4、2、1 と半分ずつ減らしながら、「`x` を `shift_amt` ビット右にずらしても、まだ 0 でないか」を確かめます。0 でなければ、その分だけ桁が残っているので、`x_shifted` を右にずらし、`result` に `shift_amt` を足します。

`x = 16` の場合は、`shift_amt = 4` で `16 >> 4 = 1` が 0 でないので、`result = 4`、`x_shifted = 1` になります。そのあと `shift_amt = 2` と `1` では、`x_shifted` を右にずらすと 0 になるので何もしません。結果は `4` です。

### 5. 小数と整数の違いを見る

```zig:line-numbers=35
        .int => |int_info| math.log2_int(switch (int_info.signedness) {
            .signed => @Int(.unsigned, int_info.bits -| 1),
            .unsigned => T,
        }, @intCast(x)),
```

実行時の整数は、`math.log2_int` で計算します。符号付きの場合は、正の値を扱うために符号ビットを除いた型に変換します。

## ここがすごい

- **実行時の計算を消す**: 定数の対数を実行時に求めるのは無駄です。`comptime` にすると、答えがプログラムに直接埋め込まれます。
- **掛け算も割り算も使わない**: 倍々に探してから半分ずつ戻すので、ビットシフトと比較だけで済みます。ループの回数も、ビット数の対数（だいたい `log2(N)` 回）に抑えられています。
- **大きな数でも動く**: テストにあるとおり、`1 << 4073` のような非常に大きな値にも対応しています。最初の倍々の探索で、必要な範囲をすばやく見つけられるからです。
- **型を見て安全に分岐**: 整数、小数、それ以外（エラーにする）で処理が分かれているので、間違った型を渡すとコンパイル時に分かります。

## まとめ

- `log2` は、整数が 2 進数で何桁かを表す値を返します。
- `comptime` を使うと、答えをプログラムを作る段階で計算できます。
- 2 のべきで倍々に上限を探し、半分ずつ戻す二分探索で答えを絞り込みます。
- 型ごとに専用の処理を分けると、同じ名前で整数にも小数にも使えます。
