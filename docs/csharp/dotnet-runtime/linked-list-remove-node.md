---
title: "循環する連結リストから、指定のノードを外す"
description: ".NET Runtime の LinkedList の InternalRemoveNode。ノードの前後をつなぎ直して外す。ノードが 1 つだけなら先頭を空にし、先頭を外すなら先頭を次のノードへ移す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/LinkedList.cs
lines: [397, 417]
function: "LinkedList<T>.InternalRemoveNode(LinkedListNode<T>)"
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, 低レイヤ]
---

## ひとことで

`InternalRemoveNode` は、連結リストから **指定したノードを取り除く** 関数です。
取り除いたノードの前後のノードを、直接つなぎ直すので、他の要素を動かす必要がありません。

この連結リストは循環しているため、ノードが 1 つだけの場合と、先頭を外す場合を特別に扱います。

## コード

```csharp:line-numbers=397
        internal void InternalRemoveNode(LinkedListNode<T> node)
        {
            Debug.Assert(node.list == this, "Deleting the node from another list!");
            Debug.Assert(head != null, "This method shouldn't be called on empty list!");
            if (node.next == node)
            {
                Debug.Assert(count == 1 && head == node, "this should only be true for a list with only one node");
                head = null;
            }
            else
            {
                node.next!.prev = node.prev;
                node.prev!.next = node.next;
                if (head == node)
                {
                    head = node.next;
                }
            }
            node.Invalidate();
            count--;
            version++;
```

## 前提知識

- **二重連結リスト**: 次（`next`）と前（`prev`）の両方への参照を持つ連結リストです。
- **`head`**: リストの先頭のノードを指す参照です。空のリストでは `null` になります。
- **循環**: 最後のノードの `next` が先頭を指し、先頭の `prev` が最後を指す形です。
- **`Invalidate`**: ノードを、リストから外れた状態にする処理です。外したノードを、後から誤って使わないようにします。
- **`Debug.Assert`**: 開発時に、前提が正しいかを確かめるための検査です。リリースのビルドでは実行されません。

## 何をしているか

### 1. ノードが 1 つだけなら、リストを空にする

```csharp:line-numbers=401
            if (node.next == node)
            {
                Debug.Assert(count == 1 && head == node, "this should only be true for a list with only one node");
                head = null;
            }
```

自分の次が自分自身なら、リストにはこのノードしかありません。先頭を `null` にして、リストを空にします。

### 2. 前後のノードをつなぎ直す

```csharp:line-numbers=407
            {
                node.next!.prev = node.prev;
                node.prev!.next = node.next;
```

外すノードの前のノードの `next` と、後ろのノードの `prev` を、お互いに向け直します。こうすると、外すノードを飛ばしてつながります。

### 3. 先頭を外すなら、先頭を次へ移す

```csharp:line-numbers=410
                if (head == node)
                {
                    head = node.next;
                }
```

外すノードが先頭だったら、先頭を次のノードにします。これで、リストの入り口が正しく保たれます。

### 4. 外したノードを無効にし、記録を更新する

```csharp:line-numbers=415
            node.Invalidate();
            count--;
            version++;
```

外したノードを無効にして、要素数を 1 減らし、版番号を 1 増やします。

## ここがすごい

- **要素を動かさない**: 外すノードの前後を直接つなぎ直すので、配列のように後ろの要素をずらす必要がありません。
- **特別な場合を分けている**: 1 つだけのとき、先頭のとき、途中のとき、の 3 通りを明確に分けています。
- **外したノードを無効化**: 外したノードを使い続けるとバグになるので、無効にして防ぎます。

## まとめ

- ノードが 1 つだけなら、先頭を空にする。
- それ以外は、前後のノードをつなぎ直して外す。
- 先頭を外すなら先頭を移し、ノードを無効にして、要素数と版番号を更新する。
