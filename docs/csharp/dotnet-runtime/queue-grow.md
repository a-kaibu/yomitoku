---
title: "キューの容量を 2 倍に広げ、最低の増え方と上限を守る"
description: ".NET の Queue<T>.Grow。容量を 2 倍にするが、最低 4 個は増やし、配列の最大長を超えないように抑える。要求された容量に届かなければ、要求された値を使う。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [395, 416]
function: "Queue<T>.Grow(int)"
difficulty: 3
format: 2
tags: [メモリ管理, 数値計算, 防御的プログラミング]
---

## ひとことで

`Grow(capacity)` は、キューの内部配列を **より大きく作り直す** 処理です。
容量を 2 倍にするのが基本ですが、小さい配列では最低 4 個は増やし、配列の最大長を超えないように止めます。

キューに要素を入れるたびに作り直すと遅くなるので、大きく広げて、作り直す回数を減らしています。

## コード

::: code-group

```csharp:line-numbers=395 [日本語訳]
        private void Grow(int capacity)
        {
            Debug.Assert(_array.Length < capacity);

            const int GrowFactor = 2;
            const int MinimumGrow = 4;

            int newcapacity = GrowFactor * _array.Length;

            // 配列の最大長（約 20 億要素）まで、オーバーフローせずに広げられるようにする。
            // (uint) にキャストしているので、値があふれたときもこの確認は正しく働く。
            if ((uint)newcapacity > Array.MaxLength) newcapacity = Array.MaxLength;

            // 最低限の増え方（4 個）を必ず確保する。
            newcapacity = Math.Max(newcapacity, _array.Length + MinimumGrow);

            // 計算した容量が要求された値に届かなければ、要求された値を使う。
            // 配列の最大長を超えた場合は、Array.Resize が OutOfMemoryException として知らせる。
            if (newcapacity < capacity) newcapacity = capacity;

            SetCapacity(newcapacity);
        }
```

```csharp:line-numbers=395 [原文]
        private void Grow(int capacity)
        {
            Debug.Assert(_array.Length < capacity);

            const int GrowFactor = 2;
            const int MinimumGrow = 4;

            int newcapacity = GrowFactor * _array.Length;

            // Allow the list to grow to maximum possible capacity (~2G elements) before encountering overflow.
            // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
            if ((uint)newcapacity > Array.MaxLength) newcapacity = Array.MaxLength;

            // Ensure minimum growth is respected.
            newcapacity = Math.Max(newcapacity, _array.Length + MinimumGrow);

            // If the computed capacity is still less than specified, set to the original argument.
            // Capacities exceeding Array.MaxLength will be surfaced as OutOfMemoryException by Array.Resize.
            if (newcapacity < capacity) newcapacity = capacity;

            SetCapacity(newcapacity);
        }
```

:::

## 前提知識

- **容量（capacity）**: 配列が入れられる要素の最大数です。要素数とは別の値です。
- **倍増（doubling）**: 容量を 2 倍にする方法です。何回広げても、一度に入る要素の数が指数的に増えるので、追加の回数あたりの作業が平均して少なくなります。
- **`Array.MaxLength`**: .NET の配列が持てる最大の長さです。約 20 億要素ほどです。
- **オーバーフロー**: 整数の計算結果が、型の表せる範囲を超えてしまうことです。
- **`Math.Max`**: 2 つの値の大きい方を返します。最低の増え方を確保するために使います。

## 何をしているか

### 1. 2 倍の容量を計算する

```csharp:line-numbers=399
            const int GrowFactor = 2;
            const int MinimumGrow = 4;

            int newcapacity = GrowFactor * _array.Length;
```

基本の増え方は 2 倍です。`GrowFactor` と `MinimumGrow` は定数として決めています。

### 2. 上限を守る

```csharp:line-numbers=404
            // 配列の最大長（約 20 億要素）まで、オーバーフローせずに広げられるようにする。
            // (uint) にキャストしているので、値があふれたときもこの確認は正しく働く。
            if ((uint)newcapacity > Array.MaxLength) newcapacity = Array.MaxLength;
```

2 倍が配列の最大長を超えたら、最大長に収めます。`(uint)` にキャストして比べるので、掛け算の結果があふれていても正しく判定できます。

### 3. 最低の増え方を確保する

```csharp:line-numbers=408
            // 最低限の増え方（4 個）を必ず確保する。
            newcapacity = Math.Max(newcapacity, _array.Length + MinimumGrow);
```

小さい配列でも、少なくとも 4 個は増やすようにします。空の配列を 2 倍しても、0 のままになるのを防ぐためです。

### 4. 要求された容量を下回らないようにする

```csharp:line-numbers=411
            // 計算した容量が要求された値に届かなければ、要求された値を使う。
            // 配列の最大長を超えた場合は、Array.Resize が OutOfMemoryException として知らせる。
            if (newcapacity < capacity) newcapacity = capacity;

            SetCapacity(newcapacity);
```

計算した容量が、呼び出し側が必要とした容量に届かなければ、必要な値を使います。最後に `SetCapacity` で配列を作り直します。

### 具体例で確かめる

容量 2 の配列を広げるとき、`2 × 2 = 4` ですが、最低増加は `2 + 4 = 6` です。`Math.Max(4, 6)` で 6 になります。

## ここがすごい

- **作り直しの回数が少ない**: 倍々に広げるので、要素を追加し続けても、作り直しは対数的な回数で済みます。
- **小さい配列の無駄を防ぐ**: 最低の増え方を決めておくと、空や極小の配列で作り直しが頻繁に起きません。
- **上限を正しく扱う**: 配列の最大長を超えないように止め、それ以上は例外で知らせます。
- **計算の安全性**: `(uint)` のキャストで、掛け算のあふれも判定の中で正しく扱います。

## まとめ

- `Grow` は、容量を 2 倍にして、配列を作り直す。
- 小さい配列でも最低 4 個は増やし、配列の最大長を超えないように止める。
- 要求された容量に届かない場合は、要求された値を使う。
