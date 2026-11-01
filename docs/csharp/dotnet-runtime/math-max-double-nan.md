---
title: "小数の最大値を求めるとき、NaN と -0 の扱いを決めておく"
description: ".NET の Math.Max(double, double)。大きい方を返すが、どちらかが NaN なら NaN を返し、+0 と -0 は +0 を大きいとみなす。IEEE 754 の maximum 関数に合わせた動き。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [955, 974]
function: "Math.Max(double, double)"
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`Math.Max(a, b)` は、2 つの小数のうち **大きい方** を返す関数です。
ただし小数には、普通の大小では決められない特別な値があります。`NaN`（数ではないことを表す値）と、`+0` と `-0`（どちらも 0 だが符号が違う値）です。この関数は、その扱いを決めています。

たとえば `Max(1.0, 2.0)` は `2.0`、`Max(NaN, 1.0)` は `NaN`、`Max(0.0, -0.0)` は `0.0` になります。

## コード

::: code-group

```csharp:line-numbers=955 [日本語訳]
        public static double Max(double val1, double val2)
        {
            // IEEE 754:2019 の maximum 関数と同じ動きに合わせている。
            //
            // 入力に NaN があれば、その NaN を呼び出し側へそのまま返す。
            // それ以外は、大きい方の値を返す。
            // 仕様どおり、+0 は -0 より大きいとみなす。

            if (val1 != val2)
            {
                if (!double.IsNaN(val1))
                {
                    return val2 < val1 ? val1 : val2;
                }

                return val1;
            }

            return double.IsNegative(val2) ? val1 : val2;
        }
```

```csharp:line-numbers=955 [原文]
        public static double Max(double val1, double val2)
        {
            // This matches the IEEE 754:2019 `maximum` function
            //
            // It propagates NaN inputs back to the caller and
            // otherwise returns the greater of the inputs. It
            // treats +0 as greater than -0 as per the specification.

            if (val1 != val2)
            {
                if (!double.IsNaN(val1))
                {
                    return val2 < val1 ? val1 : val2;
                }

                return val1;
            }

            return double.IsNegative(val2) ? val1 : val2;
        }
```

:::

## 前提知識

- **NaN（非数）**: 0 で割った結果など、数として表せない値です。NaN と何を比べても、大小は判定できません。
- **`-0.0`**: 符号付きの 0 です。計算上は `0.0` と等しいと比べられますが、符号のビットは違います。
- **IEEE 754**: 小数の表し方と計算の決まりを定めた規格です。`maximum` は、その中で定められた最大値の関数です。
- **`double.IsNaN`**: 値が NaN かどうかを調べる関数です。
- **`double.IsNegative`**: 符号のビットが 1 かどうかを調べる関数です。`-0.0` も負と判定されます。

## 何をしているか

### 1. 値が同じでないときの判定

```csharp:line-numbers=963
            if (val1 != val2)
            {
                if (!double.IsNaN(val1))
                {
                    return val2 < val1 ? val1 : val2;
                }
```

2 つの値が同じでなければ、`val1` が NaN でないことを確かめます。NaN でなければ、大きい方を返します。

### 2. NaN が絡むとき

```csharp:line-numbers=969

                return val1;
            }
```

`val1` が NaN なら、`val1` を返します。

### 3. 値が同じとき（0 の符号を比べる）

```csharp:line-numbers=973
            return double.IsNegative(val2) ? val1 : val2;
```

値が同じときは、`val2` の符号を調べます。`val2` が負（`-0.0`）なら `val1` を、そうでなければ `val2` を返します。これで、`+0` が `-0` より大きい、という決まりを守ります。

### 具体例で確かめる

```
Max(1.0, 2.0)   → 値が違う → 大きい方 2.0
Max(NaN, 1.0)   → val1 が NaN → NaN
Max(0.0, -0.0)  → 値が同じ → val2 は負 → val1 の 0.0
Max(-0.0, 0.0)  → 値が同じ → val2 は負でない → val2 の 0.0
```

## ここがすごい

- **NaN を隠さない**: 欠けた値を大きい数で置き換えると、計算の誤りが見えなくなります。NaN をそのまま返すので、問題が伝わります。
- **0 の符号まで決める**: `+0` と `-0` のどちらを返すかを、明確に決めています。後の計算で符号が影響する場合にも、結果が安定します。
- **規格に合わせる**: IEEE 754 の `maximum` と同じ動きなので、他の言語や計算ライブラリとも結果がそろいます。
- **通常の場合は速い**: 値が違い、NaN でもなければ、比べて返すだけの短い経路を通ります。

## まとめ

- `Math.Max(double, double)` は、大きい方を返すが、NaN があればその NaN を返す。
- 値が同じときは符号を比べ、`+0` を `-0` より大きいとみなす。
- IEEE 754 の `maximum` に合わせ、計算結果が規格どおりになるように作られている。
