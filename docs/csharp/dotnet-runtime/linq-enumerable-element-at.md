---
title: "列の指定した番号の要素を、型に合った近道で取り出す"
description: ".NET Runtime の Enumerable.ElementAt。IList なら番号で直接読み、LINQ の内部イテレータなら専用の方法を使う。どちらでもなければ先頭から数える。範囲外は例外。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Linq/src/System/Linq/ElementAt.cs
lines: [12, 35]
function: "Enumerable.ElementAt<TSource>(IEnumerable<TSource>, int)"
difficulty: 2
format: 2
tags: [最適化, 型システム, 防御的プログラミング]
---

## ひとことで

`ElementAt(index)` は、列の **`index` 番目の要素** を返す関数です。番号は 0 から数えます。
たとえば `"a", "b", "c"` の番号 1 は `"b"` です。

列の型によって、取り出し方を変えます。配列やリストなら番号で直接読み、それ以外は先頭から順に数えます。

## コード

```csharp:line-numbers=12
        public static TSource ElementAt<TSource>(this IEnumerable<TSource> source, int index)
        {
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }

            if (source is IList<TSource> list)
            {
                return list[index];
            }

            bool found;
            TSource? element =
                source is Iterator<TSource> iterator ? iterator.TryGetElementAt(index, out found) :
                TryGetElementAtNonIterator(source, index, out found);

            if (!found)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index);
            }

            return element!;
        }
```

## 前提知識

- **`IList<T>`**: 番号で要素を読める列の約束（インターフェース）です。配列や `List<T>` が実装しています。
- **`is` パターン（`source is IList<TSource> list`）**: 型を調べて、その型として名前付きの変数に入れる書き方です。
- **`Iterator<TSource>`**: LINQ が内部で使う、列を作るための型です。専用の方法で要素を探せます。
- **`out` 引数**: 関数の中で値を設定して、呼び出し側が受け取る引数です。ここでは「見つかったか」を返します。
- **`!`（null 許容の解除）**: 値が `null` でないことを、コンパイラに伝える書き方です。ここでは見つかった後にだけ使います。

## 何をしているか

### 1. `null` を弾く

```csharp:line-numbers=14
            if (source is null)
            {
                ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
            }
```

列が `null` なら、例外を投げます。

### 2. 番号で読める列なら直接読む

```csharp:line-numbers=19
            if (source is IList<TSource> list)
            {
                return list[index];
            }
```

`IList<TSource>` を実装していれば、番号で直接要素を取り出します。たどる必要がないので、最も速い方法です。

### 3. 専用の方法か、先頭からたどる

```csharp:line-numbers=24
            bool found;
            TSource? element =
                source is Iterator<TSource> iterator ? iterator.TryGetElementAt(index, out found) :
                TryGetElementAtNonIterator(source, index, out found);
```

内部のイテレータなら、そのクラスの `TryGetElementAt` で探します。それ以外は、`TryGetElementAtNonIterator` で先頭から順にたどります。どちらも、要素が見つかったかを `found` に入れます。

### 4. 見つからなければ例外

```csharp:line-numbers=29
            if (!found)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index);
            }
```

番号が範囲の外で `found` が `false` なら、範囲外の例外を投げます。

### 5. 要素を返す

```csharp:line-numbers=34
            return element!;
```

見つかった要素を返します。

## ここがすごい

- **型ごとに近道を用意**: 配列やリストは番号で一瞬に読めます。そのほかの列も、可能な範囲で近道を使います。
- **範囲外は例外で知らせる**: 見つからないときに既定値を返さず、例外にします。既定値が有効な値なのか、見つからなかったのかを区別できます。
- **共通の流れ**: 型による分岐は、要素を探す部分だけに集中し、例外の扱いは 1 か所にまとめています。

## まとめ

- `null` は例外、番号で読める列はそのまま読む。
- それ以外は、専用の方法か、先頭からたどって探す。
- 範囲外なら例外、見つかれば要素を返す。
