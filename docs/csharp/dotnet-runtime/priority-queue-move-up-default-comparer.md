---
title: "追加した要素を「穴」を上へ動かして、親より小さい間だけ浮かべる"
description: "PriorityQueue の MoveUpDefaultComparer。新しい要素を末尾に置いたあと、親より優先度が小さければ親を下に下げ、空いた場所を上へ進める。入れ替えではなく穴を動かす方法。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/PriorityQueue.cs
lines: [716, 743]
function: "PriorityQueue<TElement, TPriority>.MoveUpDefaultComparer"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`MoveUpDefaultComparer` は、ヒープ（優先度付きキュー）に新しく追加した要素を、**正しい位置まで上へ浮かべる** 関数です。
優先度の小さいものほど先に取り出されるので、親より小さい要素は親の上に行く必要があります。

既定の比較器を使う場合（比較器を指定していない場合）の版です。

## コード

::: code-group

```csharp:line-numbers=716 [日本語訳]
        private void MoveUpDefaultComparer((TElement Element, TPriority Priority) node, int nodeIndex)
        {
            // 根まで要素を毎回入れ替えるのではなく、
            // 挿入ソートと同様の最適化を行う。

            Debug.Assert(_comparer is null);
            Debug.Assert(0 <= nodeIndex && nodeIndex < _size);

            (TElement Element, TPriority Priority)[] nodes = _nodes;

            while (nodeIndex > 0)
            {
                int parentIndex = GetParentIndex(nodeIndex);
                (TElement Element, TPriority Priority) parent = nodes[parentIndex];

                if (Comparer<TPriority>.Default.Compare(node.Priority, parent.Priority) < 0)
                {
                    nodes[nodeIndex] = parent;
                    nodeIndex = parentIndex;
                }
                else
                {
                    break;
                }
            }

            nodes[nodeIndex] = node;
        }
```

```csharp:line-numbers=716 [原文]
        private void MoveUpDefaultComparer((TElement Element, TPriority Priority) node, int nodeIndex)
        {
            // Instead of swapping items all the way to the root, we will perform
            // a similar optimization as in the insertion sort.

            Debug.Assert(_comparer is null);
            Debug.Assert(0 <= nodeIndex && nodeIndex < _size);

            (TElement Element, TPriority Priority)[] nodes = _nodes;

            while (nodeIndex > 0)
            {
                int parentIndex = GetParentIndex(nodeIndex);
                (TElement Element, TPriority Priority) parent = nodes[parentIndex];

                if (Comparer<TPriority>.Default.Compare(node.Priority, parent.Priority) < 0)
                {
                    nodes[nodeIndex] = parent;
                    nodeIndex = parentIndex;
                }
                else
                {
                    break;
                }
            }

            nodes[nodeIndex] = node;
        }
```

:::

## 前提知識

- **ヒープの親子関係**: 4 分ヒープなので、番号 `i` の親は `(i - 1) / 4`（`GetParentIndex`）です。親の優先度は必ず子以下になるように保ちます。
- **`Comparer<TPriority>.Default.Compare(a, b)`**: 型の既定の比較で、`a < b` なら負の数を返します。
- **`node` と `nodeIndex`**: `node` は今動かしたい要素、`nodeIndex` はその今の位置です。
- **`nodes[nodeIndex] = parent`**: 配列の要素に代入すると、その位置の内容が置き換わります。
- **`Debug.Assert`**: デバッグビルドでだけ確認される前提条件です。

## 何をしているか

### 1. 比較器の確認と、配列の取り出し

```csharp:line-numbers=721
            Debug.Assert(_comparer is null);
            Debug.Assert(0 <= nodeIndex && nodeIndex < _size);

            (TElement Element, TPriority Priority)[] nodes = _nodes;
```

比較器が `null`（既定の比較）であることを、デバッグ時に確かめます。ループの中で使う配列を、ローカル変数に入れておきます。

### 2. 親より小さければ、親を下に下げる

```csharp:line-numbers=726
            while (nodeIndex > 0)
            {
                int parentIndex = GetParentIndex(nodeIndex);
                (TElement Element, TPriority Priority) parent = nodes[parentIndex];

                if (Comparer<TPriority>.Default.Compare(node.Priority, parent.Priority) < 0)
                {
                    nodes[nodeIndex] = parent;
                    nodeIndex = parentIndex;
                }
```

`nodeIndex` が 0（根）でない間、親の番号を求めて比べます。新しい要素の優先度が親より小さければ、親を今の位置にコピーし、`nodeIndex` を親の位置に進めます。

例えば、根に 5、その子に 9 がある状態で、9 の子の位置に 3 を追加すると、次のように進みます。

```
追加した 3 は子の位置にある → 親（9）より小さい → 9 を下へコピー
3 は親の位置に上がる → その親（5）より小さい → 5 を下へコピー
3 は根に到達 → 止まる
```

### 3. 最後に、新しい要素を書き込む

```csharp:line-numbers=742
            nodes[nodeIndex] = node;
```

ループを抜けた位置に、最初の `node` を書きます。親より大きくなったところで止まるので、ここが正しい位置です。

## ここがすごい

- **入れ替えず、穴を動かす**: 普通に入れ替えると、1 段ごとに 3 回の代入が必要です。この方法では、親を下へ 1 回コピーするだけで、新しい要素の書き込みは最後の 1 回だけです。
- **浮かぶ距離はほとんどが短い**: 新しい要素は、たいてい親より大きいので、すぐ止まります。最悪でも木の高さ（log₄ n）までです。
- **比較器ごとに関数を分ける**: この関数は既定の比較器専用です。比較器を指定した版（`MoveUpCustomComparer`）と分けることで、既定の比較は型に応じて直接の比較命令になります。
- **挿入ソートと同じ考え方**: コメントにあるように、挿入ソートと同じ「穴を動かす」最適化です。

## まとめ

- ヒープに要素を追加するときは、親より小さい間だけ親を下げて、穴を上へ運ぶ。
- 入れ替えの代わりに穴を動かすと、代入の回数を減らせる。
- 比較器の有無で関数を分けると、型に合った速い比較が使える。
