---
title: "列に指定した値があるかを、型に合った近道で調べる"
description: ".NET Runtime の Enumerable.Contains。ICollection なら、その Contains を使い、LINQ の内部イテレータなら専用の方法を使う。どちらでもなければ先頭から順に比べる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Contains.cs
lines: [10, 28]
function: "Enumerable.Contains<TSource>(IEnumerable<TSource>, TSource)"
difficulty: 2
format: 2
tags: [探索, 最適化, 型システム]
---

## ひとことで

`Contains(value)` は、列の中に **指定した値があるか** を調べる関数です。
たとえば `1, 2, 3` に `2` があれば `true`、`5` がなければ `false` を返します。

列の型によって、探し方を変えます。探す仕組みを持つ型なら、その仕組みに任せて素早く答えます。

## コード

```csharp:line-numbers=10
        public static bool Contains<TSource>(this IEnumerable<TSource> source, TSource value)
        {
            if (source is ICollection<TSource> collection)
            {
                return collection.Contains(value);
            }

            if (!IsSizeOptimized && source is Iterator<TSource> iterator)
            {
                return iterator.Contains(value);
            }

            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            return ContainsIterate(source, value, null);
        }
```

## 前提知識

- **`ICollection<T>`**: 要素の追加や削除、そして `Contains` を持つ列の約束（インターフェース）です。
- **`Iterator<TSource>`**: LINQ が内部で使う列の型です。`Contains` を専用に実装しているものがあります。
- **`IsSizeOptimized`**: サイズを小さくするビルドかどうかを表す値です。ここでは、その場合は専用の方法を使わない、という分岐に使われています。
- **`ContainsIterate`**: 先頭から順に比べて探す、内部の関数です。

## 何をしているか

### 1. 列が ICollection なら、その Contains を使う

```csharp:line-numbers=12
            if (source is ICollection<TSource> collection)
            {
                return collection.Contains(value);
```

`ICollection<TSource>` なら、その型が持つ `Contains` に任せます。配列や `HashSet<T>` などは、ここで素早く答えられます。

### 2. 内部イテレータなら、専用の方法を使う

```csharp:line-numbers=17
            if (!IsSizeOptimized && source is Iterator<TSource> iterator)
            {
                return iterator.Contains(value);
            }
```

サイズを優先するビルドでなければ、内部イテレータの `Contains` を使います。

### 3. 近道がなければ、順に比べる

```csharp:line-numbers=22
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            return ContainsIterate(source, value, null);
```

`null` を確かめてから、`ContainsIterate` で先頭から 1 つずつ比べます。値が見つかれば、そこで止まります。

## ここがすごい

- **型の仕組みを使う**: `HashSet<T>` のように、値を素早く探せる型では、列を全部たどらずに答えが出ます。
- **見つかったら止まる**: 近道がない場合も、一致した時点で残りを読まずに終わります。
- **型ごとに分岐**: 1 つの関数で、配列、集合、LINQ の列を、それぞれ最適な方法で扱えます。

## まとめ

- `ICollection<T>` なら、その `Contains` に任せる。
- 内部イテレータなら、専用の方法を使う。
- それ以外は、先頭から順に比べ、見つかれば止まる。
