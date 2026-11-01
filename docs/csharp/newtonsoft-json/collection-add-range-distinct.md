---
title: "複数の値をまとめて追加し、重複したものは飛ばす"
description: "Newtonsoft.Json の CollectionUtils.AddRangeDistinct。値の列を 1 つずつ AddDistinct に渡し、重複した値は飛ばす。すべての値が新しく追加できたかを、最後に true か false で返す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [211, 223]
function: "CollectionUtils.AddRangeDistinct<T>(IList<T>, IEnumerable<T>, IEqualityComparer<T>)"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, 可読性]
---

## ひとことで

`AddRangeDistinct(list, values, comparer)` は、値の列をリストに **まとめて、重複を除いて追加** する関数です。
たとえば `[1, 2]` に `[2, 3, 3, 4]` を追加すると、`[1, 2, 3, 4]` になります。`2` と、2 つ目の `3` は、重複のため追加されません。

## コード

```csharp:line-numbers=211
        public static bool AddRangeDistinct<T>(this IList<T> list, IEnumerable<T> values, IEqualityComparer<T> comparer)
        {
            bool allAdded = true;
            foreach (T value in values)
            {
                if (!list.AddDistinct(value, comparer))
                {
                    allAdded = false;
                }
            }

            return allAdded;
        }
```

## 前提知識

- **`IEnumerable<T>`**: 順番に読める列の型です。配列やリストなど、どんな列でも渡せます。
- **`AddDistinct`**: 1 つの値を、重複なしで追加する関数です。追加したかどうかを `bool` で返します。
- **`foreach`**: 列の要素を先頭から 1 つずつ取り出す書き方です。
- **`allAdded`**: 1 つでも追加できなかったかを記録する変数です。最初は `true` にしておきます。
- **`IEqualityComparer<T>`**: 同じかどうかを決める比較の道具です。

## 何をしているか

### 1. 全部追加できたと仮定して始める

```csharp:line-numbers=213
            bool allAdded = true;
```

`allAdded` を `true` にしておきます。

### 2. 1 つずつ追加を試す

```csharp:line-numbers=214
            foreach (T value in values)
            {
                if (!list.AddDistinct(value, comparer))
                {
                    allAdded = false;
                }
```

値を 1 つずつ `AddDistinct` に渡します。追加できなかった（重複していた）値があれば、`allAdded` を `false` にします。重複があっても、処理は止めずに、次の値へ進みます。

### 3. 結果を返す

```csharp:line-numbers=222
            return allAdded;
```

すべての値を試したあと、1 つでも重複で飛ばしたかどうかを返します。

## ここがすごい

- **止めずに最後まで進める**: 重複があっても途中で止まらないので、新しい値はすべて入ります。
- **結果を 1 つにまとめる**: 「全部入ったか」を 1 つの真偽値で返すので、呼び出し側は簡単に判断できます。
- **1 つの値の処理を再利用**: 追加と重複の判定は `AddDistinct` に任せ、この関数は列を回すだけにしています。
- **比較器を外から渡す**: 同じかどうかの基準を、呼び出し側が決められます。

## まとめ

- `AddRangeDistinct` は、値の列を 1 つずつ `AddDistinct` で追加し、重複は飛ばす。
- 途中で止まらず、すべての値を試す。
- 全部が新しく追加できたかを `true` か `false` で返す。
