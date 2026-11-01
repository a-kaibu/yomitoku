---
title: "同じ要素を、指定した回数だけ繰り返す列を作る"
description: ".NET Runtime の Enumerable.Repeat(element, count)。個数が負なら例外、0 なら空の列、それ以外は同じ要素を返す遅延評価のイテレータを作る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Repeat.cs
lines: [11, 24]
function: "Enumerable.Repeat<TResult>(TResult, int)"
difficulty: 1
format: 2
tags: [遅延評価, 防御的プログラミング, イテレータ]
---

## ひとことで

`Enumerable.Repeat(element, count)` は、同じ要素を **`count` 回繰り返した列** を作る関数です。
たとえば `Repeat("a", 3)` は `"a", "a", "a"` になります。

同じ値を何個も並べたい場面で使われます。

## コード

```csharp:line-numbers=11
        public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count)
        {
            if (count < 0)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.count);
            }

            if (count == 0)
            {
                return [];
            }

            return new RepeatIterator<TResult>(element, count);
        }
```

## 前提知識

- **`Enumerable`**: 列の操作を集めた静的なクラスです。LINQ の関数の多くが、ここにあります。
- **遅延評価**: 列を作った時点では、全部の要素を並べず、読まれたときに 1 つずつ返す仕組みです。
- **`RepeatIterator`**: 同じ要素を指定回数返す、内部の列の型です。
- **`ThrowHelper`**: 例外を投げる処理を、1 か所にまとめた内部の仕組みです。
- **空の配列 `[]`**: 要素が 0 個の列を表す書き方です。

## 何をしているか

### 1. 個数が負なら例外

```csharp:line-numbers=13
            if (count < 0)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.count);
            }
```

個数が負なら、範囲外の例外を投げます。

### 2. 個数が 0 なら空の列

```csharp:line-numbers=18
            if (count == 0)
            {
                return [];
            }
```

個数が 0 なら、要素を 1 つも持たない列を返します。イテレータを作る必要がありません。

### 3. それ以外は遅延評価の列

```csharp:line-numbers=23
            return new RepeatIterator<TResult>(element, count);
```

個数が 1 以上なら、`RepeatIterator` を作って返します。要素は、読まれるまで繰り返し返されるだけです。

## ここがすごい

- **空の場合を特別扱い**: 0 個のときは、イテレータの作成を省けるので、無駄がありません。
- **不正な値を早く知らせる**: 負の個数は、列を作る時点で例外になるので、後の処理で気づきにくい誤りを防げます。
- **大きな個数でも軽い**: 同じ要素を個数分並べた配列を作らず、列を読むたびに同じ要素を返します。

## まとめ

- 個数が負なら、例外を投げる。
- 個数が 0 なら、空の列を返す。
- それ以外は、同じ要素を返す遅延評価の列を返す。
