---
title: "根を取り除いたら、末尾の要素を根から沈めて穴を埋める"
description: "PriorityQueue の RemoveRootNode。最優先の要素を取り出すと、配列の末尾にあった要素を根から沈め込んで埋める。参照型では取り除いた場所を default で消して GC に返す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/PriorityQueue.cs
lines: [650, 672]
function: "PriorityQueue<TElement, TPriority>.RemoveRootNode"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, メモリ管理]
---

## ひとことで

`RemoveRootNode` は、優先度付きキューの **一番先に出る要素（根）** を取り除く関数です。
ヒープは配列で表されているので、根を消すと 0 番目に穴があきます。この関数は、末尾の要素をその穴に持ってきて、正しい位置まで沈めます。

## コード

```csharp:line-numbers=650
        private void RemoveRootNode()
        {
            int lastNodeIndex = --_size;
            _version++;

            if (lastNodeIndex > 0)
            {
                (TElement Element, TPriority Priority) lastNode = _nodes[lastNodeIndex];
                if (_comparer == null)
                {
                    MoveDownDefaultComparer(lastNode, 0);
                }
                else
                {
                    MoveDownCustomComparer(lastNode, 0);
                }
            }

            if (RuntimeHelpers.IsReferenceOrContainsReferences<(TElement, TPriority)>())
            {
                _nodes[lastNodeIndex] = default;
            }
        }
```

## 前提知識

- **根（ルート）**: 配列の先頭（0 番目）にあり、いちばん優先度の小さい要素です。
- **`--_size`**: 要素数を 1 減らします（前置の減算）。`lastNodeIndex` は、減らした後の「最後の要素の位置」です。
- **`MoveDownDefaultComparer(lastNode, 0)`**: 与えた要素を、根から正しい位置まで沈める関数です。
- **`default`**: 型の既定値です。参照型なら `null`、構造体なら中身が 0 の値です。
- **`RuntimeHelpers.IsReferenceOrContainsReferences<T>()`**: 型が参照（オブジェクトへのポインタ）を含むかどうかを、実行時の仕組みで判定します。含まない型では、後片付けを省けます。

## 何をしているか

### 1. 要素数を減らし、末尾の要素を取り出す

```csharp:line-numbers=652
            int lastNodeIndex = --_size;
            _version++;

            if (lastNodeIndex > 0)
            {
                (TElement Element, TPriority Priority) lastNode = _nodes[lastNodeIndex];
```

まず要素数を 1 減らして、末尾の位置を求めます。残った要素が 1 つ以上あれば、末尾の要素を `lastNode` として取り出します。

### 2. 末尾の要素を根から沈める

```csharp:line-numbers=658
                if (_comparer == null)
                {
                    MoveDownDefaultComparer(lastNode, 0);
                }
                else
                {
                    MoveDownCustomComparer(lastNode, 0);
                }
```

比較器が指定されていなければ既定の版、指定されていれば比較器を使う版で、`lastNode` を根から沈めます。沈める途中で、小さい子が一段ずつ上に上がるので、最後に空いた場所へ `lastNode` が入ります。

もし要素が 1 つしかなければ、末尾が根そのものなので、沈める必要はありません（`lastNodeIndex > 0` の条件）。

### 3. 参照を含む型は、空いた末尾を消す

```csharp:line-numbers=668
            if (RuntimeHelpers.IsReferenceOrContainsReferences<(TElement, TPriority)>())
            {
                _nodes[lastNodeIndex] = default;
            }
```

末尾の位置にはもう有効な要素がありません。参照型なら、その場所を既定値にして、オブジェクトへの参照を外します。そうすると、キューから取り除かれたオブジェクトを GC が回収できます。

## ここがすごい

- **末尾を根に持ってくる**: 根を取り除いた後、ヒープの形を保つには、末尾の要素を使うのが最も簡単です。配列の末尾を削るだけで形が保たれるからです。
- **沈める処理を再利用**: `MoveDown` は、取り出し・追加のどちらでも使える共通の処理です。関数を分けることで、同じ仕組みを繰り返し書かずに済みます。
- **GC に配慮**: 取り除いた後も、配列の末尾に古い参照が残ると、オブジェクトが解放されません。参照型の場合だけ消すことで、無駄なメモリの保持を防ぎます。
- **型によって消す処理を省く**: `int` などの値型だけの要素では、そもそも参照が残らないので、この後片付けを行いません。型の性質に応じて、余計な処理を省いています。

## まとめ

- ヒープから根を取り除くときは、末尾の要素を根から沈めると形が保たれる。
- 要素を削った場所は、参照型なら既定値にしてメモリを解放しやすくする。
- 型が参照を含むかどうかで、後片付けの有無を分けられる。
