---
title: "割り算を使わずに「余り」を求める fastmod"
description: "Dictionary が添字を決めるのに使う FastMod。事前に計算した 2^64/除数 の近似値を掛けるだけで、遅い割り算命令を使わずに value % divisor を求める。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Collections/HashHelpers.cs
lines: [171, 186]
function: "HashHelpers.FastMod"
difficulty: 3
format: 2
tags: [数値計算, 最適化, ハッシュ]
---

## ひとことで

`FastMod` は `value % divisor`（割り算の余り）を、**割り算命令を使わずに掛け算とシフトだけで** 求める関数です。
.NET の `Dictionary` や `HashSet` は、要素のハッシュ値をバケット（配列の箱）の数で割った余りで格納場所を決めます。これはとても頻繁に行われる計算なので、少しでも速くしたい場所です。

## コード

::: code-group

```csharp:line-numbers=171 [日本語訳]
        /// <summary>GetFastModMultiplier で事前に計算した乗数を使って mod 演算を行う。</summary>
        /// <remarks>64 ビット環境でのみ使う。</remarks>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static uint FastMod(uint value, uint divisor, ulong multiplier)
        {
            // 修正版の Daniel Lemire の fastmod アルゴリズム (https://github.com/dotnet/runtime/pull/406) を使う。
            // 除数が 2**31 未満なら、長い乗算を避けられる。
            Debug.Assert(divisor <= int.MaxValue);

            // これは (uint)Math.BigMul(multiplier * value, divisor, out _) と同じ。この版は上位ビットだけ必要なので
            // 現時点では BigMul より速い。
            uint highbits = (uint)(((((multiplier * value) >> 32) + 1) * divisor) >> 32);

            Debug.Assert(highbits == value % divisor);
            return highbits;
        }
```

```csharp:line-numbers=171 [原文]
        /// <summary>Performs a mod operation using the multiplier pre-computed with <see cref="GetFastModMultiplier"/>.</summary>
        /// <remarks>This should only be used on 64-bit.</remarks>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static uint FastMod(uint value, uint divisor, ulong multiplier)
        {
            // We use modified Daniel Lemire's fastmod algorithm (https://github.com/dotnet/runtime/pull/406),
            // which allows to avoid the long multiplication if the divisor is less than 2**31.
            Debug.Assert(divisor <= int.MaxValue);

            // This is equivalent of (uint)Math.BigMul(multiplier * value, divisor, out _). This version
            // is faster than BigMul currently because we only need the high bits.
            uint highbits = (uint)(((((multiplier * value) >> 32) + 1) * divisor) >> 32);

            Debug.Assert(highbits == value % divisor);
            return highbits;
        }
```

:::

`multiplier` は同じファイルの `GetFastModMultiplier` で、バケット数が決まったときに 1 回だけ計算しておきます。

```csharp:line-numbers=168
        public static ulong GetFastModMultiplier(uint divisor) =>
            ulong.MaxValue / divisor + 1;
```

## 前提知識

- **`uint` / `ulong`**: 32 ビット / 64 ビットの符号なし整数です。`ulong` 同士の掛け算で 64 ビットを超えた部分は **捨てられます**。
- **`>> 32`**: 右に 32 ビットずらすことで、64 ビット値の上位 32 ビットを取り出します。
- **割り算は遅い**: 多くの CPU で、整数の割り算命令は足し算や掛け算に比べて何倍も時間がかかります。そのため「割り算を掛け算に置き換える」のは高速化の定番です。
- **`Debug.Assert`**: デバッグビルドでだけ動く確認です。最後の Assert では、結果が本物の `%` と一致することを確かめています。

## 何をしているか

### 1. 逆数を固定小数点で持つ

`multiplier = ⌈2⁶⁴ / divisor⌉` は、**`1 / divisor` を 64 ビットの小数として表したもの** と考えられます（小数点が 64 ビット目の位置にある固定小数点数）。

### 2. 掛けると「割り算の小数部分」が残る

```csharp:line-numbers=182
            uint highbits = (uint)(((((multiplier * value) >> 32) + 1) * divisor) >> 32);
```

`multiplier * value` は `value / divisor` を固定小数点で表したものです。ただし 64 ビットを超えた部分（商の整数部分）は捨てられるので、**残るのは小数部分だけ** です。
小数部分に `divisor` を掛けて整数部分を取り出せば、それが余りになります。

小さな数で確かめます。`divisor = 3`、`value = 10` のとき、10 ÷ 3 = 3.333… で、小数部分は 0.333…。これに 3 を掛けると 0.999… ≒ 1。10 % 3 = 1 と一致します。

### 3. 掛け算を 32 ビットで済ませる工夫

本来の Lemire 氏の手法は 128 ビットの掛け算を使います。ここでは小数部分の上位 32 ビットだけを取り出し（`>> 32`）、`+ 1` で切り捨ての誤差を補正してから `divisor` を掛けます。コメントの通り、**除数が 2³¹ 未満なら** この簡略化で正しい結果になることが確かめられていて、Assert でその前提を明示しています。

## ここがすごい

- **割り算 1 回を掛け算 2 回に**: 除数（バケット数）はリサイズのときにしか変わらないので、逆数の計算は 1 回だけ。以降の検索・追加のたびに割り算を避けられます。
- **ハッシュ表の大きさが素数でも使える**: 2 のべき乗サイズなら `& (size - 1)` で余りが取れますが、.NET の Dictionary はハッシュの偏りに強い素数サイズを使います。素数サイズの利点を残したまま、割り算のコストを減らせるのがこの手法の価値です。
- **128 ビット演算を避ける**: コメントの通り、`Math.BigMul` で 128 ビットの積を求めるより、必要な上位ビットだけを計算するほうが速いと判断しています。
- **64 ビット環境専用**:  `remarks` にある通り、32 ビット CPU では 64 ビットの掛け算自体が重いため使いません。

## まとめ

- `a % b` は「`a / b` の小数部分 × b」で求められる。
- 除数が固定なら、逆数を前もって計算して割り算を掛け算に置き換えられる。
- 近似で済ませる場合は、成り立つ条件（ここでは除数 < 2³¹）を Assert で明示する。
