---
title: "小数の秒やミリ秒を、tick の整数に変えて時間の長さを作る"
description: ".NET の TimeSpan.Interval と IntervalFromDoubleTicks。FromMilliseconds などが、小数の値に単位の tick 数を掛けて、整数の tick に変える。NaN と範囲外は例外で知らせる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/TimeSpan.cs
lines: [636, 656]
function: "TimeSpan.Interval(double, double) / IntervalFromDoubleTicks(double)"
difficulty: 2
format: 2
tags: [日時, 数値計算, 防御的プログラミング]
---

## ひとことで

`TimeSpan.FromMilliseconds(value)` のような関数は、小数で与えられた時間を、`TimeSpan` の中身である **tick**（100 ナノ秒が 1 単位の整数）に変えて作ります。
この部分が、その変換を担当しています。たとえば `FromMilliseconds(1.5)` は、15000 tick の時間になります。

## コード

```csharp:line-numbers=636
        private static TimeSpan Interval(double value, double scale)
        {
            if (double.IsNaN(value))
            {
                ThrowHelper.ThrowArgumentException_Arg_CannotBeNaN();
            }
            return IntervalFromDoubleTicks(value * scale);
        }

        private static TimeSpan IntervalFromDoubleTicks(double ticks)
        {
            if ((ticks > MaxTicks) || (ticks < MinTicks) || double.IsNaN(ticks))
            {
                ThrowHelper.ThrowOverflowException_TimeSpanTooLong();
            }
            if (ticks == MaxTicks)
            {
                return MaxValue;
            }
            return new TimeSpan((long)ticks);
        }
```

## 前提知識

- **tick**: `TimeSpan` と `DateTime` が持つ時間の単位です。1 tick は 100 ナノ秒です。1 ミリ秒は 10,000 tick です。
- **`TimeSpan`**: 時間の長さを表す型です。中身は、tick の数を 1 つの整数で持っています。
- **NaN（非数）**: 数として表せない小数の値です。時間の長さとしては意味がないので、例外にします。
- **`(long)` のキャスト**: 小数を整数にする操作です。小数点以下は切り捨てられ、0 に近い方へ寄ります。
- **`OverflowException`**: 値が表せる範囲を超えたときに投げる例外です。

## 何をしているか

### 1. NaN を弾く（Interval）

```csharp:line-numbers=638
            if (double.IsNaN(value))
            {
                ThrowHelper.ThrowArgumentException_Arg_CannotBeNaN();
            }
            return IntervalFromDoubleTicks(value * scale);
```

`Interval` は、まず値が NaN でないかを確かめます。NaN なら例外を投げます。そのあと、値に単位の tick 数（`scale`）を掛けて、tick の小数を作ります。

### 2. 範囲を確かめる（IntervalFromDoubleTicks）

```csharp:line-numbers=647
            if ((ticks > MaxTicks) || (ticks < MinTicks) || double.IsNaN(ticks))
            {
                ThrowHelper.ThrowOverflowException_TimeSpanTooLong();
            }
```

tick の値が、表せる最小から最大の範囲を外れていれば、オーバーフローの例外を投げます。NaN もここで弾きます。

### 3. 最大値だけ特別扱い

```csharp:line-numbers=651
            if (ticks == MaxTicks)
            {
                return MaxValue;
            }
```

tick がちょうど最大値なら、`TimeSpan.MaxValue` を返します。

### 4. 整数の tick に変えて返す

```csharp:line-numbers=655
            return new TimeSpan((long)ticks);
```

最後に、小数の tick を `long` に切り捨てて、`TimeSpan` を作ります。

### 具体例で確かめる

`TimeSpan.FromMilliseconds(1.5)` の場合、`scale` は 1 ミリ秒の tick 数 10,000 です。

```
1.5 × 10000 = 15000.0 tick
(long) 15000.0 = 15000 tick → 1.5 ミリ秒
```

小数点以下の tick は、切り捨てられます。`0.00005` ミリ秒は 0.5 tick なので、結果は 0 tick になります。

## ここがすごい

- **1 つの変換の流れに統一**: `FromSeconds` や `FromMilliseconds` など、どの単位の関数も、同じ `Interval` を通ります。
- **不正な値を早く弾く**: NaN と範囲外を、変換の前に確かめるので、おかしな時間が作られることがありません。
- **最大値を正しく扱う**: 小数の計算で最大値の境界に丸められたときも、`MaxValue` として正しく返します。
- **切り捨ての動きが明確**: 小数の tick は、切り捨てで整数にします。挙動が一定なので、結果を予想しやすくなります。

## まとめ

- `Interval` は、NaN を弾き、小数の値に単位の tick 数を掛ける。
- `IntervalFromDoubleTicks` は、範囲外と NaN を例外にし、最大値を特別扱いする。
- 最後に小数の tick を整数に切り捨てて、`TimeSpan` の中身にする。
