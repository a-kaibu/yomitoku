---
title: 割り算を減らして、偏りのない範囲の乱数を作る
description: 0 以上 n 未満の整数の乱数を作る Random.uintLessThan。掛け算の上位ビットを使い、割り算は必要なときだけ行うという Lemire の方法。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [144, 171]
function: Random.uintLessThan
difficulty: 3
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`uintLessThan` は、`0` 以上 `less_than` 未満の整数の乱数を作る関数です。たとえば `uintLessThan(u32, 6)` は、`0` から `5` までのどれかを、同じ確率で返します。
素朴なやり方は「乱数を作って、範囲で割った余りを取る」ですが、その方法は小さい数が少し出やすくなる偏りがあります。この関数は、その偏りを避けつつ、割り算をほとんど使わずに答えを出します。

## コード

::: code-group

```zig:line-numbers=144 [日本語訳]
pub fn uintLessThan(r: Random, comptime T: type, less_than: T) T {
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    const bits = @typeInfo(T).int.bits;
    assert(0 < less_than);

    // 次の文献をもとにした:
    //   出典: http://www.pcg-random.org/posts/bounded-rands.html
    //   "Lemire's"（作者による少しの工夫を加えたもの）
    var x = r.int(T);
    var m = math.mulWide(T, x, less_than);
    var l: T = @truncate(m);
    if (l < less_than) {
        var t = -%less_than;

        if (t >= less_than) {
            t -= less_than;
            if (t >= less_than) {
                t %= less_than;
            }
        }
        while (l < t) {
            x = r.int(T);
            m = math.mulWide(T, x, less_than);
            l = @truncate(m);
        }
    }
    return @intCast(m >> bits);
}
```

```zig:line-numbers=144 [原文]
pub fn uintLessThan(r: Random, comptime T: type, less_than: T) T {
    comptime assert(@typeInfo(T).int.signedness == .unsigned);
    const bits = @typeInfo(T).int.bits;
    assert(0 < less_than);

    // adapted from:
    //   http://www.pcg-random.org/posts/bounded-rands.html
    //   "Lemire's (with an extra tweak from me)"
    var x = r.int(T);
    var m = math.mulWide(T, x, less_than);
    var l: T = @truncate(m);
    if (l < less_than) {
        var t = -%less_than;

        if (t >= less_than) {
            t -= less_than;
            if (t >= less_than) {
                t %= less_than;
            }
        }
        while (l < t) {
            x = r.int(T);
            m = math.mulWide(T, x, less_than);
            l = @truncate(m);
        }
    }
    return @intCast(m >> bits);
}
```

:::
## 前提知識

- **乱数の範囲**: `less_than` が 6 なら、欲しい値は 0、1、2、3、4、5 の 6 通りです。
- **偏り（バイアス）**: 乱数の範囲が 6 通りで、乱数の全体の数が 6 の倍数でないとき、余りを取る方法では、一部の値が少しだけ多く出てしまう現象です。
- **`mulWide`**: 2 つの値を掛けて、結果が溢れないように、大きい型で返す関数です。上位のビットと下位のビットを両方取れます。
- **`@truncate`**: 大きい整数の下位のビットだけを取り出す組み込み関数です。
- **`-%less_than`**: 折り返しの引き算です。`0 -% n` は、`2 の型のビット数乗 - n` に相当する値になります。
- **`m >> bits`**: 掛け算の結果を、ビット数の分だけ右にずらします。上位のビットを取り出すことになります。

## 何をしているか

### 1. 乱数を 1 つ作り、範囲と掛け算する

```zig:line-numbers=152
    var x = r.int(T);
    var m = math.mulWide(T, x, less_than);
    var l: T = @truncate(m);
```

まず、型 `T` の乱数 `x` を作ります。それを `less_than` と掛けると、結果は `T` の 2 倍の大きさの値 `m` になります。`l` は、その下位のビットです。

`x` は、0 から「型の最大値」までの乱数です。`x * less_than` の上位のビットを取り出すと、0 から `less_than - 1` までの値になります。

### 2. 下位の値が小さい場合だけ、詳しく調べる

```zig:line-numbers=155
    if (l < less_than) {
        var t = -%less_than;

        if (t >= less_than) {
            t -= less_than;
            if (t >= less_than) {
                t %= less_than;
            }
        }
```

`l` が `less_than` より小さいときだけ、偏りを取り除く判定をします。`t` は、偏りが出る境界の値です。`-%less_than` で、`2 の型のビット数乗 - less_than` にあたる値を作ります。

ここでは、割り算を必要な場合だけ使います。`t` が `less_than` 以上なら引き算を 1 回だけ行います。それでもまだ大きいときだけ、`%` で余りを取ります。

### 3. 偏りの出る値は、引き直す

```zig:line-numbers=164
        while (l < t) {
            x = r.int(T);
            m = math.mulWide(T, x, less_than);
            l = @truncate(m);
        }
```

`l` が `t` より小さいときは、その乱数は使わず、もう一度乱数を作り直します。この引き直しによって、結果の分布が一様になります。

引き直しは、まれにしか起きません。引き直すべき範囲は、乱数全体に比べて小さいからです。

### 4. 上位のビットを返す

```zig:line-numbers=170
    return @intCast(m >> bits);
```

最後に、`m` を `bits` だけ右にずらします。掛け算の結果の上位の部分が、求める範囲の値になります。

## ここがすごい

- **割り算をほとんど使わない**: 素朴な方法では、毎回の余りの計算で割り算が必要です。この方法では、掛け算と右シフトが中心で、割り算は稀にしか起きません。
- **偏りを数学的に取り除く**: 境界の値 `t` を計算して、その範囲の乱数だけを引き直すので、結果が正確に一様になります。
- **引き直しが少ない**: 引き直す範囲は、乱数全体のごく一部です。ほとんどの乱数は、そのまま使われます。
- **型に合わせて計算**: `mulWide` や `bits` を使うので、`u8` でも `u64` でも、同じコードが動きます。
- **元の考え方を明示**: コメントには、PCG の作者による文献を元にしていると書かれています。作者が自分の工夫を少し加えた、という点も説明されています。

## まとめ

- 範囲の乱数を余りで作ると、わずかな偏りが生まれます。
- 乱数に範囲を掛けて、上位のビットを取り出すと、割り算なしで範囲内の値になります。
- 偏りが出そうな乱数だけを引き直すと、結果は一様になります。
- 割り算は、境界の計算で必要な場合だけ行われます。
