---
title: "循環する二重連結リストで、ノードの前に新しいノードを挟む"
description: ".NET Runtime の LinkedList の InternalInsertNodeBefore。前後の参照を 4 か所書き換えて、指定したノードの直前に新しいノードを挟む。先頭と末尾の繋がりも自動で保たれる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/LinkedList.cs
lines: [377, 385]
function: "LinkedList<T>.InternalInsertNodeBefore(LinkedListNode<T>, LinkedListNode<T>)"
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, 低レイヤ]
---

## ひとことで

`InternalInsertNodeBefore` は、連結リストの中で、ある **ノードの直前に新しいノードを挟む** 関数です。
配列のように要素を移動させず、前後のつながりを書き換えるだけで済みます。

この `LinkedList` は、先頭と末尾がつながった **循環する二重連結リスト** として作られています。そのため、先頭の前も末尾の後ろも、同じ仕組みで扱えます。

## コード

```csharp:line-numbers=377
        private void InternalInsertNodeBefore(LinkedListNode<T> node, LinkedListNode<T> newNode)
        {
            newNode.next = node;
            newNode.prev = node.prev;
            node.prev!.next = newNode;
            node.prev = newNode;
            version++;
            count++;
        }
```

## 前提知識

- **連結リスト**: 要素（ノード）が、次と前への参照でつながったデータ構造です。途中に挟むのが速いのが特徴です。
- **二重連結リスト**: 次（`next`）と前（`prev`）の両方への参照を持つ連結リストです。
- **循環**: 最後のノードの `next` が先頭を指し、先頭の `prev` が最後を指す形です。
- **`!`（null 許容の解除）**: 値が `null` でないことを、コンパイラに伝える書き方です。ここでは、循環しているため、`prev` は必ずあると判断しています。
- **`version` と `count`**: 変更の回数と、要素数を数える変数です。

## 何をしているか

### 1. 新しいノードの前後を、指定のノードに合わせる

```csharp:line-numbers=379
            newNode.next = node;
            newNode.prev = node.prev;
```

新しいノードの `next` を指定のノード（`node`）にします。`prev` は、その前にあったノードにします。

### 2. 前のノードの next を、新しいノードに向ける

```csharp:line-numbers=381
            node.prev!.next = newNode;
```

`node` の前にあったノードの `next` を、新しいノードに書き換えます。これで、前から新しいノードへつながります。

### 3. 指定のノードの prev を、新しいノードに向ける

```csharp:line-numbers=382
            node.prev = newNode;
```

`node` の `prev` を、新しいノードに書き換えます。これで、後ろから新しいノードへつながります。

### 4. 変更の記録を更新する

```csharp:line-numbers=383
            version++;
            count++;
```

版番号と要素数を 1 増やします。版番号は、列挙の途中で変更されたことを見つけるためのものです。

## ここがすごい

- **要素を動かさない**: 配列のように後ろの要素を全部ずらさず、参照を 4 か所書き換えるだけです。
- **先頭と末尾も同じ処理**: 循環しているので、先頭や末尾に挟む場合も、この処理の形を変えずに使えます。
- **参照の張り替えが対称**: 前後の両方向を、対になる形で書き換えるので、どちらの方向からたどっても正しくつながります。

## まとめ

- 新しいノードの `next` と `prev` を、指定のノードの周りに合わせる。
- 前のノードの `next` と、指定のノードの `prev` を、新しいノードに向ける。
- 版番号と要素数を更新する。
