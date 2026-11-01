---
title: "葉は飛ばして下から整える、O(n) のヒープ構築"
description: "PriorityQueue.Heapify は、ばらばらの配列をヒープに作り変える。葉はそもそも 1 要素のヒープなので、子を持つ最後の節から根に向かって沈め込みをするだけでよい。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/PriorityQueue.cs
lines: [684, 711]
function: "PriorityQueue<TElement, TPriority>.Heapify"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`Heapify` は、**順番がばらばらの配列を、まとめてヒープ（親の優先度が子以下になっている木）に作り変える** 関数です。
`PriorityQueue` をたくさんの要素で初期化するとき（コンストラクタにコレクションを渡した場合など）に使われます。

1 つずつ `Enqueue` するより速く、要素数 n に比例する時間（O(n)）で終わります。

## コード

::: code-group

```csharp:line-numbers=684 [日本語訳]
        /// <summary>
        /// 順序のない一覧をヒープに変換する。
        /// </summary>
        private void Heapify()
        {
            // 木の葉は実際には 1 要素のヒープなので、
            // 修正の必要はない。ヒープの性質を回復する必要があるのは
            // 子を持つ最初の節から上の節だけである。
            // 配列の最後の要素の親にあたる。

            (TElement Element, TPriority Priority)[] nodes = _nodes;
            int lastParentWithChildren = GetParentIndex(_size - 1);

            if (_comparer == null)
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownDefaultComparer(nodes[index], index);
                }
            }
            else
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownCustomComparer(nodes[index], index);
                }
            }
        }
```

```csharp:line-numbers=684 [原文]
        /// <summary>
        /// Converts an unordered list into a heap.
        /// </summary>
        private void Heapify()
        {
            // Leaves of the tree are in fact 1-element heaps, for which there
            // is no need to correct them. The heap property needs to be restored
            // only for higher nodes, starting from the first node that has children.
            // It is the parent of the very last element in the array.

            (TElement Element, TPriority Priority)[] nodes = _nodes;
            int lastParentWithChildren = GetParentIndex(_size - 1);

            if (_comparer == null)
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownDefaultComparer(nodes[index], index);
                }
            }
            else
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownCustomComparer(nodes[index], index);
                }
            }
        }
```

:::

`GetParentIndex` は同じファイルで次のように定義されています。子が 4 つの「4 分ヒープ」なので、親の番号は `(i − 1) / 4` です。

```csharp:line-numbers=677
        private static int GetParentIndex(int index) => (index - 1) >> Log2Arity;
```

## 前提知識

- **ヒープを配列で表す**: .NET の PriorityQueue は各節が最大 4 つの子を持つ木を配列に並べています。番号 i の子は 4i + 1 〜 4i + 4、親は (i − 1) / 4 です。
- **葉（leaf）**: 子を持たない節です。配列の後ろ側の大部分が葉になります。
- **`>> Log2Arity`**: `Log2Arity` は 2 なので、右に 2 ビットずらす＝ 4 で割る（切り捨て）です。
- **`MoveDownDefaultComparer(node, index)`**: 同じファイルにある関数で、`index` の位置にある値を、子より大きければ下へ沈めます。
- **`--index`**: 1 減らしてから使う、前置デクリメントです。
- **ローカル変数 `nodes` に配列を入れる**: フィールド `_nodes` を毎回読むより、ローカル変数に入れたほうが JIT が最適化しやすくなります。

## 何をしているか

### 1. 子を持つ最後の節を求める

```csharp:line-numbers=695
            int lastParentWithChildren = GetParentIndex(_size - 1);
```

**最後の要素の親** が、子を持つ節のうち最も後ろにあるものです。要素が 10 個（番号 0〜9）なら、`GetParentIndex(9) = (9 − 1) >> 2 = 2` です。番号 3〜9 は葉なので、何もしなくても「1 要素のヒープ」として正しい形です（コメント）。

### 2. 後ろから根に向かって沈める

```csharp:line-numbers=697
            if (_comparer == null)
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownDefaultComparer(nodes[index], index);
                }
            }
            else
            {
                for (int index = lastParentWithChildren; index >= 0; --index)
                {
                    MoveDownCustomComparer(nodes[index], index);
                }
            }
```

番号 2, 1, 0 の順に `MoveDown` します。ある節を沈める時点で、その子の部分木はすでにヒープになっているので、沈めるだけで「その節を根とする部分木」全体がヒープになります。最後に根（0 番）を沈めれば、全体がヒープになります。

比較器が指定されているかどうかでループを 2 つに分け、ループの中で毎回 `if` を判定しないようにしています。

## ここがすごい

- **O(n log n) ではなく O(n)**: 1 つずつ Enqueue すると、それぞれが最大で木の高さぶん浮かび上がるので、全体で n log n に比例します。下から沈める方法では、**ほとんどの節は葉の近くにあって、沈む距離が短い** ので、合計の手間が n に比例する程度で済みます。これは Floyd のヒープ構築として知られる方法です。
- **葉を最初から除外**: 4 分ヒープでは、要素の約 4 分の 3 が葉です。ループは残りの約 4 分の 1 だけで済みます。
- **分岐をループの外に出す**: 「比較器があるか」は途中で変わらないので、ループの外で 1 回だけ判定し、ループの中身を 2 通り用意しています。ループの中が単純になり、既定の比較器の場合には比較そのものを JIT が直接の命令に置き換えられます。

## まとめ

- ヒープは、子を持つ最後の節から根に向かって沈め込むだけで、O(n) で構築できる。
- 葉はすでに 1 要素のヒープなので、何もしなくてよい。
- ループ中で変わらない条件は、ループの外で判定してループを分けると速くなる。
