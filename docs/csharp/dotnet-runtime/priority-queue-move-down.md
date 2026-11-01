---
title: "子を 4 つ持つヒープで木を低くする PriorityQueue"
description: ".NET の PriorityQueue は二分木ではなく 4 分木のヒープを使う。MoveDown では 4 人の子から最小を選び、値を入れ替えずに「穴」を動かして沈めていく。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/PriorityQueue.cs
lines: [778, 824]
function: "PriorityQueue<TElement, TPriority>.MoveDownDefaultComparer"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`PriorityQueue<TElement, TPriority>` は、**優先度がいちばん小さいものから取り出せるキュー** です。内部ではヒープ（親の優先度が子より常に小さい木）を配列で持っています。

この `MoveDownDefaultComparer` は、根（先頭）から取り出したあとなどに、ある値を **正しい深さまで沈めて** ヒープの規則を取り戻す関数です。よくある二分ヒープ（子が 2 つ）ではなく、**子が 4 つの「4 分ヒープ」** になっているのが特徴です。

## コード

::: code-group

```csharp:line-numbers=778 [日本語訳]
        /// <summary>
        /// 木の中で節を下に動かしてヒープ順序を回復する。
        /// </summary>
        private void MoveDownDefaultComparer((TElement Element, TPriority Priority) node, int nodeIndex)
        {
            // 下に動かす節は毎回実際に入れ替えるわけではない。
            // 代わりに、影響を受ける経路上の値を上に動かし、
            // この値を入れる空きを作る。挿入ソートと同様の最適化。

            Debug.Assert(_comparer is null);
            Debug.Assert(0 <= nodeIndex && nodeIndex < _size);

            (TElement Element, TPriority Priority)[] nodes = _nodes;
            int size = _size;

            int i;
            while ((i = GetFirstChildIndex(nodeIndex)) < size)
            {
                // 優先度が最小の子ノードを探す
                (TElement Element, TPriority Priority) minChild = nodes[i];
                int minChildIndex = i;

                int childIndexUpperBound = Math.Min(i + Arity, size);
                while (++i < childIndexUpperBound)
                {
                    (TElement Element, TPriority Priority) nextChild = nodes[i];
                    if (Comparer<TPriority>.Default.Compare(nextChild.Priority, minChild.Priority) < 0)
                    {
                        minChild = nextChild;
                        minChildIndex = i;
                    }
                }

                // ヒープ性質が満たされたので、この位置に挿入する。
                if (Comparer<TPriority>.Default.Compare(node.Priority, minChild.Priority) <= 0)
                {
                    break;
                }

                // 最小の子を 1 段上に動かし、
                // その位置から再帰的に続ける。
                nodes[nodeIndex] = minChild;
                nodeIndex = minChildIndex;
            }

            nodes[nodeIndex] = node;
        }
```

```csharp:line-numbers=778 [原文]
        /// <summary>
        /// Moves a node down in the tree to restore heap order.
        /// </summary>
        private void MoveDownDefaultComparer((TElement Element, TPriority Priority) node, int nodeIndex)
        {
            // The node to move down will not actually be swapped every time.
            // Rather, values on the affected path will be moved up, thus leaving a free spot
            // for this value to drop in. Similar optimization as in the insertion sort.

            Debug.Assert(_comparer is null);
            Debug.Assert(0 <= nodeIndex && nodeIndex < _size);

            (TElement Element, TPriority Priority)[] nodes = _nodes;
            int size = _size;

            int i;
            while ((i = GetFirstChildIndex(nodeIndex)) < size)
            {
                // Find the child node with the minimal priority
                (TElement Element, TPriority Priority) minChild = nodes[i];
                int minChildIndex = i;

                int childIndexUpperBound = Math.Min(i + Arity, size);
                while (++i < childIndexUpperBound)
                {
                    (TElement Element, TPriority Priority) nextChild = nodes[i];
                    if (Comparer<TPriority>.Default.Compare(nextChild.Priority, minChild.Priority) < 0)
                    {
                        minChild = nextChild;
                        minChildIndex = i;
                    }
                }

                // Heap property is satisfied; insert node in this location.
                if (Comparer<TPriority>.Default.Compare(node.Priority, minChild.Priority) <= 0)
                {
                    break;
                }

                // Move the minimal child up by one node and
                // continue recursively from its location.
                nodes[nodeIndex] = minChild;
                nodeIndex = minChildIndex;
            }

            nodes[nodeIndex] = node;
        }
```

:::

使われている定数と補助関数は同じファイルで次のように定義されています。

```csharp:line-numbers=47
        private const int Arity = 4;
```

```csharp:line-numbers=52
        private const int Log2Arity = 2;
```

```csharp:line-numbers=682
        private static int GetFirstChildIndex(int index) => (index << Log2Arity) + 1;
```

