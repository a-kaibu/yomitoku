---
title: "並んだ配列から、値の場所を半分ずつ絞り込んで探す"
description: ".NET の ArraySortHelper<T>.BinarySearch。昇順に並んだ配列の中央を比べて、探す範囲を半分ずつ狭める。見つからないときは、挿入すべき位置を ~ で表して返す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/ArraySortHelper.cs
lines: [352, 385]
function: "ArraySortHelper<T>.BinarySearch(T[], int, int, T)"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, ソート]
---

## ひとことで

`BinarySearch` は、**昇順に並んだ配列** から、値の場所を探す関数です。
配列の中央の値と比べて、探す範囲を半分ずつ狭めていくので、要素数が多くても探す回数は少なくて済みます。

たとえば `[1, 3, 5, 7, 9]` から `7` を探すと、中央の `5` と比べ、次は右半分を探します。

## コード

```csharp:line-numbers=352
        private static int BinarySearch(T[] array, int index, int length, T value)
        {
            int lo = index;
            int hi = index + length - 1;
            while (lo <= hi)
            {
                int i = lo + ((hi - lo) >> 1);
                int order;
                if (array[i] == null)
                {
                    order = (value == null) ? 0 : -1;
                }
                else
                {
                    order = array[i].CompareTo(value);
                }

                if (order == 0)
                {
                    return i;
                }

                if (order < 0)
                {
                    lo = i + 1;
                }
                else
                {
                    hi = i - 1;
                }
            }

            return ~lo;
        }
```

## 前提知識

- **昇順**: 小さい値から大きい値へ並んでいる状態です。二分探索は、この並びが前提です。
- **`CompareTo`**: 2 つの値を比べて、小さい・同じ・大きいを表す整数を返します。0 なら同じ、負なら前が小さい、正なら前が大きい、という意味です。
- **`lo` と `hi`**: 探す範囲の左端と右端の位置です。
- **ビットの否定（`~`）**: 値のすべてのビットを反転します。負の数になるので、「見つからなかった」と「位置」を同じ戻り値で区別できます。
- **`>> 1`**: 2 で割る（右へ 1 ビットずらす）計算です。中央の位置を求めるために使います。

## 何をしているか

### 1. 中央の値を比べる

```csharp:line-numbers=356
            while (lo <= hi)
            {
                int i = lo + ((hi - lo) >> 1);
                int order;
                if (array[i] == null)
                {
                    order = (value == null) ? 0 : -1;
                }
                else
                {
                    order = array[i].CompareTo(value);
```

`lo` と `hi` の中央の添字 `i` を求め、その位置の値と `value` を `CompareTo` で比べます。配列の中に `null` が入っている場合は、`null` を最も小さい値として扱います。

### 2. 見つかったら、その位置を返す

```csharp:line-numbers=369
                if (order == 0)
                {
                    return i;
                }
```

比べた結果が 0 なら、同じ値が見つかったので、その添字を返します。

### 3. 範囲を半分に狭める

```csharp:line-numbers=374
                if (order < 0)
                {
                    lo = i + 1;
                }
                else
                {
                    hi = i - 1;
                }
```

比べた値が `value` より小さければ、探す範囲を右半分にします（`lo = i + 1`）。大きければ、左半分にします（`hi = i - 1`）。

### 4. 見つからなければ位置を返す

```csharp:line-numbers=384
            return ~lo;
```

範囲がなくなったら、`lo` が挿入すべき位置です。その値を `~lo` で負の数にして返します。

### 具体例で確かめる

`[1, 3, 5]` から `4` を探します。

```
lo=0, hi=2, 中央 i=1 → 3 < 4 → lo=2
lo=2, hi=2, 中央 i=2 → 5 > 4 → hi=1
lo=2 > hi=1 で終わり → 戻り値は ~2 = -3
```

`-3` は「見つからず、`4` は添字 2 に入る」という意味です。

## ここがすごい

- **探す回数が少ない**: 範囲を毎回半分にするので、要素数が 100 万個でも、約 20 回の比較で見つかります。
- **見つからない場合も情報がある**: 負の数で挿入位置を返すので、後で値を入れる場所も分かります。
- **`null` を扱う**: 比較の前に `null` の場合を分けて、例外を出さずに並べられます。
- **中央の求め方が安全**: `lo + (hi - lo) / 2` の形で、`lo + hi` が大きくなりすぎて溢れることを避けています。

## まとめ

- `BinarySearch` は、昇順の配列の中央と比べ、探す範囲を半分ずつ狭める。
- 見つかれば添字を返し、見つからなければ `~` を付けた挿入位置を返す。
- 中央の求め方を工夫し、大きな配列でも値が溢れないようにしている。
