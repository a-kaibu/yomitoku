---
title: "リストに、まだ無い値だけを追加する"
description: "Newtonsoft.Json の CollectionUtils.AddDistinct。同じ値がリストにすでにあるかを比較器で調べ、無いときだけ追加する。追加したかどうかを true か false で返す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [176, 184]
function: "CollectionUtils.AddDistinct<T>(IList<T>, T, IEqualityComparer<T>)"
difficulty: 1
format: 2
tags: [データ構造, 可読性, 防御的プログラミング]
---

## ひとことで

`AddDistinct(list, value)` は、リストに値を **重複なしで** 追加する関数です。
すでに同じ値があれば、何もせずに `false` を返します。無ければ追加して `true` を返します。

たとえば `[1, 2]` に `1` を追加しようとすると、`[1, 2]` のまま `false` になります。`3` を追加すると、`[1, 2, 3]` になり `true` になります。

## コード

```csharp:line-numbers=176
        public static bool AddDistinct<T>(this IList<T> list, T value, IEqualityComparer<T> comparer)
        {
            if (list.ContainsValue(value, comparer))
            {
                return false;
            }

            list.Add(value);
            return true;
```

## 前提知識

- **`IList<T>`**: 順番に並んだ要素を持つ、リストの共通の型です。`Add` で末尾に追加できます。
- **`IEqualityComparer<T>`**: 2 つの値が「同じ」かどうかを決める比較の道具です。
- **`ContainsValue`**: リストの中に、比較器で同じと判定される値があるかを調べる補助の関数です。
- **戻り値の `bool`**: 追加したかどうかを伝えます。呼び出し側は、この結果で後続の処理を決められます。
- **重複**: 同じ値が 2 つ以上入ってしまうことです。集合のように、1 つだけ入れたいときに避けます。

## 何をしているか

### 1. 既にあるかを調べる

```csharp:line-numbers=178
            if (list.ContainsValue(value, comparer))
            {
                return false;
            }
```

`ContainsValue` で、リストに同じ値があるかを調べます。あれば、追加せずに `false` を返します。

### 2. 無ければ追加する

```csharp:line-numbers=183
            list.Add(value);
            return true;
```

値を末尾に追加して、`true` を返します。

### 補助の関数（ContainsValue）

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
```

`ContainsValue` は、リストを先頭から読み、比較器で一致する値を探します。見つかれば `true`、最後まで無ければ `false` です。比較器が `null` のときは、既定の比較器を使います。

## ここがすごい

- **比較の方法を選べる**: 大文字・小文字を区別しない比較など、同じかどうかの基準を呼び出し側が決められます。
- **結果が分かる**: 追加したかどうかを返すので、呼び出し側は「新しく入った」ときだけ後続の処理を行えます。
- **既定の比較器にも対応**: 比較器を指定しない版は、既定の比較器を使うだけの短い関数です。
- **補助の関数を分けている**: 「あるかどうか」の判定を `ContainsValue` にまとめて、追加の処理を短く保っています。

## まとめ

- `AddDistinct` は、リストに同じ値が無いときだけ追加し、結果を `true` か `false` で返す。
- 同じかどうかは、比較器で決める。
- 判定は `ContainsValue` に任せ、追加の処理を短く保っている。
