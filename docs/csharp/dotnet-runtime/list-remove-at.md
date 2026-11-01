---
title: "リストの指定位置を消し、後ろの要素を前へ詰める"
description: ".NET の List<T>.RemoveAt。指定の位置の要素を取り除き、後ろの要素を Array.Copy で 1 つずつ前へずらす。参照型は、空いた末尾の枠を既定値に戻して GC の対象にする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs
lines: [1001, 1017]
function: "List<T>.RemoveAt(int)"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 防御的プログラミング]
---

## ひとことで

`RemoveAt(index)` は、リストの **指定した位置の要素を取り除く** 関数です。
たとえば `[a, b, c, d]` の位置 1 を取り除くと、`[a, c, d]` になります。`c` と `d` は、前へ 1 つずつずれます。

取り除いた後は、要素の並びに隙間が残らないように、後ろの要素を詰めます。

## コード

```csharp:line-numbers=1001
        public void RemoveAt(int index)
        {
            if ((uint)index >= (uint)_size)
            {
                ThrowHelper.ThrowArgumentOutOfRange_IndexMustBeLessException();
            }
            _size--;
            if (index < _size)
            {
                Array.Copy(_items, index + 1, _items, index, _size - index);
            }
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                _items[_size] = default!;
            }
            _version++;
        }
```

## 前提知識

- **`List<T>`**: 要素を並べて入れる、伸び縮みする配列です。内部では、長さに余裕のある配列を持っています。
- **`_size`**: リストの中に実際に入っている要素の数です。配列の長さ（容量）とは別です。
- **`Array.Copy`**: 配列の一部を、別の位置へまとめてコピーします。要素を前へずらすために使います。
- **`RuntimeHelpers.IsReferenceOrContainsReferences<T>()`**: 型が参照を含むかを調べる関数です。参照型なら、空いた枠を消す必要があります。
- **`_version`**: リストの変更の回数です。列挙の途中で変わったことを検出するために増やします。

## 何をしているか

### 1. 範囲を確かめる

```csharp:line-numbers=1003
            if ((uint)index >= (uint)_size)
            {
                ThrowHelper.ThrowArgumentOutOfRange_IndexMustBeLessException();
            }
```

位置が 0 以上で、要素数より小さいかを確かめます。範囲外なら、例外で知らせます。

### 2. 個数を減らし、後ろを前へ詰める

```csharp:line-numbers=1007
            _size--;
            if (index < _size)
            {
                Array.Copy(_items, index + 1, _items, index, _size - index);
            }
```

まず `_size` を 1 減らします。消した位置より後ろに要素があれば、`Array.Copy` で後ろの要素を 1 つ前へずらします。

### 3. 空いた末尾の枠を消す

```csharp:line-numbers=1012
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                _items[_size] = default!;
            }
```

参照型の要素なら、もう使われない末尾の枠を既定値（`null` など）に戻します。古いオブジェクトへの参照が残って、GC で解放できなくなるのを防ぐためです。

### 4. 変更を記録する

```csharp:line-numbers=1016
            _version++;
```

`_version` を増やして、進行中の列挙を無効にできるようにします。

## ここがすごい

- **配列の中で詰める**: 新しい配列を作らず、同じ配列の中で要素をずらすので、メモリの追加が要りません。
- **末尾だけを確かめる**: 消すのが末尾の要素なら、ずらす処理は起きません。`index < _size` の判定で省いています。
- **メモリを残さない**: 参照型の末尾の枠を空にするので、消した要素を大きなオブジェクトごと保持し続けることがありません。
- **列挙の安全性**: 変更の回数を記録することで、列挙の途中の変更を検出できます。

## まとめ

- `RemoveAt` は、指定位置の要素を消し、後ろの要素を `Array.Copy` で前へ詰める。
- 参照型では、空いた末尾の枠を既定値に戻して、メモリを解放しやすくする。
- 変更の回数を増やし、進行中の列挙が壊れたことを検出できるようにする。
