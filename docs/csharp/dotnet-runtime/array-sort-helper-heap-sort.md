---
title: "配列をそのままヒープに見立てて並べ替えるヒープソート"
description: "イントロソートの安全網 HeapSort と DownHeap。配列を 1 始まりの完全二分木とみなし、追加のメモリなしで最悪でも O(n log n) の並べ替えを行う。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/ArraySortHelper.cs
lines: [217, 256]
function: "ArraySortHelper<T>.HeapSort"
difficulty: 2
format: 2
tags: [ソート, データ構造, アルゴリズム]
---

## ひとことで

`HeapSort` は、**ヒープ**（親が子より常に大きい、という規則を持つ木の形のデータ構造）を使った並べ替えです。.NET のイントロソートでは、クイックソートの分割が深くなりすぎたときの「安全網」として呼ばれます。

追加のメモリを使わず、配列の中だけで完結し、どんな入力でも n log n に比例する時間で終わるのが特徴です。

## コード

```csharp:line-numbers=217
        private static void HeapSort(Span<T> keys, Comparison<T> comparer)
        {
            Debug.Assert(comparer != null);
            Debug.Assert(!keys.IsEmpty);

            int n = keys.Length;
            for (int i = n >> 1; i >= 1; i--)
            {
                DownHeap(keys, i, n, comparer);
            }

            for (int i = n; i > 1; i--)
            {
                Swap(keys, 0, i - 1);
                DownHeap(keys, 1, i - 1, comparer);
            }
        }

        private static void DownHeap(Span<T> keys, int i, int n, Comparison<T> comparer)
        {
            Debug.Assert(comparer != null);

            T d = keys[i - 1];
            while (i <= n >> 1)
            {
                int child = 2 * i;
                if (child < n && comparer(keys[child - 1], keys[child]) < 0)
                {
                    child++;
                }

                if (!(comparer(d, keys[child - 1]) < 0))
                    break;

                keys[i - 1] = keys[child - 1];
                i = child;
            }

            keys[i - 1] = d;
        }
```

## 前提知識

- **完全二分木を配列で表す**: 木の節（ノード）を上から順、左から順に配列に並べると、**番号 i の子は 2i と 2i + 1、親は i / 2** という簡単な計算で行き来できます（番号を 1 から数えた場合）。ポインタを使わずに木を表現できるのがポイントです。
- **最大ヒープ**: どの親も、自分の子以上の値を持っている木です。だから根（番号 1）がいつも最大値です。
- **`n >> 1`**: n を 2 で割った値（切り捨て）。子を持つ節の最後の番号です。
- **`T d = keys[i - 1];`**: このコードは番号を 1 から数えるので、C# の配列（0 から数える）にアクセスするときは `- 1` しています。
- **`comparer(a, b) < 0`**: a が b より小さいとき真です。

## 何をしているか

### 1. 配列をヒープにする

```csharp:line-numbers=222
            int n = keys.Length;
            for (int i = n >> 1; i >= 1; i--)
            {
                DownHeap(keys, i, n, comparer);
            }
```

子を持つ最後の節（`n / 2`）から根に向かって、順に `DownHeap`（ふるい落とし）を行います。下の部分木から順に整えていくので、最後には全体がヒープになります。

### 2. 最大値を末尾に移して、残りを整え直す

```csharp:line-numbers=228
            for (int i = n; i > 1; i--)
            {
                Swap(keys, 0, i - 1);
                DownHeap(keys, 1, i - 1, comparer);
            }
```

ヒープの根（`keys[0]`）は最大値なので、配列の末尾と入れ替えます。末尾は確定したので、ヒープの大きさを 1 減らし、根に来た値を `DownHeap` で正しい位置まで沈めます。これを繰り返すと、後ろから大きい順に値が確定し、配列が小さい順に並びます。

`[3, 1, 2]` なら、ヒープ化で `[3, 1, 2]`（すでにヒープ）→ 3 と 2 を入れ替え `[2, 1, 3]` → 2 を沈める（子の 1 より大きいので動かない）→ 2 と 1 を入れ替え `[1, 2, 3]` で完成です。

### 3. DownHeap: 値を沈める

```csharp:line-numbers=235
        private static void DownHeap(Span<T> keys, int i, int n, Comparison<T> comparer)
        {
            Debug.Assert(comparer != null);

            T d = keys[i - 1];
            while (i <= n >> 1)
            {
                int child = 2 * i;
                if (child < n && comparer(keys[child - 1], keys[child]) < 0)
                {
                    child++;
                }

                if (!(comparer(d, keys[child - 1]) < 0))
                    break;

                keys[i - 1] = keys[child - 1];
                i = child;
            }

            keys[i - 1] = d;
        }
```

番号 i の値 `d` を取り出し、**2 人の子のうち大きいほう** と比べます。子のほうが大きければ子を上に引き上げ、自分は 1 段下がります。子より小さくなくなったら止まり、最後に `d` をその場所に書きます。

## ここがすごい

- **入れ替えではなく「引き上げ」**: 1 段ごとに親子を入れ替える（3 回代入）のではなく、沈める値 `d` を手元に持っておき、子を上に書き写すだけ（1 回代入）にしています。最後に 1 回だけ `d` を書きます。挿入ソートと同じ「穴を動かす」工夫です。
- **追加メモリ不要**: 木を配列の番号計算で表すので、ノードのオブジェクトもポインタも必要ありません。マージソートのように作業用の配列もいりません。
- **最悪でも n log n**: ヒープの高さは log n なので、1 回の `DownHeap` は高々 log n 段です。クイックソートが苦手な入力でも速さが落ちないので、イントロソートの安全網として最適です。
- **1 始まりの番号で式を簡単に**: 0 始まりだと子は `2i + 1` と `2i + 2` ですが、1 始まりなら `2i` と `2i + 1` です。配列アクセス時に `- 1` するだけで、木の計算がすっきりします。

## まとめ

- 完全二分木は、配列と「子は 2i、2i + 1」という番号計算だけで表せる。
- ヒープソートは追加メモリなしで、最悪でも n log n。
- 値を沈めるときは、入れ替えを繰り返すより「穴」を動かして最後に 1 回書くほうが少ない代入で済む。
