---
title: "クイックソートの弱点をヒープソートと挿入ソートで補うイントロソート"
description: "Array.Sort の中心 IntroSort。普段はクイックソート、要素が 16 個以下なら挿入ソート、再帰が深くなりすぎたらヒープソートに切り替えて、最悪でも O(n log n) を保証する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/ArraySortHelper.cs
lines: [131, 177]
function: "ArraySortHelper<T>.IntroSort"
difficulty: 2
tags: [ソート, アルゴリズム, 再帰]
---

## ひとことで

`IntroSort` は、.NET の `Array.Sort` や `List<T>.Sort` の中で実際に並べ替えを行う関数です。
**イントロソート**（introspective sort、「自分の様子を見ながら方法を変えるソート」）と呼ばれる手法で、3 種類のソートを状況に応じて使い分けます。

- ふだんは **クイックソート**（速いが、運が悪いと極端に遅くなる）
- 残りが 16 個以下になったら **挿入ソート**（少ない要素ではいちばん速い）
- 分割が深くなりすぎたら **ヒープソート**（速さは少し劣るが、最悪でも遅くならない）

## コード

```csharp:line-numbers=131
        // IntroSort is recursive; block it from being inlined into itself as
        // this is currenly not profitable.
        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void IntroSort(Span<T> keys, int depthLimit, Comparison<T> comparer)
        {
            Debug.Assert(!keys.IsEmpty);
            Debug.Assert(depthLimit >= 0);
            Debug.Assert(comparer != null);

            int partitionSize = keys.Length;
            while (partitionSize > 1)
            {
                if (partitionSize <= Array.IntrosortSizeThreshold)
                {

                    if (partitionSize == 2)
                    {
                        SwapIfGreater(keys, comparer, 0, 1);
                        return;
                    }

                    if (partitionSize == 3)
                    {
                        SwapIfGreater(keys, comparer, 0, 1);
                        SwapIfGreater(keys, comparer, 0, 2);
                        SwapIfGreater(keys, comparer, 1, 2);
                        return;
                    }

                    InsertionSort(keys.Slice(0, partitionSize), comparer);
                    return;
                }

                if (depthLimit == 0)
                {
                    HeapSort(keys.Slice(0, partitionSize), comparer);
                    return;
                }
                depthLimit--;

                int p = PickPivotAndPartition(keys.Slice(0, partitionSize), comparer);

                // Note we've already partitioned around the pivot and do not have to move the pivot again.
                IntroSort(keys[(p + 1)..partitionSize], depthLimit, comparer);
                partitionSize = p;
            }
        }
```

`Array.IntrosortSizeThreshold` は 16 です（Array.cs の 25 行目）。最初の呼び出しは 121〜129 行目の `IntrospectiveSort` で、`depthLimit` に `2 × (log₂(要素数) + 1)` を渡しています。

## 前提知識

- **`Span<T>`**: 配列の一部分を指す「窓」です。`keys.Slice(0, n)` や `keys[(p + 1)..n]` は、コピーせずに部分を切り出します。`a..b` は C# の範囲（Range）の書き方で、a 番目から b 番目の手前までです。
- **`Comparison<T>`**: 2 つの値を受け取り、前者が小さければ負、等しければ 0、大きければ正の数を返す関数（デリゲート）です。並べ替えの順序を外から指定できます。
- **ジェネリクス `<T>`**: 型を後から決められる仕組みです。`ArraySortHelper<int>` なら整数の配列、`ArraySortHelper<string>` なら文字列の配列を並べ替えます。
- **`[MethodImpl(MethodImplOptions.NoInlining)]`**: 「この関数をインライン展開しないで」という指示です。131〜132 行目のコメントの通り、再帰関数を自分の中に展開しても得にならないためです。
- **クイックソート**: 基準の値（ピボット）を選び、それより小さいものを左、大きいものを右に分け（分割）、左右をそれぞれ同じように並べ替える方法です。

## 何をしているか

### 1. 小さい区間は特別扱い（143〜162 行目）

要素が 2 個なら 1 回の比較で、3 個なら 3 回の比較で並べ終えます。4〜16 個なら挿入ソートです。挿入ソートは要素数の 2 乗に比例する手間がかかりますが、少ない要素では余計な処理がないので最速です。

### 2. 深すぎたらヒープソート（164〜169 行目）

クイックソートは、ピボットの選び方が運悪く毎回端の値になると、分割がほとんど進まず、手間が要素数の 2 乗に膨らみます。
`depthLimit` は分割できる回数の上限で、使い切ったら残りをヒープソートに任せます。ヒープソートは常に n log n 程度の手間で終わるので、最悪の場合でも遅くなりません。

要素数 1000 なら `log₂(1000) = 9` なので、`depthLimit = 2 × 10 = 20` です。

### 3. 分割して、右だけ再帰、左はループで（171〜175 行目）

`PickPivotAndPartition` でピボットの位置 `p` を求めたら、**右側（`p + 1` 以降）だけを再帰呼び出し** で処理します。左側（`p` より前）は `partitionSize = p` として、`while` ループの次の周回で処理します。

## ここがすごい

- **3 つのアルゴリズムのいいとこ取り**: 平均的にはクイックソートの速さ、最悪の場合はヒープソートの安全性、小さな区間では挿入ソートの軽さ。どれか 1 つでは得られない性質を組み合わせています。C++ の `std::sort` など多くの標準ライブラリが採用している方式です。
- **再帰を半分ループに**: 2 つの区間のうち片方をループで処理すると、関数呼び出しの回数とスタックの使用量が減ります。これは「末尾呼び出しの除去」を手で行っている形です。
- **悪意ある入力への耐性**: クイックソートだけだと、わざと最悪のケースになる配列を作られると極端に遅くなります（サービス妨害攻撃に使われることもあります）。深さの上限がこれを防ぎます。
- **2 個・3 個は比較を直書き**: 再帰の末端はとても多く呼ばれるので、ループすら使わずに比較と入れ替えを並べています。

## まとめ

- クイックソートは平均は速いが最悪が遅い。深さの上限を決めてヒープソートに切り替えると最悪も安心。
- 小さい区間は挿入ソートが速い。
- 再帰の片方をループにすると、スタックを節約できる。
