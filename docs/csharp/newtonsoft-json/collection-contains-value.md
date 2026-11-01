---
title: "列の中に、比較の道具で等しいと判定される値があるかを調べる"
description: "Newtonsoft.Json の CollectionUtils.ContainsValue。LINQ の Contains が比較の道具を受け取れない環境向けに、foreach で 1 つずつ比べて見つけたら true を返す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [188, 209]
function: "CollectionUtils.ContainsValue<TSource>(IEnumerable<TSource>, TSource, IEqualityComparer<TSource>)"
difficulty: 1
format: 2
tags: [探索, 防御的プログラミング, ジェネリクス]
---

## ひとことで

`ContainsValue` は、列の中に **指定した値と等しいものがあるか** を調べる関数です。
たとえば `1, 2, 3` の中に `2` があれば `true`、`5` がなければ `false` を返します。

等しいかどうかは、比較の道具（`IEqualityComparer`）で決めます。そのため、大文字と小文字を区別しない比較などにも使えます。

## コード

```csharp:line-numbers=188
        public static bool ContainsValue<TSource>(this IEnumerable<TSource> source, TSource value, IEqualityComparer<TSource> comparer)
        {
            if (comparer == null)
            {
                comparer = EqualityComparer<TSource>.Default;
            }

            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }

            foreach (TSource local in source)
            {
                if (comparer.Equals(local, value))
                {
                    return true;
                }
            }

            return false;
        }
```

## 前提知識

- **`IEqualityComparer<T>`**: 2 つの値が等しいかを判定する道具です。`Equals` メソッドで比べます。
- **`EqualityComparer<T>.Default`**: 型の既定の比べ方を表す道具です。
- **`foreach`**: 列の要素を先頭から順に取り出す繰り返しです。
- **LINQ の `Contains`**: 列に値があるかを調べる標準の関数です。古い環境では、比較の道具を受け取れないものがありました。ここでは、その代わりに自分で書いています。

## 何をしているか

### 1. 比較の道具を決める

```csharp:line-numbers=190
            if (comparer == null)
            {
                comparer = EqualityComparer<TSource>.Default;
            }
```

比較の道具が `null` なら、既定の比べ方を使います。

### 2. 列が `null` でないかを確かめる

```csharp:line-numbers=195
            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }
```

列が `null` なら、例外を投げます。

### 3. 1 つずつ比べる

```csharp:line-numbers=200
            foreach (TSource local in source)
            {
                if (comparer.Equals(local, value))
                {
                    return true;
                }
            }
```

列の要素を先頭から取り出し、比較の道具で値と比べます。等しいものが見つかった時点で、`true` を返して終わります。

### 4. 見つからなければ false

```csharp:line-numbers=208
            return false;
```

最後まで等しいものがなければ、`false` を返します。

## ここがすごい

- **見つかったらすぐ終わる**: 等しい要素が見つかった時点で止まるので、列の残りは読みません。
- **比べ方を差し替えられる**: 比較の道具を引数で渡せるので、用途に合わせた比べ方ができます。
- **列を 1 回だけ読む**: 配列にコピーせず、先頭から 1 回だけ読みます。

## まとめ

- 比較の道具を決め、列が `null` でないかを確かめる。
- 要素を先頭から、道具で値と比べる。
- 見つかれば `true`、最後まで見つからなければ `false` を返す。
