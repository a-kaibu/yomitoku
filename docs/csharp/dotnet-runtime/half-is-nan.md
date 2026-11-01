---
title: "16 ビット浮動小数点数が NaN かを、ビットの大小で判定する"
description: ".NET Runtime の Half.IsNaN。符号ビットを除いた値が、無限大のビット表現より大きければ NaN とみなす。比較 1 回で判定できる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Half.cs
lines: [272, 276]
function: "Half.IsNaN(Half)"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

`Half.IsNaN` は、16 ビットの小数（`Half`）が **NaN（数でないこと）** かどうかを調べる関数です。
`Half` は、符号 1 ビット、指数 5 ビット、仮数 10 ビットからできています。

この関数は、値のビットを直接見て、比べるだけで判定しています。

## コード

```csharp:line-numbers=272
        public static bool IsNaN(Half value)
        {
            uint bits = value._value;
            return (bits & ~SignMask) > PositiveInfinityBits;
        }
```

## 前提知識

- **`Half`**: 16 ビットの浮動小数点数です。メモリ量を減らしたいときに使われます。
- **NaN（Not a Number）**: 0 で割るなど、数として定義できない結果を表す値です。指数の部分がすべて 1 で、仮数の部分が 0 でないものが NaN です。
- **無限大のビット表現**: 指数がすべて 1 で、仮数が 0 のものです。`Half` では、`0x7C00` が正の無限大になります。
- **`SignMask`**: 符号ビットだけが 1 の値です（`0x8000`）。`~SignMask` は、符号ビット以外を取り出すマスクになります。
- **ビット積（`&`）**: 両方のビットが 1 のときだけ 1 になる演算です。

## 何をしているか

### 1. ビットの並びを読む

```csharp:line-numbers=274
            uint bits = value._value;
```

`Half` の中のビットを、`uint` として読みます。

### 2. 符号ビットを除く

```csharp:line-numbers=275
            return (bits & ~SignMask) > PositiveInfinityBits;
```

`bits & ~SignMask` で、符号ビットを 0 にします。これで、正と負を同じ扱いで比べられます。

### 3. 無限大より大きいかを比べる

```csharp:line-numbers=275
            return (bits & ~SignMask) > PositiveInfinityBits;
```

符号を除いた値が `PositiveInfinityBits`（`0x7C00`）より大きければ、指数がすべて 1 で、仮数が 0 ではない値です。これは NaN です。無限大そのもの（仮数が 0）は、`0x7C00` と等しいので、NaN にはなりません。

## ここがすごい

- **比較 1 回で判定**: 指数や仮数を分けて調べる必要がありません。ビットの大小だけで答えが出ます。
- **符号の影響を受けない**: 符号ビットを先に消しているので、正の NaN と負の NaN を同じように判定できます。
- **無限大との区別**: 境界の値をちょうど外すように比べているので、無限大を NaN と誤って判定しません。

## まとめ

- 符号ビットを除いて、ビットの値を取り出す。
- 無限大のビット表現より大きければ、NaN とみなす。
- 比較 1 回で、指数と仮数の条件をまとめて判定できる。
