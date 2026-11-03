---
title: 0 から 1 の小数を、指数の偏りまで含めて一様に作る
description: Zig 標準ライブラリの Random.float の f64 の部分。仮数の 52 ビットと指数を別々に作り、0 に近い小さな値も均等に出るように連続した 0 のビットを数える。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [299, 319]
function: Random.float
difficulty: 3
format: 2
tags: [乱数, 数値計算, 低レイヤ]
---

## ひとことで

`float` は、乱数で浮動小数点数を作る関数です。ただ 0 から 1 の値を一様に作るのではなく、浮動小数点数が表せる範囲全体を、きちんと覆うように作ります。0 に近い小さな値も、通常の範囲と同じ割合で出ます。

## コード

::: code-group

```zig:line-numbers=299 [日本語訳]
            const rand = r.int(u64);
            var rand_lz: u64 = @clz(rand);
            if (rand_lz >= 12) {
                rand_lz = 12;
                while (true) {
                    // このループが 2 回以上回ることは、天文学的に起こりにくい。
                    const addl_rand_lz = @clz(r.int(u64));
                    rand_lz += addl_rand_lz;
                    if (addl_rand_lz != 64) {
                        @branchHint(.likely);
                        break;
                    }
                    if (rand_lz >= 1022) {
                        rand_lz = 1022;
                        break;
                    }
                }
            }
            const mantissa = rand & 0xFFFFFFFFFFFFF;
            const exponent = (1022 - rand_lz) << 52;
            return @bitCast(exponent | mantissa);
```

```zig:line-numbers=299 [原文]
            const rand = r.int(u64);
            var rand_lz: u64 = @clz(rand);
            if (rand_lz >= 12) {
                rand_lz = 12;
                while (true) {
                    // It is astronomically unlikely for this loop to execute more than once.
                    const addl_rand_lz = @clz(r.int(u64));
                    rand_lz += addl_rand_lz;
                    if (addl_rand_lz != 64) {
                        @branchHint(.likely);
                        break;
                    }
                    if (rand_lz >= 1022) {
                        rand_lz = 1022;
                        break;
                    }
                }
            }
            const mantissa = rand & 0xFFFFFFFFFFFFF;
            const exponent = (1022 - rand_lz) << 52;
            return @bitCast(exponent | mantissa);
```

:::

## 前提知識

- **浮動小数点数**: 符号、指数、仮数の 3 つの部分でできた数です。`f64` では、仮数が 52 ビット、指数が 11 ビットです。
- **指数**: 2 の何乗かを表す部分です。値の大きさの桁を決めます。
- **仮数**: 有効数字の部分です。
- **`@clz`**: 整数の先頭から続く 0 の数を数える組み込み関数です。値が小さいほど、先頭に 0 が多くなります。
- **`@bitCast`**: ビットの並びを、そのまま別の型として読み替える組み込み関数です。

## 何をしているか

関数は、次の流れで値を作ります。指数は、0 の数が多いほど小さくなります。そのため、0 に近い値が、2 のべき乗の範囲ごとに同じ割合で出ます。

### 1. 先頭の 0 を数える

```zig:line-numbers=299
            const rand = r.int(u64);
            var rand_lz: u64 = @clz(rand);
            if (rand_lz >= 12) {
                rand_lz = 12;
```

`r.int(u64)` で 64 ビットの乱数を作り、`@clz` で先頭から続く 0 の数を `rand_lz` に入れます。0 の数が 12 以上なら、小さな値を作ることになるので、追加の判定に進みます。

### 2. 追加の乱数で 0 の数を足す

```zig:line-numbers=303
                while (true) {
                    // It is astronomically unlikely for this loop to execute more than once.
                    const addl_rand_lz = @clz(r.int(u64));
                    rand_lz += addl_rand_lz;
                    if (addl_rand_lz != 64) {
                        @branchHint(.likely);
                        break;
                    }
                    if (rand_lz >= 1022) {
```

1 回で 1 でないビットが出るまで、乱数を引いて 0 の数を足していきます。ループは 1022 で止まります。ほとんどの場合は 1 回で済むので、この部分はめったに動きません。

@@TR // It is astronomically unlikely for this loop to execute more than once. => // このループが 2 回以上回ることは、天文学的に起こりにくい。

### 3. 指数と仮数を組み立てる

```zig:line-numbers=317
            const mantissa = rand & 0xFFFFFFFFFFFFF;
            const exponent = (1022 - rand_lz) << 52;
            return @bitCast(exponent | mantissa);
```

仮数には、乱数の下位 52 ビットを使います。指数と仮数を組み合わせて、`@bitCast` で `f64` として返します。ビットの並びをそのまま読み替えるので、割り算は使いません。

## ここがすごい

- **範囲をすべて使う**: 通常の `int` を割るやり方では、小さな値が出にくくなります。この関数は、指数の範囲を含めて、すべての値を取れるようにしています。
- **ほとんどの場合は 1 回で済む**: 先頭の 12 ビットに 1 が含まれる確率が高いので、追加の乱数は、めったに必要になりません。
- **分岐に印を付ける**: `@branchHint` で、まれな経路を教えています。コンパイラが、よく使われる経路を速くできます。
- **ビットを直接組み立てる**: 浮動小数点数の形式を、ビット単位で作っています。割り算などの計算を避けるので、正確で速いです。

## まとめ

- `float` は、指数の偏りまで含めて、浮動小数点数の範囲全体を覆うように乱数を作ります。
- 先頭の 0 の数で指数を決め、下位ビットを仮数に使います。
- 追加の乱数は、めったに必要にならないよう作られています。
