---
title: "値を最小と最大の範囲に収める Math.Clamp"
description: ".NET の Math.Clamp(int, int, int)。値が範囲より小さければ最小値、大きければ最大値を返す。最小が最大より大きい誤った指定は例外で知らせる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [616, 634]
function: "Math.Clamp(int, int, int)"
difficulty: 1
format: 2
tags: [数値計算, 防御的プログラミング, 可読性]
---

## ひとことで

`Math.Clamp(value, min, max)` は、`value` を **`min` と `max` の範囲の中に収めた値** を返す関数です。
たとえば `Clamp(15, 0, 10)` は `10` を返し、`Clamp(-3, 0, 10)` は `0` を返します。範囲の中の値は、そのまま返します。

音量の調整や、画面の座標を画面の内側に収める処理などで使われます。

## コード

```csharp:line-numbers=616
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int Clamp(int value, int min, int max)
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

- **範囲（はんい）**: `min` 以上 `max` 以下の数の集まりです。
- **`if` と `else if`**: 条件に合う場合だけ、その処理を行う書き方です。
- **例外（exception）**: 処理を続けられない異常を知らせる仕組みです。`ThrowMinMaxException` は、その例外を投げる関数です。
- **`AggressiveInlining`**: 呼び出しの場所に関数の中身を直接入れるように、コンパイラへ頼む印です。短い関数を速くするために使います。

## 何をしているか

### 1. 範囲が正しいかを確かめる

```csharp:line-numbers=619
            if (min > max)
            {
                ThrowMinMaxException(min, max);
            }
```

`min` が `max` より大きいと、範囲が作れません。その場合は例外を投げて、呼び出し側に間違いを知らせます。

### 2. 最小より小さければ最小を返す

```csharp:line-numbers=624
            if (value < min)
            {
                return min;
            }
```

`value` が `min` より小さい場合は、`min` を返します。

### 3. 最大より大きければ最大を返す

```csharp:line-numbers=628
            else if (value > max)
            {
                return max;
            }
```

`value` が `max` より大きい場合は、`max` を返します。

### 4. 範囲の中ならそのまま返す

```csharp:line-numbers=633
            return value;
```

どちらにも当てはまらなければ、`value` は範囲の中にあるので、そのまま返します。

## ここがすごい

- **条件の順番が明快**: 「小さすぎるか」「大きすぎるか」「そのまま」の 3 つに分けて、読みやすく書いています。
- **不正な指定を早く見つける**: `min > max` は、どんな値でも範囲に入れられない誤りです。最初に例外で知らせるので、原因を探しやすくなります。
- **分岐が少ない**: 値と範囲を比べるのは多くても 2 回です。短い関数なので、コンパイラが呼び出しの場所に直接展開しやすくなっています。
- **型ごとに用意**: `int`、`long`、`double` など、型ごとに同じ考え方の関数が用意されています。

## まとめ

- `Clamp` は、値を `min` と `max` の範囲に収めて返す。
- 最小より小さければ最小、最大より大きければ最大、それ以外はそのまま返す。
- `min > max` の誤った指定は、例外で早く知らせる。
