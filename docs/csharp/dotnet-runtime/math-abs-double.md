---
title: "小数の符号ビットだけを 0 にして、絶対値を求める"
description: ".NET の Math.Abs(double)。小数を 64 ビットの並びとして見て、最上位の符号ビットだけを 0 にする。比較や分岐を使わず、正負を問わず絶対値が得られる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [126, 132]
function: "Math.Abs(double)"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`Math.Abs(value)` は、小数の **絶対値**（符号を取り除いた大きさ）を返す関数です。
たとえば `-2.5` は `2.5`、`2.5` もそのまま `2.5` になります。

普通なら「負かどうか」を `if` で調べて、負なら `-value` にします。この実装では、その分岐を使わず、**符号を表すビットを 0 にする** だけで絶対値を得ています。

## コード

```csharp:line-numbers=126
        public static double Abs(double value)
        {
            const ulong mask = 0x7FFFFFFFFFFFFFFF;
            ulong raw = BitConverter.DoubleToUInt64Bits(value);

            return BitConverter.UInt64BitsToDouble(raw & mask);
        }
```

## 前提知識

- **浮動小数点数（小数）**: 小数を、符号・指数・仮数の 3 つの部分に分けて、64 ビットで表す形式です。IEEE 754 という規格で決められています。
- **符号ビット**: 64 ビットの最上位（一番左）のビットです。`1` なら負、`0` なら正を表します。
- **`BitConverter.DoubleToUInt64Bits`**: 小数の 64 ビットの並びを、そのまま整数として取り出します。値の変換ではなく、ビットの見方を変える操作です。
- **マスク（`0x7FFFFFFFFFFFFFFF`）**: 特定のビットだけを残すための値です。この値は、最上位以外のビットがすべて 1 になっています。
- **`&`（論理積）**: 両方が 1 のときだけ 1 にする演算です。マスクと AND すると、0 にしたいビットが 0 になります。

## 何をしているか

### 1. 小数のビットを整数として見る

```csharp:line-numbers=128
            const ulong mask = 0x7FFFFFFFFFFFFFFF;
            ulong raw = BitConverter.DoubleToUInt64Bits(value);
```

`value` の 64 ビットの並びを、`ulong` の整数 `raw` として取り出します。

### 2. 符号ビットだけを 0 にする

```csharp:line-numbers=131
            return BitConverter.UInt64BitsToDouble(raw & mask);
```

`raw & mask` で、最上位のビットだけが 0 になり、他のビットは変わりません。その並びを、もう一度小数として読み直して返します。

### 具体例で確かめる

`-2.5` の符号ビットは `1` です。マスクと AND すると、その `1` が `0` になり、残りのビットは同じままです。そのため、結果は `2.5` になります。`2.5` は符号ビットがもともと `0` なので、値は変わりません。

## ここがすごい

- **分岐がない**: 正か負かを `if` で調べないので、どんな値でも同じ速さで計算できます。CPU の分岐予測の失敗も起きません。
- **値の計算を使わない**: 負の数を `-value` にする計算をせず、ビットを 1 つ消すだけです。
- **特殊な値も正しく扱う**: `-0.0` は `0.0` になります。無限大も、符号だけが取り除かれて正しく扱えます。
- **`float` も同じ考え方**: `float` の版は、32 ビットの符号ビットを同じ方法で消しています。

## まとめ

- `Math.Abs(double)` は、64 ビットの小数の最上位（符号）ビットだけを 0 にして、絶対値を得る。
- 分岐も計算も使わず、マスクと AND だけで済むので速い。
- 負のゼロや無限大も、符号だけが取り除かれて正しく扱われる。
