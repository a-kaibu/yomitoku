---
title: "配列を倍にするとき、最大長を超えないように押さえる"
description: ".NET の List<T> の容量を決める GetNewCapacity。現在の容量の 2 倍を目安にし、Array.MaxLength を超えないように上限で押さえ、必要量に届かなければ必要量に合わせる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs
lines: [487, 503]
function: "List<T>.GetNewCapacity"
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, データ構造]
---

## ひとことで

`GetNewCapacity(capacity)` は、`List<T>` の内部の配列を広げるときの **新しい容量** を決めます。
基本は今の容量の 2 倍です。最初は既定の小さな値（4）から始まります。

ただし、配列には最大の長さがあるので、2 倍がその上限を超えないように押さえています。

## コード

::: code-group

```csharp:line-numbers=487 [日本語訳]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private int GetNewCapacity(int capacity)
        {
            Debug.Assert(_items.Length < capacity);

            int newCapacity = _items.Length == 0 ? DefaultCapacity : 2 * _items.Length;

            // 非常に大きい（約 20 億要素まで）の容量まで、オーバーフローに注意して広げられるようにする。
            // (uint) キャストのおかげで、_items.Length がオーバーフローしていてもこのチェックは正しく働く。
            if ((uint)newCapacity > Array.MaxLength) newCapacity = Array.MaxLength;

            // 計算した容量が要求量より小さければ、元の要求量に設定する。
            // Array.MaxLength を超える容量は Array.Resize で OutOfMemoryException になる。
            if (newCapacity < capacity) newCapacity = capacity;

            return newCapacity;
        }
```

```csharp:line-numbers=487 [原文]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private int GetNewCapacity(int capacity)
        {
            Debug.Assert(_items.Length < capacity);

            int newCapacity = _items.Length == 0 ? DefaultCapacity : 2 * _items.Length;

            // Allow the list to grow to maximum possible capacity (~2G elements) before encountering overflow.
            // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
            if ((uint)newCapacity > Array.MaxLength) newCapacity = Array.MaxLength;

            // If the computed capacity is still less than specified, set to the original argument.
            // Capacities exceeding Array.MaxLength will be surfaced as OutOfMemoryException by Array.Resize.
            if (newCapacity < capacity) newCapacity = capacity;

            return newCapacity;
        }
```

:::

## 前提知識

- **容量と要素数**: `List<T>` は内部に配列を持っています。配列の長さが容量で、実際に使っている数は要素数です。
- **`Array.MaxLength`**: .NET の配列が持てる最大の長さです。約 20 億（0x7FFFFFC7 程度）です。
- **`(uint)` のキャスト**: 負の値になったときも、大きな正の数として比べられるようにする書き方です。
- **三項演算子 `? :`**: 条件が真なら左、偽なら右の値を使います。

## 何をしているか

### 1. 2 倍を計算する

```csharp:line-numbers=492
            int newCapacity = _items.Length == 0 ? DefaultCapacity : 2 * _items.Length;
```

配列が空なら既定の容量（4）、そうでなければ今の長さの 2 倍にします。

例: 容量 8 のリストが満杯になったら、新しい容量は 16 になります。

### 2. 上限で押さえる

```csharp:line-numbers=496
            if ((uint)newCapacity > Array.MaxLength) newCapacity = Array.MaxLength;
```

2 倍が `Array.MaxLength` を超えたら、上限に切り詰めます。

コメントにあるように、この比較は `(uint)newCapacity` で行います。2 倍した `int` がオーバーフローして負の数になっていても、`uint` にすると大きな正の数に戻るので、きちんと上限で止まります。

### 3. 必要量に届かなければ、必要量にする

```csharp:line-numbers=500
            if (newCapacity < capacity) newCapacity = capacity;
```

上限まで伸ばしても要求された容量に届かないとき（たとえば 1 回に大量の要素を `AddRange` したとき）は、必要量をそのまま使います。

## ここがすごい

- **2 倍で償却的に速い**: 容量を 2 倍にすると、要素を 1 つずつ追加しても、コピーの合計は要素数に比例します。1 回あたりの平均は定数時間です。
- **オーバーフローを `uint` で防ぐ**: 2 倍の計算で `int` があふれても、`(uint)` の比較で正しく判定できます。
- **必要量を優先する**: 大量の要素をまとめて追加する場合は、2 倍では足りないことがあります。その場合は必要量まで一気に広げるので、何度も作り直さずに済みます。
- **役割の分担**: 容量を決める処理を 1 つの関数にまとめ、`Add` や `Insert` などから呼んでいます。上限や最小値の規則が 1 か所にあるので、変更しやすくなっています。

## まとめ

- 配列を広げるときは、2 倍にすると全体の速さが安定する。
- 上限を超えないように押さえ、足りなければ必要量に合わせる。
- 整数のあふれは、比較を符号なしにするなどして防げる。
