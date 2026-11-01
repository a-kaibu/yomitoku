---
title: "列の先頭から、指定した個数を読み飛ばした列を作る"
description: ".NET Runtime の Enumerable.Skip。個数が 0 以下のときは、LINQ 内部の列ならそのまま返し、それ以外は別の列にする。内部イテレータには専用の Skip を使う。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Skip.cs
lines: [10, 39]
function: "Enumerable.Skip<TSource>(IEnumerable<TSource>, int)"
difficulty: 2
format: 2
tags: [遅延評価, 防御的プログラミング, 型システム]
---

## ひとことで

`Skip(count)` は、列の **先頭から `count` 個を飛ばした残り** を返す関数です。
たとえば `1, 2, 3, 4` に `Skip(2)` を使うと、`3, 4` になります。

結果は、読むときに作られる遅延評価の列です。元の列は変わりません。

## コード

::: code-group

```csharp:line-numbers=10 [日本語訳]
        public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count)
        {
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            if (IsEmptyArray(source))
            {
                return [];
            }

            if (count <= 0)
            {
                // 飛ばさない場合は、ソースをそのまま返す。ただし LINQ の内部の型のときだけにする。
                // 参照をほかの目的で使われるときに、別名になる問題を避けるため。
                if (source is Iterator<TSource>)
                {
                    return source;
                }

                count = 0;
            }
            else if (source is Iterator<TSource> iterator)
            {
                return iterator.Skip(count) ?? Empty<TSource>();
            }

            return SpeedOptimizedSkipIterator(source, count);
        }
```

```csharp:line-numbers=10 [原文]
        public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count)
        {
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            if (IsEmptyArray(source))
            {
                return [];
            }

            if (count <= 0)
            {
                // Return source if not actually skipping, but only if it's a type from here, to avoid
                // issues if collections are used as keys or otherwise must not be aliased.
                if (source is Iterator<TSource>)
                {
                    return source;
                }

                count = 0;
            }
            else if (source is Iterator<TSource> iterator)
            {
                return iterator.Skip(count) ?? Empty<TSource>();
            }

            return SpeedOptimizedSkipIterator(source, count);
        }
```

:::

## 前提知識

- **遅延評価**: 結果の列を作った時点では、要素を読まず、読まれたときに 1 つずつ処理する仕組みです。
- **`Iterator<TSource>`**: LINQ が内部で使う列の型です。専用の `Skip` を持っており、近道で飛ばせることがあります。
- **空の配列 `[]`**: 要素が 0 個の列を表す書き方です。
- **別名（エイリアス）**: 同じ列を、2 つの名前で参照することです。ユーザーの列が、そのまま返されると、後で意図しない変更が起きるおそれがあります。

## 何をしているか

### 1. `null` を弾き、空の配列なら空の列を返す

```csharp:line-numbers=12
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            if (IsEmptyArray(source))
            {
                return [];
            }
```

列が `null` なら例外、空の配列なら、飛ばすものがないので空の列を返します。

### 2. 個数が 0 以下のとき

```csharp:line-numbers=22
            if (count <= 0)
            {
                // 飛ばさない場合は、ソースをそのまま返す。ただし LINQ の内部の型のときだけにする。
                // 参照をほかの目的で使われるときに、別名になる問題を避けるため。
                if (source is Iterator<TSource>)
                {
                    return source;
                }

                count = 0;
            }
```

飛ばす個数が 0 以下なら、何も飛ばしません。内部の列なら、そのまま返します。そうでなければ、列を別に扱うため、個数を 0 にして次の処理に進みます。

### 3. 内部イテレータなら、専用の Skip を使う

```csharp:line-numbers=33
            else if (source is Iterator<TSource> iterator)
            {
                return iterator.Skip(count) ?? Empty<TSource>();
            }
```

個数が 1 以上で、内部のイテレータなら、その型の `Skip` を使います。

### 4. それ以外は、読み飛ばす列を作る

```csharp:line-numbers=38
            return SpeedOptimizedSkipIterator(source, count);
```

上の場合に当てはまらなければ、`SpeedOptimizedSkipIterator` で、読み飛ばす列を作って返します。

## ここがすごい

- **何もしないときは、そのまま返す**: 内部の列なら、飛ばす個数が 0 のときに余計な包みを作りません。
- **内部の列は専用の近道を使う**: 型によっては、先頭を飛ばす処理を直接行えるので、1 つずつ読まずに済みます。
- **安全な別名の扱い**: ユーザーの列を、むやみにそのまま返さず、別の列に包み直すことで、参照の混乱を防いでいます。

## まとめ

- `null` は例外、空の配列は空の列にする。
- 個数が 0 以下なら、内部の列はそのまま返し、それ以外は包み直す。
- 内部イテレータは専用の近道を使い、それ以外は読み飛ばす列を作る。
