---
title: "符号付きの 64 ビット掛け算で、上位の部分を補正する"
description: ".NET Runtime の Math.BigMul(long, long, out long)。符号なしの積を求めたあと、負の数の分だけ上位の値を補正して、符号付きの 128 ビットの積を得る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [256, 274]
function: "Math.BigMul(long, long, out long)"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, 低レイヤ]
---

## ひとことで

`BigMul(long, long, out long)` は、符号付きの 64 ビットの数どうしを掛けたときの積を、**上位 64 ビット** と **下位 64 ビット** に分けて返す関数です。
戻り値が上位、`low` が下位になります。

符号付きの数は、負の数をビットで表すと、符号なしの数とは違う値になります。そのため、符号なしの積を求めたあとで、補正しています。

## コード

::: code-group

```csharp:line-numbers=256 [日本語訳]
        public static long BigMul(long a, long b, out long low)
        {
#if !MONO // MONO では X86Base.BigMul が未実装のため、この部分を除く
            if (X86Base.X64.IsSupported)
            {
                (low, long hi) = X86Base.X64.BigMul(a, b);
                return hi;
            }
#endif
            if (ArmBase.Arm64.IsSupported)
            {
                low = a * b;
                return ArmBase.Arm64.MultiplyHigh(a, b);
            }

            ulong high = BigMul((ulong)a, (ulong)b, out ulong ulow);
            low = (long)ulow;
            return (long)high - ((a >> 63) & b) - ((b >> 63) & a);
        }
```

```csharp:line-numbers=256 [原文]
        public static long BigMul(long a, long b, out long low)
        {
#if !MONO // X86Base.BigMul is not yet implemented in MONO
            if (X86Base.X64.IsSupported)
            {
                (low, long hi) = X86Base.X64.BigMul(a, b);
                return hi;
            }
#endif
            if (ArmBase.Arm64.IsSupported)
            {
                low = a * b;
                return ArmBase.Arm64.MultiplyHigh(a, b);
            }

            ulong high = BigMul((ulong)a, (ulong)b, out ulong ulow);
            low = (long)ulow;
            return (long)high - ((a >> 63) & b) - ((b >> 63) & a);
        }
```

:::

## 前提知識

- **符号付きの数と符号なしの数**: 同じビットの並びでも、符号付きでは最上位ビットが符号になります。負の数は、符号なしで見ると、非常に大きな正の数になります。
- **`>> 63`**: 符号ビットを全部のビットに広げる算術シフトです。負の数なら `-1`、そうでなければ `0` になります。
- **`&`**: ビットごとの積です。`(a >> 63) & b` は、`a` が負のときだけ `b` を取り出します。
- **上位と下位**: 128 ビットの積の、上の 64 ビットと下の 64 ビットです。
- **ハードウェアの命令**: 一部の CPU には、128 ビットの積を直接求める命令があります。その場合は、その命令を使います。

## 何をしているか

### 1. 専用の命令があれば使う

```csharp:line-numbers=259
            if (X86Base.X64.IsSupported)
            {
                (low, long hi) = X86Base.X64.BigMul(a, b);
                return hi;
            }
```

x64 の CPU で専用の命令が使えるなら、その命令で上位と下位を同時に求めて、上位を返します。

### 2. ARM の専用命令があれば使う

```csharp:line-numbers=265
            if (ArmBase.Arm64.IsSupported)
            {
                low = a * b;
                return ArmBase.Arm64.MultiplyHigh(a, b);
            }
```

ARM64 では、下位は通常の掛け算で求め、上位は専用の命令で求めます。

### 3. 符号なしの積を求める

```csharp:line-numbers=271
            ulong high = BigMul((ulong)a, (ulong)b, out ulong ulow);
            low = (long)ulow;
```

負の数を含めて、ビットの並びをそのまま符号なしの数として扱い、積を求めます。下位は `low` に入れます。

### 4. 負の数の分を補正する

```csharp:line-numbers=273
            return (long)high - ((a >> 63) & b) - ((b >> 63) & a);
```

`a` が負なら `b` を、`b` が負なら `a` を、上位の値から引きます。符号なしとして掛けた結果に、負の数の分の差が含まれているため、この引き算で正しい符号付きの上位が得られます。

## ここがすごい

- **速い経路を先に使う**: 専用の命令がある環境では、補正の計算すら行わずに答えを返します。
- **補正は 2 回のビット積と引き算だけ**: 分岐を使わず、符号のビットを使って補正の値を作ります。
- **符号なしの結果を再利用**: 符号なしの積の関数を呼ぶだけで、符号付きの結果を導けます。

## まとめ

- 専用の命令があれば、それを使う。
- 符号なしとして積を求め、下位を `low` に入れる。
- 負の数の分だけ、上位の値を補正する。
