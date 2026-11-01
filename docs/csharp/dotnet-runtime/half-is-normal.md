---
title: "16 ビット浮動小数点数が正規化された数かを、1 回の比較で判定する"
description: ".NET Runtime の Half.IsNormal。符号を除いたビットから最小の正規化数を引き、符号なしの範囲比較 1 回で、0・非正規化数・無限大・NaN を除外する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Half.cs
lines: [302, 306]
function: "Half.IsNormal(Half)"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`Half.IsNormal` は、`Half` の値が **正規化された数**（0 でも、非正規化数でも、無限大でも、NaN でもない普通の数）かを調べる関数です。
たとえば `1.0` や `-2.5` は `true` です。`0`、とても小さな値、無限大、NaN は `false` です。

判定の範囲を、ビットの並びの 1 つの区間として表し、比較 1 回で答えを出しています。

## コード

```csharp:line-numbers=302
        public static bool IsNormal(Half value)
        {
            uint bits = value._value;
            return (ushort)((bits & ~SignMask) - SmallestNormalBits) < (PositiveInfinityBits - SmallestNormalBits);
        }
```

## 前提知識

- **正規化数と非正規化数**: 浮動小数点数は、指数が 0 でない通常の数（正規化数）と、指数が 0 で仮数だけで表す小さな数（非正規化数）に分かれます。
- **`SmallestNormalBits`**: 最小の正規化数のビット表現です（`0x0400`）。
- **`PositiveInfinityBits`**: 正の無限大のビット表現です（`0x7C00`）。
- **符号なしの引き算の折り返し**: 0 より小さい値を引くと、大きな正の数に折り返されます。この性質を、範囲の判定に使います。
- **`ushort` へのキャスト**: 結果を 16 ビットに切り詰める指定です。

## 何をしているか

### 1. 符号を除いたビットを取り出す

```csharp:line-numbers=304
            uint bits = value._value;
            return (ushort)((bits & ~SignMask) - SmallestNormalBits) < (PositiveInfinityBits - SmallestNormalBits);
```

`bits & ~SignMask` で、符号を除いた大きさのビットを取り出します。ここでは、正の数だけを考えれば済みます。

### 2. 最小の正規化数を引く

```csharp:line-numbers=305
            return (ushort)((bits & ~SignMask) - SmallestNormalBits) < (PositiveInfinityBits - SmallestNormalBits);
```

大きさのビットから `SmallestNormalBits`（`0x0400`）を引きます。最小の正規化数のとき、結果は 0 になります。

### 3. 範囲の上限と比べる

```csharp:line-numbers=305
            return (ushort)((bits & ~SignMask) - SmallestNormalBits) < (PositiveInfinityBits - SmallestNormalBits);
```

引いた結果が、`PositiveInfinityBits - SmallestNormalBits`（`0x7800`）より小さければ、正規化数の範囲に入っています。

このとき、0 は引き算で大きな値に折り返され、非正規化数も同じように折り返されます。無限大と NaN は、引いても範囲の上限を超えます。だから、1 つの比較で 4 種類を同時に外せます。

## ここがすごい

- **範囲判定を 1 回に畳む**: 「0 ではない」「無限大ではない」「NaN ではない」「非正規化数ではない」を、個別に比べずに済みます。
- **折り返しを利用**: 符号なしの性質を使い、下限の判定と上限の判定を、1 つの比較にまとめています。
- **符号を無視**: 符号を除いてから判定するので、正と負の数で同じ処理になります。

## まとめ

- 符号を除いた大きさのビットを取り出す。
- 最小の正規化数を引いて、範囲の上限と比べる。
- 0・非正規化数・無限大・NaN は、1 回の比較で同時に外れる。
