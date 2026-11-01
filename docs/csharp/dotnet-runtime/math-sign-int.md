---
title: "整数の符号を、分岐なしで -1・0・1 のいずれかにする"
description: ".NET Runtime の Math.Sign(int)。算術シフトと符号なしシフトの組み合わせで、if を使わずに負なら -1、正なら 1、0 なら 0 を返す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [1470, 1473]
function: "Math.Sign(int)"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 数値計算]
---

## ひとことで

`Math.Sign(int)` は、整数の **符号** を求める関数です。負なら `-1`、0 なら `0`、正なら `1` を返します。
たとえば `-5` は `-1`、`0` は `0`、`7` は `1` になります。

`if` で分けずに、ビットのシフトと論理和（OR）だけで答えを出しています。

## コード

```csharp:line-numbers=1470
        public static int Sign(int value)
        {
            return unchecked(value >> 31 | (int)((uint)-value >> 31));
        }
```

## 前提知識

- **算術シフト（`>>`）**: 右にずらすとき、符号ビットを左側に埋める書き方です。負の数なら、すべてのビットが 1 の `-1` になります。
- **符号なしシフト**: `uint` にキャストしてから右にずらすと、0 が埋められます。
- **論理和（`|`）**: どちらかのビットが 1 なら 1 になる演算です。
- **符号ビット**: 最上位のビットです。`int` では、このビットが 1 のとき負の数になります。
- **`unchecked`**: 整数の計算で、溢れたときに例外にせず、折り返す指定です。

## 何をしているか

### 1. 負の数なら、すべてのビットを 1 にする

```csharp:line-numbers=1472
            return unchecked(value >> 31 | (int)((uint)-value >> 31));
```

`value >> 31` は、符号ビットを全部のビットに広げます。負の数なら `-1`（すべてのビットが 1）、0 以上なら `0` になります。

### 2. 正の数の印を作る

```csharp:line-numbers=1472
            return unchecked(value >> 31 | (int)((uint)-value >> 31));
```

`-value` を `uint` にして、31 ビット右にずらすと、`value` が 1 以上のときだけ `1` になります。`-5` のときは `(uint)5 >> 31` で `0` になり、`7` のときは `(uint)-7 >> 31` で `1` になります。

### 3. 2 つを OR で合わせる

```csharp:line-numbers=1472
            return unchecked(value >> 31 | (int)((uint)-value >> 31));
```

2 つの結果を `|` で合わせます。負の数では `-1 | 0 = -1` です。正の数では `0 | 1 = 1` です。0 では `0 | 0 = 0` です。

## ここがすごい

- **分岐がない**: `if` を使わないので、どの値が来ても同じ命令の流れで答えが出ます。CPU が予測しにくい値でも遅くなりにくいです。
- **`int.MinValue` でも正しい**: `-value` は溢れて、そのままの値になりますが、符号ビットの扱いは正しく、結果は `-1` になります。
- **短い式**: 1 行の式なので、符号の判定を書き写す手間がありません。

## まとめ

- `value >> 31` で、負なら `-1`、そうでなければ `0` を作る。
- `(uint)-value >> 31` で、正なら `1`、そうでなければ `0` を作る。
- 2 つを OR で合わせると、符号が得られる。
