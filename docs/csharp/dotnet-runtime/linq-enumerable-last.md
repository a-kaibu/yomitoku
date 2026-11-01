---
title: "列の最後の要素を取り出し、空なら例外にする"
description: ".NET Runtime の Enumerable.Last。TryGetLast で最後の要素を探し、見つからなければ要素がないことを示す例外を投げる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/Last.cs
lines: [11, 20]
function: "Enumerable.Last<TSource>(IEnumerable<TSource>)"
difficulty: 1
format: 2
tags: [防御的プログラミング, エラー処理, 型システム]
---

## ひとことで

`Last()` は、列の **最後の要素** を返す関数です。
たとえば `1, 2, 3` なら `3` を返します。要素が 1 つもない列の場合は、例外を投げます。

最後の要素を探す処理は、`TryGetLast` という別の関数に任せています。

## コード

```csharp:line-numbers=11
        public static TSource Last<TSource>(this IEnumerable<TSource> source)
        {
            TSource? last = source.TryGetLast(out bool found);
            if (!found)
            {
                ThrowHelper.ThrowNoElementsException();
            }

            return last!;
        }
```

## 前提知識

- **`out` 引数**: 関数の中で値を設定し、呼び出し側が受け取る引数です。ここでは「見つかったか」を返します。
- **`!`（null 許容の解除）**: 値が `null` でないことを、コンパイラに伝える書き方です。見つかったときだけ使います。
- **`ThrowHelper`**: 例外を投げる処理を、1 か所にまとめた内部の仕組みです。
- **`TryGetLast`**: 最後の要素を探して、見つかったかを `found` に返す内部の関数です。

## 何をしているか

### 1. 最後の要素を探す

```csharp:line-numbers=13
            TSource? last = source.TryGetLast(out bool found);
```

`TryGetLast` で、最後の要素と、見つかったかを受け取ります。

### 2. 見つからなければ例外

```csharp:line-numbers=14
            if (!found)
            {
                ThrowHelper.ThrowNoElementsException();
            }
```

`found` が `false` なら、要素が 1 つもないので、例外を投げます。

### 3. 最後の要素を返す

```csharp:line-numbers=19
            return last!;
```

見つかった要素を返します。

## ここがすごい

- **空の列を黙って通さない**: 要素がないとき、既定値を返すと、本当の値と区別できません。例外にすることで、誤りを早く知らせます。
- **探す処理を分けている**: 列の型による探し方は `TryGetLast` に任せ、この関数は結果の扱いだけに集中しています。
- **同じ形で並ぶ**: `First` や `Single` なども、同じ形で作られています。

## まとめ

- 最後の要素を、`TryGetLast` で探す。
- 見つからなければ、要素がないことを示す例外を投げる。
- 見つかれば、その要素を返す。
