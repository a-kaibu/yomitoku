---
title: "小数を、下限と上限の範囲に収める（NaN はそのまま）"
description: ".NET Runtime の Math.Clamp(double, double, double)。下限より小さければ下限、上限より大きければ上限を返す。下限が上限より大きいときは例外。NaN は比較が偽になり、そのまま返る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [577, 594]
function: "Math.Clamp(double, double, double)"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`Math.Clamp(value, min, max)` は、値を **下限（`min`）と上限（`max`）の範囲に収める** 関数です。
たとえば `15.0` を `0.0` から `10.0` の範囲に収めると、`10.0` になります。

範囲の中にあれば、値はそのまま返ります。

## コード

```csharp:line-numbers=577
        public static double Clamp(double value, double min, double max)
        {
            if (min > max)
            {
                ThrowMinMaxException(min, max);
            }

            if (value < min)
            {
                return min;
            }
            else if (value > max)
            {
                return max;
            }

            return value;
        }
```

## 前提知識

- **下限と上限**: 値が取りうる最小と最大です。範囲の外に出た値を、この境界に寄せます。
- **`double`**: 小数を表す型です。`NaN`（数でないこと）という特別な値があります。
- **`NaN` と比較**: `NaN` は、`<` も `>` も、どちらも `false` になります。
- **`ThrowMinMaxException`**: 下限が上限より大きいときに投げる、例外を作る内部の関数です。

## 何をしているか

### 1. 範囲が正しいか確かめる

```csharp:line-numbers=579
            if (min > max)
            {
                ThrowMinMaxException(min, max);
            }
```

下限が上限より大きければ、範囲として成り立たないので、例外を投げます。

### 2. 下限より小さければ下限

```csharp:line-numbers=584
            if (value < min)
            {
                return min;
            }
```

値が下限より小さければ、下限を返します。

### 3. 上限より大きければ上限

```csharp:line-numbers=588
            else if (value > max)
            {
                return max;
            }
```

値が上限より大きければ、上限を返します。

### 4. 範囲の中ならそのまま

```csharp:line-numbers=593
            return value;
```

上の 2 つに当てはまらなければ、値をそのまま返します。

## ここがすごい

- **比較の順番が効いている**: 下限を先に調べるので、`else if` で上限だけを調べれば済みます。
- **NaN は通過する**: `NaN` は、どちらの比較も偽になるため、範囲の判定に当てはまらず、そのまま返ります。
- **不正な範囲を見逃さない**: 下限が上限より大きい場合は、例外で知らせます。

## まとめ

- 下限が上限より大きいなら、例外を投げる。
- 値が下限より小さければ下限、上限より大きければ上限を返す。
- 範囲の中なら、値をそのまま返す。