## 前提知識

- **ヒープを配列で表す**: 木の節を上から順に配列に並べます。子が 4 つの木なら、番号 i（0 始まり）の **最初の子は 4i + 1**、子は 4i + 1 〜 4i + 4 です。`index << 2` は「4 倍」をシフトで計算したものです。
- **タプル `(TElement Element, TPriority Priority)`**: 2 つの値を名前付きで 1 組にした型です。`node.Priority` のように取り出せます。
- **`Comparer<TPriority>.Default.Compare(a, b)`**: 型に決められた既定の比較で、a < b なら負を返します。ジェネリクスの型が `int` などに決まると、JIT はこれを直接の比較命令に置き換えられます（名前の DefaultComparer はこのため）。
- **`while ((i = GetFirstChildIndex(nodeIndex)) < size)`**: 代入しながら比較する書き方です。`i` に最初の子の番号を入れ、それが要素数より小さい（子がいる）間、繰り返します。
- **`++i`**: 先に 1 増やしてから値を使います。

## 何をしているか

### 1. 4 人の子から最小を探す

```csharp:line-numbers=794
            while ((i = GetFirstChildIndex(nodeIndex)) < size)
            {
                // 優先度が最小の子ノードを探す
                (TElement Element, TPriority Priority) minChild = nodes[i];
                int minChildIndex = i;

                int childIndexUpperBound = Math.Min(i + Arity, size);
                while (++i < childIndexUpperBound)
                {
                    (TElement Element, TPriority Priority) nextChild = nodes[i];
                    if (Comparer<TPriority>.Default.Compare(nextChild.Priority, minChild.Priority) < 0)
                    {
                        minChild = nextChild;
                        minChildIndex = i;
                    }
                }
```

`nodeIndex = 0`（根）なら、子は 1, 2, 3, 4 番です。まず 1 番を仮の最小とし、残りの 2〜4 番と比べて、優先度がいちばん小さい子を `minChild` にします。要素数が足りないときは `Math.Min(i + Arity, size)` で範囲を切り詰めます。

### 2. 沈める値のほうが小さければ止まる

```csharp:line-numbers=812
                if (Comparer<TPriority>.Default.Compare(node.Priority, minChild.Priority) <= 0)
                {
                    break;
                }
```

沈めたい値 `node` の優先度が、最小の子以下なら、ここが正しい場所です。

### 3. 最小の子を引き上げて、1 段下へ

```csharp:line-numbers=819
                nodes[nodeIndex] = minChild;
                nodeIndex = minChildIndex;
```

そうでなければ、最小の子を今の位置に書き写し、自分はその子の位置へ下がります。`node` 自体はまだどこにも書きません。

### 4. 最後に 1 回だけ書く

```csharp:line-numbers=823
            nodes[nodeIndex] = node;
```

ループを抜けた位置に `node` を書き込みます。

優先度 `[1, 5, 3, 7, 4, 9]` のヒープから 1 を取り出す場合、最後の要素 9 を根から沈めます。根の子は 5, 3, 7, 4（1〜4 番）で最小は 3。9 > 3 なので 3 を根に引き上げ、9 は 2 番の位置へ。2 番の子は 9 番以降でまだ存在しないので、ここに 9 を書いて終わりです。結果は `[3, 5, 9, 7, 4]` です。

## ここがすごい

- **4 分木で木を低くする**: 子が 4 つなら木の高さは log₄ n、つまり二分木の約半分です。沈める段数が半分になる代わりに、各段の比較は 1 回から 3 回に増えます。それでも、4 人の子は配列上で **隣り合って並んでいる** ので、同じキャッシュライン（CPU が一度に読むメモリの単位）に載りやすく、メモリアクセスの回数が減ります。.NET チームは性能計測をもとにこの形を選びました。
- **シフトで子の番号を計算**: Arity を 2 のべき乗に限定し（コメント）、掛け算をシフト 1 回にしています。静的コンストラクタではデバッグ時に `2^Log2Arity == Arity` を確認しています。
- **入れ替えず「穴」を動かす**: コメントの通り、1 段ごとに値を交換するのではなく、子を上に書き写して最後に 1 回だけ書きます。代入の回数がほぼ 3 分の 1 になります。
- **比較器ごとに専用の関数**: 比較器を指定しない場合（`_comparer == null`）と指定した場合で関数を分けています。既定の比較器版では、`Comparer<T>.Default` の呼び出しが JIT によって型ごとの直接比較に置き換わり、仮想呼び出しのコストが消えます。

## まとめ

- ヒープは二分木でなくてもよい。子を増やすと木が低くなり、メモリアクセスが減ることもある。
- 子の数を 2 のべき乗にすれば、番号の計算はシフトで済む。
- 値を沈める・浮かせるときは「穴を動かして最後に 1 回書く」と代入が減る。
