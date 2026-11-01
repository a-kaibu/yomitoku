---
title: "列の要素数を、既に分かっている型なら数えずに求める"
description: ".NET Runtime の Enumerable.Count。ICollection なら Count プロパティをそのまま使い、LINQ の内部イテレータも近道を使う。どちらでもなければ全体を数える。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Count.cs
lines: [11, 44]
function: "Enumerable.Count<TSource>(IEnumerable<TSource>)"
difficulty: 2
format: 2
tags: [最適化, 型システム, 防御的プログラミング]
---

## ひとことで

`Count()` は、列にいくつの要素があるかを返す関数です。
ただし、列の全部を読んで数えるのは、時間がかかります。そこでこの関数は、要素数を既に持っている型なら、それを使って素早く答えを返します。

## コード

```csharp:line-numbers=11
        public static int Count<TSource>(this IEnumerable<TSource> source)
        {
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            if (source is ICollection<TSource> collectionoft)
            {
                return collectionoft.Count;
            }

            if (source is Iterator<TSource> iterator)
            {
                return iterator.GetCount(onlyIfCheap: false);
            }

            if (source is ICollection collection)
            {
                return collection.Count;
            }

            int count = 0;
            using IEnumerator<TSource> e = source.GetEnumerator();
            checked
            {
                while (e.MoveNext())
                {
                    count++;
                }
            }

            return count;
        }
```

## 前提知識

- **`ICollection<T>`**: 要素数を `Count` プロパティで持っている列の約束（インターフェース）です。配列や `List<T>` が実装しています。
- **`Iterator<TSource>`**: LINQ が内部で使う列の型です。数を、専用の方法で求められることがあります。
- **`onlyIfCheap`**: 「数えるのが軽い場合だけ」数を求める、という指定です。ここでは `false` なので、必要なら数えます。
- **`checked`**: 計算が型の範囲を超えたら、例外を投げる指定です。
- **`using`**: 列を読む道具を、この処理の終わりに自動的に片付ける書き方です。

## 何をしているか

### 1. `null` を弾く

```csharp:line-numbers=13
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }
```

列が `null` なら、例外を投げます。

### 2. 要素数を持つ型なら、その数を返す

```csharp:line-numbers=18
            if (source is ICollection<TSource> collectionoft)
            {
                return collectionoft.Count;
            }
```

`ICollection<TSource>` なら、`Count` プロパティをそのまま返します。読まずに答えが出ます。

### 3. 内部イテレータなら、専用の方法で数える

```csharp:line-numbers=23
            if (source is Iterator<TSource> iterator)
            {
                return iterator.GetCount(onlyIfCheap: false);
            }
```

LINQ の内部イテレータなら、`GetCount` で数えます。この関数は、必要なら数えて結果を返します。

### 4. 非ジェネリックの `ICollection` なら、その Count を使う

```csharp:line-numbers=28
            if (source is ICollection collection)
            {
                return collection.Count;
            }
```

古い形の `ICollection` なら、その `Count` を返します。

### 5. どれでもなければ、全部読んで数える

```csharp:line-numbers=33
            int count = 0;
            using IEnumerator<TSource> e = source.GetEnumerator();
            checked
            {
                while (e.MoveNext())
                {
                    count++;
                }
            }

            return count;
```

列を先頭から読み、1 つずつ数えます。数の増加は `checked` で行うので、数が `int` の範囲を超えたら例外になります。

## ここがすごい

- **最も安い方法を選ぶ**: 型ごとに、既に分かっている数を使うので、列の要素を読まずに済む場合が多いです。
- **読む回数を最小限に**: どうしても読むしかない場合だけ、先頭から 1 回だけ読みます。
- **溢れを検出する**: `checked` で、数えすぎたときに誤った値を返さず、例外で知らせます。

## まとめ

- 数を既に持つ型なら、その数をそのまま返す。
- 内部イテレータは、専用の方法で求める。
- それ以外は、全部読んで数える。
