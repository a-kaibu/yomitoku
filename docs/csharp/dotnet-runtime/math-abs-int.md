---
title: "整数の絶対値を求め、最小値だけ例外にする"
description: ".NET Runtime の Math.Abs(int)。負の数の符号を反転させて絶対値を作る。int.MinValue は正の数にできないため、溢れを検出して例外を投げる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [59, 70]
function: "Math.Abs(int)"
difficulty: 2
format: 2
tags: [数値計算, エラー処理, 防御的プログラミング]
---

## ひとことで

`Math.Abs(int)` は、整数の **絶対値**（符号を取り除いた大きさ）を返す関数です。
たとえば `-5` は `5`、`7` は `7` になります。

ただし、`int` の最小値 `int.MinValue`（-2147483648）だけは、同じ型の正の数に収まりません。そのため、この場合は例外を投げます。

## コード

```csharp:line-numbers=59
        public static int Abs(int value)
        {
            if (value < 0)
            {
                value = -value;
                if (value < 0)
                {
                    ThrowNegateTwosCompOverflow();
                }
            }
            return value;
        }
```

## 前提知識

- **絶対値**: 0 からの距離です。符号を取り除いた数になります。
- **`int` の範囲**: `int` は -2147483648 から 2147483647 までの値を表せます。正の方は、最小値の絶対値より 1 小さいです。
- **溢れ（オーバーフロー）**: 計算結果が型の範囲を超えることです。C# の既定では、溢れても例外にならず、値が折り返されます。
- **`OverflowException`**: 数の溢れが起きたときに投げられる例外です。

## 何をしているか

### 1. 負の数かを確かめる

```csharp:line-numbers=61
            if (value < 0)
```

値が 0 より小さければ、負の数なので符号を反転する必要があります。0 以上なら、そのまま返します。

### 2. 符号を反転する

```csharp:line-numbers=63
                value = -value;
```

`value = -value` で、符号を反転させます。`-5` は `5` になります。

### 3. 溢れていないかを確かめる

```csharp:line-numbers=64
                if (value < 0)
                {
                    ThrowNegateTwosCompOverflow();
                }
```

反転したあとも負のままなら、溢れています。これは `int.MinValue` の場合だけ起きます。`-2147483648` の正の数は、`int` の範囲に入らないためです。この場合は `ThrowNegateTwosCompOverflow` で例外を投げます。

### 4. 値を返す

```csharp:line-numbers=69
            return value;
```

溢れていなければ、結果の値を返します。

## ここがすごい

- **溢れを明示する**: 最小値の絶対値を黙って誤った値にせず、例外で知らせます。呼び出し側が誤った結果を使うことを防げます。
- **判定が 1 回だけ**: 反転のあとに符号を見るだけなので、余計な計算がありません。
- **通常の値は速く返る**: 負でない数は、比較 1 回だけで返ります。

## まとめ

- 負の数なら符号を反転させる。
- 反転しても負のままなら、`int.MinValue` なので例外にする。
- それ以外は、絶対値をそのまま返す。
