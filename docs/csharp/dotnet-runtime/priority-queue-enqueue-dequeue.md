---
title: "入れてすぐ出すなら「根と比べて 1 回沈める」だけで済む"
description: "PriorityQueue.EnqueueDequeue は、追加と取り出しを続けて行う操作を 1 回の沈め込みにまとめる。新しい値が最小なら、ヒープに触れずにそのまま返す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/PriorityQueue.cs
lines: [350, 388]
function: "PriorityQueue<TElement, TPriority>.EnqueueDequeue"
difficulty: 2
tags: [データ構造, アルゴリズム, API設計]
---

## ひとことで

`EnqueueDequeue(element, priority)` は、優先度付きキューに **値を 1 つ追加して、すぐに最小のものを 1 つ取り出す** 操作です。
`Enqueue` と `Dequeue` を続けて呼んでも同じ結果になりますが、この関数はそれを **ヒープの沈め込み 1 回** で済ませます。

「上位 k 件を残す」ような処理（たとえば、大量のデータから大きい順に 10 件だけ取っておく）でよく使う形です。

## コード

```csharp:line-numbers=350
        ///  Adds the specified element with associated priority to the <see cref="PriorityQueue{TElement, TPriority}"/>,
        ///  and immediately removes the minimal element, returning the result.
        /// </summary>
        /// <param name="element">The element to add to the <see cref="PriorityQueue{TElement, TPriority}"/>.</param>
        /// <param name="priority">The priority with which to associate the new element.</param>
        /// <returns>The minimal element removed after the enqueue operation.</returns>
        /// <remarks>
        ///  Implements an insert-then-extract heap operation that is generally more efficient
        ///  than sequencing Enqueue and Dequeue operations: in the worst case scenario only one
        ///  shift-down operation is required.
        /// </remarks>
        public TElement EnqueueDequeue(TElement element, TPriority priority)
        {
            if (_size != 0)
            {
                (TElement Element, TPriority Priority) root = _nodes[0];

                if (_comparer == null)
                {
                    if (Comparer<TPriority>.Default.Compare(priority, root.Priority) > 0)
                    {
                        MoveDownDefaultComparer((element, priority), 0);
                        _version++;
                        return root.Element;
                    }
                }
                else
                {
                    if (_comparer.Compare(priority, root.Priority) > 0)
                    {
                        MoveDownCustomComparer((element, priority), 0);
                        _version++;
                        return root.Element;
                    }
                }
            }

            return element;
        }
```

## 前提知識

- **優先度付きキューとヒープ**: `PriorityQueue` は優先度がいちばん小さい要素を先に取り出すキューです。内部は「親の優先度 ≤ 子の優先度」を保つヒープで、配列の先頭 `_nodes[0]` が常に最小です。
- **`MoveDownDefaultComparer(node, 0)`**: 同じファイルにある関数で、`node` を根（0 番）に置いたつもりで、正しい位置まで沈めます。
- **`_comparer`**: 利用者が指定した比較器です。`null` なら型の既定の比較（`Comparer<TPriority>.Default`）を使います。
- **`_version`**: コレクションが変更された回数です。列挙（`foreach`）中に変更されたことを検出するために使います。
- **タプル `(element, priority)`**: 2 つの値を 1 組にして渡しています。
- **`/// <remarks>`**: API の補足説明を書く XML ドキュメントコメントです。

## 何をしているか

### 1. キューが空なら、入れた値をそのまま返す（363, 387 行目）

空のキューに入れてすぐ取り出せば、出てくるのは入れた値です。ヒープには何もしません。

### 2. 新しい値が根以下なら、そのまま返す（369 行目の条件が偽の場合）

新しい値の優先度が、今の最小（根）以下なら、追加したとしても次に出てくるのは新しい値自身です。なので **ヒープを一切触らずに** 新しい値を返します。

### 3. 新しい値が根より大きければ、根と入れ替えて沈める（369〜374 行目）

この場合、出ていくのは今の根です。根の場所に新しい値を置いたつもりで `MoveDown` し、もとの根の要素を返します。

優先度 `[2, 5, 3]` のキューに優先度 4 を `EnqueueDequeue` すると、4 > 2 なので、2 の要素が返り、4 は根から沈みます。子の 5, 3 のうち最小は 3、4 > 3 なので 3 が根に上がり、キューは `[3, 5, 4]` になります。

## ここがすごい

- **操作を 1 回の沈め込みにまとめる**: `Enqueue` してから `Dequeue` すると、末尾に追加して浮かび上がらせ（MoveUp）、根を取り出して末尾の要素を沈める（MoveDown）、と 2 回木をたどります。この関数は最悪でも MoveDown 1 回です（357〜359 行目のコメント）。
- **何もしないで済む場合を最初に見抜く**: 新しい値が最小なら、ヒープに触れずに返します。「すでに k 件持っていて、新しい値が k 件のどれよりも小さい」ような場合、ほとんどの呼び出しがこの道で終わり、とても速くなります。
- **要素数が変わらない**: 1 つ入れて 1 つ出すので、配列のサイズも `_size` も変わりません。配列を広げる処理や、末尾の要素を消す処理が要りません。
- **Python の heapq.heappushpop と同じ考え方**: ヒープを使う多くのライブラリに、同じ目的の関数があります。よく使われる組み合わせ操作を専用の API にすると、使う側は意識せずに速さを得られます。

## まとめ

- 「追加してすぐ取り出す」は、根と比べて必要なら 1 回沈めるだけで実現できる。
- 新しい値が最小なら、データ構造に触れずに返せる。
- よく使う操作の組み合わせは、専用の API にすると効率よく実装できる。
