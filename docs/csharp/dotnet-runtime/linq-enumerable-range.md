---
title: "開始の値と個数から、連続する整数の列を作る（溢れを先に確かめる）"
description: ".NET Runtime の Enumerable.Range。開始と個数から最後の値を long で計算し、int の範囲を超えないか確かめてから、遅延評価の列を作る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Range.cs
lines: [12, 26]
function: "Enumerable.Range(int, int)"
difficulty: 2
format: 2
tags: [防御的プログラミング, 遅延評価, 数値計算]
---

## ひとことで

`Enumerable.Range(start, count)` は、`start` から始まり、`count` 個の連続する整数を並べた列を返す関数です。
たとえば `Range(5, 3)` は `5, 6, 7` になります。

最後の値が `int` の範囲を超えるなら、例外を投げます。

## コード

```csharp:line-numbers=12
        public static IEnumerable<int> Range(int start, int count)
        {
            long max = ((long)start) + count - 1;
            if (count < 0 || max > int.MaxValue)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.count);
            }

            if (count == 0)
            {
                return [];
            }

            return new RangeIterator<int>(start, start + count);
        }
```

## 前提知識

- **`int` の範囲**: `int` が表せる最大値は `int.MaxValue`（2147483647）です。これを超える値は、折り返して誤った値になります。
- **`long`**: `int` より大きな範囲を表せる整数型です。途中の計算を `long` で行えば、溢れを避けられます。
- **遅延評価（`RangeIterator`）**: 列を作った時点では全部の数を並べず、必要になったときに 1 つずつ返す仕組みです。
- **空の配列 `[]`**: 要素が 0 個の列を表す書き方です。

## 何をしているか

### 1. 最後の値を long で計算する

```csharp:line-numbers=14
            long max = ((long)start) + count - 1;
```

最後の値は、`start + count - 1` です。`long` で計算するので、`int` の範囲を超えても溢れずに値を比べられます。

### 2. 個数が負か、範囲を超えるかを確かめる

```csharp:line-numbers=15
            if (count < 0 || max > int.MaxValue)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.count);
```

個数が負なら、例外を投げます。最後の値が `int.MaxValue` を超える場合も、例外を投げます。

### 3. 個数が 0 なら空の列を返す

```csharp:line-numbers=20
            if (count == 0)
            {
                return [];
            }
```

個数が 0 なら、要素のない列を返します。

### 4. 遅延評価の列を作る

```csharp:line-numbers=25
            return new RangeIterator<int>(start, start + count);
```

それ以外は、`RangeIterator` で列を作ります。数はこの時点では計算されず、列を読むときに 1 つずつ作られます。

## ここがすごい

- **溢れを先に検出する**: 値を作ってから確かめるのではなく、`long` の計算で最後の値を先に確かめるので、誤った値が列に混じりません。
- **空の場合を特別扱い**: 個数が 0 なら、イテレータを作らずに空の列を返します。
- **必要な分だけ作る**: 大きな範囲でも、全部の数を配列に並べずに済みます。

## まとめ

- 最後の値を `long` で計算し、`int` の範囲を超えないか確かめる。
- 個数が負か範囲外なら例外、0 なら空の列を返す。
- それ以外は、読むときに 1 つずつ値を作る列を返す。
