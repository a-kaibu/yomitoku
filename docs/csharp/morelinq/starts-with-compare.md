---
title: "列が、別の列で始まっているかを先頭から比べる"
description: "MoreLINQ の StartsWith。2 つ目の列の要素を、先頭から 1 つずつ 1 つ目の列と比べる。長さが分かるときは、先に短い判定で終わらせる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/StartsWith.cs
lines: [71, 87]
function: "MoreEnumerable.StartsWith<T>(IEnumerable<T>, IEnumerable<T>, IEqualityComparer<T>?)"
difficulty: 2
format: 2
tags: [アルゴリズム, 防御的プログラミング, イテレータ]
---

## ひとことで

`StartsWith(second)` は、列 `first` が **列 `second` で始まっているか** を調べる関数です。
たとえば `1, 2, 3, 4` は `1, 2` で始まっているので `true` です。`1, 3` では `false` になります。

2 つの列を先頭から 1 つずつ比べ、比べる要素が尽きたら `true` になります。

## コード

```csharp:line-numbers=71
        public static bool StartsWith<T>(this IEnumerable<T> first, IEnumerable<T> second, IEqualityComparer<T>? comparer)
        {
            if (first == null) throw new ArgumentNullException(nameof(first));
            if (second == null) throw new ArgumentNullException(nameof(second));

            if (first.TryAsCollectionLike() is { Count: var firstCount } &&
                second.TryAsCollectionLike() is { Count: var secondCount } &&
                secondCount > firstCount)
            {
                return false;
            }

            comparer ??= EqualityComparer<T>.Default;

            using var firstIter = first.GetEnumerator();
            return second.All(item => firstIter.MoveNext() && comparer.Equals(firstIter.Current, item));
        }
```

## 前提知識

- **`IEqualityComparer<T>`**: 2 つの要素が等しいかを決める道具です。`null` のときは、既定の比べ方を使います。
- **`??=`（null 合体代入）**: 左の値が `null` のときだけ、右の値を代入する書き方です。
- **`TryAsCollectionLike`**: 列の要素数を、列を読まずに取り出せるかを試す MoreLINQ の関数です。取り出せなければ `null` になります。
- **パターン `is { Count: var firstCount }`**: 値の `Count` 属性を取り出して、名前付きの変数に入れる書き方です。
- **`All`**: すべての要素が条件を満たすかを調べる LINQ の関数です。1 つでも満たさなければ、そこで止まります。

## 何をしているか

### 1. `null` を受け付けない

```csharp:line-numbers=73
            if (first == null) throw new ArgumentNullException(nameof(first));
            if (second == null) throw new ArgumentNullException(nameof(second));
```

どちらかの列が `null` なら、例外を投げます。

### 2. 要素数で早めに判定する

```csharp:line-numbers=76
            if (first.TryAsCollectionLike() is { Count: var firstCount } &&
                second.TryAsCollectionLike() is { Count: var secondCount } &&
                secondCount > firstCount)
            {
                return false;
            }
```

両方の要素数が数えられる場合、2 つ目の列の方が長ければ、1 つ目の列では必ず足りません。そのため、列を比べずに `false` を返します。

### 3. 比べる方法を決める

```csharp:line-numbers=83
            comparer ??= EqualityComparer<T>.Default;
```

比べ方が指定されていなければ、既定の比べ方を使います。

### 4. 先頭から 1 つずつ比べる

```csharp:line-numbers=85
            using var firstIter = first.GetEnumerator();
            return second.All(item => firstIter.MoveNext() && comparer.Equals(firstIter.Current, item));
```

1 つ目の列を、列挙の道具（`firstIter`）で先頭から進めます。2 つ目の列の要素を 1 つずつ取り出して、同じ位置の要素と比べます。1 つ目の列が尽きたり、どこかが違ったりすると、`All` が `false` を返します。

## ここがすごい

- **長さによる早期終了**: 要素数が分かるときは、列を 1 つも読まずに答えを出せます。
- **途中で止まる**: `All` は、違う要素が見つかった時点で止まるので、無駄な比較がありません。
- **比べ方を差し替えられる**: 比較の道具を引数で渡せるので、大文字小文字を区別しないなど、さまざまな比べ方に対応できます。

## まとめ

- 要素数が分かる場合は、先に長さで判定する。
- 2 つ目の列を、1 つ目の列の先頭と順に比べる。
- 違う要素が見つかれば、すぐ `false` で終わる。
