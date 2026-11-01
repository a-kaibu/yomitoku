---
title: "割り算をほとんど使わずに偏りのない範囲乱数を作る"
description: "Random.Next(max) の中身。乱数と max の掛け算の上位ビットを答えにし、偏りが出る場合だけ取り直す Lemire の方法で、ほとんどの場合割り算なしで一様な乱数を得る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Random.ImplBase.cs
lines: [36, 56]
function: "Random.ImplBase.NextUInt32(uint, XoshiroImpl)"
difficulty: 3
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`random.Next(6)` のように、**0 以上 max 未満の乱数** がほしいとき、内部ではこの関数が呼ばれます。

素直な方法 `乱数 % max` は、割り算が遅いうえに、`max` によっては **小さい数が出やすくなる偏り** が生まれます。この関数は Daniel Lemire 氏の論文（コメント）の方法で、ほとんどの場合 **掛け算 1 回だけ** で、しかも偏りのない乱数を作ります。

## コード

::: code-group

```csharp:line-numbers=36 [日本語訳]
            // NextUInt32/64 のアルゴリズムは https://arxiv.org/pdf/1805.10941.pdf と https://github.com/lemire/fastrange に基づく。

            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            internal static uint NextUInt32(uint maxValue, XoshiroImpl xoshiro)
            {
                ulong randomProduct = (ulong)maxValue * xoshiro.NextUInt32();
                uint lowPart = (uint)randomProduct;

                if (lowPart < maxValue)
                {
                    uint remainder = (0u - maxValue) % maxValue;

                    while (lowPart < remainder)
                    {
                        randomProduct = (ulong)maxValue * xoshiro.NextUInt32();
                        lowPart = (uint)randomProduct;
                    }
                }

                return (uint)(randomProduct >> 32);
            }
```

```csharp:line-numbers=36 [原文]
            // NextUInt32/64 algorithms based on https://arxiv.org/pdf/1805.10941.pdf and https://github.com/lemire/fastrange.

            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            internal static uint NextUInt32(uint maxValue, XoshiroImpl xoshiro)
            {
                ulong randomProduct = (ulong)maxValue * xoshiro.NextUInt32();
                uint lowPart = (uint)randomProduct;

                if (lowPart < maxValue)
                {
                    uint remainder = (0u - maxValue) % maxValue;

                    while (lowPart < remainder)
                    {
                        randomProduct = (ulong)maxValue * xoshiro.NextUInt32();
                        lowPart = (uint)randomProduct;
                    }
                }

                return (uint)(randomProduct >> 32);
            }
```

:::

## 前提知識

- **`xoshiro.NextUInt32()`**: 0〜2³² − 1 の一様な乱数を返します。
- **`(ulong)maxValue * ...`**: 32 ビットの値どうしを 64 ビットに広げてから掛けるので、結果はあふれません。
- **`(uint)randomProduct`**: 64 ビットの値の下位 32 ビットだけを取り出します。`randomProduct >> 32` は上位 32 ビットです。
- **`0u - maxValue`**: 符号なしの 0 から引くと、ぐるっと回って `2³² − maxValue` になります。
- **「%」の偏り**: たとえば 0〜9 の乱数を `% 3` すると、0, 3, 6, 9 → 0、1, 4, 7 → 1、2, 5, 8 → 2 となり、0 だけが 4 回出ます。2³² が `max` で割り切れないと、これと同じことが起きます。

## 何をしているか

### 1. 掛け算の上位 32 ビットが答え

32 ビットの乱数 `r` を、`r / 2³²`（0 以上 1 未満の小数）と考えます。これに `max` を掛けた `r × max / 2³²` の整数部分は、0 以上 max 未満です。64 ビットの積 `r × max` の **上位 32 ビットがその整数部分** なので、`>> 32` で取り出せば答えになります。割り算はいりません。

`max = 6` で `r = 2³¹`（ちょうど真ん中）なら、`2³¹ × 6 >> 32 = 3` です。

### 2. 偏りの出る場合だけ取り直す

```csharp:line-numbers=42
                uint lowPart = (uint)randomProduct;

                if (lowPart < maxValue)
                {
                    uint remainder = (0u - maxValue) % maxValue;

                    while (lowPart < remainder)
                    {
                        randomProduct = (ulong)maxValue * xoshiro.NextUInt32();
                        lowPart = (uint)randomProduct;
                    }
                }
```

2³² 通りの `r` を `max` 個の答えに割り振ると、2³² が `max` で割り切れない限り、ある答えは他より 1 回多く出てしまいます。その「余分」の個数は `2³² mod max` 個です。

下位 32 ビット（`lowPart`）が `2³² mod max` より小さい積は「余分」に当たるので、それを捨てて引き直せば、すべての答えがちょうど同じ回数になります。`(0u - maxValue) % maxValue` が、この `2³² mod max` を計算しています（`(2³² − max) mod max` は `2³² mod max` と同じ）。

## ここがすごい

- **割り算は「たまに」だけ**: `2³² mod max` は max 未満なので、`lowPart < maxValue` でなければ取り直しは絶対に不要です。この安い比較で先にふるい落とし、まれな場合だけ `(0u - maxValue) % maxValue` の割り算をします。`max` が小さければ、割り算に進む確率は約 `max / 2³²` で、ほぼゼロです。
- **偏りがない**: `%` だけの方法と違い、どの値も厳密に同じ確率で出ます。サイコロやシャッフルの公平さに直結します。
- **取り直しはめったに起きない**: 捨てる割合は最大でも約半分（max が 2³¹ より少し大きい場合）で、ふつうの max では無視できるほど小さいので、ループはほぼ 1 回で終わります。
- **64 ビット版も同じ形**: `NextUInt64` は、`Math.BigMul` で 128 ビットの積を求めて同じことをしています。

## まとめ

- `乱数 % max` は遅いうえに偏る。
- 「乱数 × max の上位ビット」で範囲内の値を作り、偏る部分だけ捨てて引き直すと、速くて公平。
- まず安い比較でふるい落としてから、高い計算をするのは高速化の基本。
