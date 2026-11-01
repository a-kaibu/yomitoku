---
title: "数の範囲を、一般化した型で刻み幅を付けて順に生成する"
description: "MoreLINQ の Sequence<T>(start, stop, step)。INumber<T> を使って、どの数値型でも動く等差数列を作る。加算が溢れたら例外ではなく、そこで列を終える。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Sequence.cs
lines: [79, 96]
function: "MoreEnumerable.Sequence<T>(T, T, T)"
difficulty: 3
format: 2
tags: [数値計算, イテレータ, エラー処理]
---

## ひとことで

`Sequence(start, stop, step)` は、`start` から始まり、`stop` を超えないように `step` ずつ増やした数列を、順に返す関数です。
たとえば `1, 10, 3` なら、`1, 4, 7, 10` が返ります。

この版は、`int` だけでなく、`INumber<T>` の条件を満たす **どの数値型でも** 使えるように書かれています。

## コード

```csharp:line-numbers=79
        public static IEnumerable<T> Sequence<T>(T start, T stop, T step)
            where T : INumber<T>
        {
            var current = start;

            while (step >= T.Zero ? stop >= current : stop <= current)
            {
                yield return current;
                try
                {
                    current = checked(current + step);
                }
                catch (OverflowException)
                {
                    yield break;
                }
            }
        }
```

## 前提知識

- **`INumber<T>`**: 加減算や比較などの数値の操作を、型の約束として表したインターフェースです。`int` や `double` などが実装しています。
- **`T.Zero` と `T.One`**: 型 `T` の 0 と 1 を表す、静的な値です。
- **`checked`**: 演算の結果が型の範囲を超えたら、`OverflowException` を投げる指定です。
- **`yield break`**: 列の終わりを示して、それ以上の値を返さない書き方です。
- **刻み幅（step）の符号**: 正なら増やす方向、負なら減らす方向です。

## 何をしているか

### 1. 最初の値を用意する

```csharp:line-numbers=82
            var current = start;
```

`current` を `start` で用意します。

### 2. 続けてよいかを調べる

```csharp:line-numbers=84
            while (step >= T.Zero ? stop >= current : stop <= current)
```

`step` が 0 以上なら、`current` が `stop` 以下の間、続けます。負なら、`current` が `stop` 以上の間続けます。これで、増やす方向と減らす方向の両方に対応します。

### 3. 今の値を返す

```csharp:line-numbers=86
                yield return current;
```

条件を満たしたら、今の値を 1 つ返します。

### 4. 次の値を、溢れを検出しながら作る

```csharp:line-numbers=89
                    current = checked(current + step);
```

`checked` の中で `current + step` を計算します。型の範囲を超えたら、例外になります。

### 5. 溢れたら列を終える

```csharp:line-numbers=91
                catch (OverflowException)
                {
                    yield break;
```

溢れたときは、例外を外に出さず、`yield break` で列を終えます。たとえば `byte` の `250` から `255` まで `3` ずつ進めると、`250, 253` のあと、次の加算で溢れて終わります。

## ここがすごい

- **型を選ばない**: `INumber<T>` の約束だけを使うので、1 つの関数で `int`、`long`、`double` などに対応できます。
- **溢れを安全に扱う**: 計算が型を超えたときに、誤った値を返さず、列をきれいに終えます。
- **方向を符号で決める**: `step` の符号だけで、増やす場合と減らす場合を分けています。

## まとめ

- `step` の符号で、増やす方向か減らす方向かを決める。
- 値を返してから、`checked` で次の値を作る。
- 溢れたら例外を外に出さず、列を終える。
