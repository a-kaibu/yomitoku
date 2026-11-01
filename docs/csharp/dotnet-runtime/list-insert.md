---
title: "リストの指定位置に要素を挿入し、後ろの要素を後ろへずらす"
description: ".NET の List<T>.Insert。指定の位置に新しい要素を入れるため、後ろの要素を Array.Copy で 1 つずつ後ろへずらす。容量が足りなければ先に拡張する。末尾への挿入も許される。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs
lines: [770, 787]
function: "List<T>.Insert(int, T)"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, 最適化]
---

## ひとことで

`Insert(index, item)` は、リストの **指定した位置に要素を入れる** 関数です。
たとえば `[a, c]` の位置 1 に `b` を入れると、`[a, b, c]` になります。`c` は、後ろへ 1 つずれます。

位置が要素数と同じなら、末尾への追加になります。

## コード

::: code-group

```csharp:line-numbers=770 [日本語訳]
        public void Insert(int index, T item)
        {
            // 末尾への挿入も正しい操作として認める。
            if ((uint)index > (uint)_size)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index, ExceptionResource.ArgumentOutOfRange_ListInsert);
            }
            if (_size == _items.Length)
            {
                GrowForInsertion(index, 1);
            }
            else if (index < _size)
            {
                Array.Copy(_items, index, _items, index + 1, _size - index);
            }
            _items[index] = item;
            _size++;
            _version++;
```

```csharp:line-numbers=770 [原文]
        public void Insert(int index, T item)
        {
            // Note that insertions at the end are legal.
            if ((uint)index > (uint)_size)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index, ExceptionResource.ArgumentOutOfRange_ListInsert);
            }
            if (_size == _items.Length)
            {
                GrowForInsertion(index, 1);
            }
            else if (index < _size)
            {
                Array.Copy(_items, index, _items, index + 1, _size - index);
            }
            _items[index] = item;
            _size++;
            _version++;
```

:::

## 前提知識

- **`List<T>`**: 要素を並べて入れる、伸び縮みする配列です。
- **容量と要素数**: 配列の長さ（容量）と、中に入っている要素の数（`_size`）は別の値です。容量が足りなくなったら、拡張が必要です。
- **`Array.Copy`**: 配列の一部を、別の位置へまとめてコピーします。要素を後ろへずらすために使います。
- **`GrowForInsertion`**: 挿入のために配列を大きくして、要素を入る位置を空ける補助の関数です。
- **`_version`**: 変更の回数です。挿入のたびに増やします。

## 何をしているか

### 1. 位置を確かめる

```csharp:line-numbers=772
            // 末尾への挿入も正しい操作として認める。
            if ((uint)index > (uint)_size)
            {
                ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index, ExceptionResource.ArgumentOutOfRange_ListInsert);
            }
```

位置が 0 以上で、要素数以下かを確かめます。要素数と同じ位置は末尾への挿入なので許されます。それ以外の範囲外なら、例外を投げます。

### 2. 容量の確認と、場所を空ける

```csharp:line-numbers=777
            if (_size == _items.Length)
            {
                GrowForInsertion(index, 1);
            }
            else if (index < _size)
            {
                Array.Copy(_items, index, _items, index + 1, _size - index);
            }
```

配列がいっぱいなら、`GrowForInsertion` で大きくします。まだ余裕があり、挿入位置が末尾でなければ、`Array.Copy` で後ろの要素を 1 つ後ろへずらします。

### 3. 要素を入れて記録する

```csharp:line-numbers=785
            _items[index] = item;
            _size++;
            _version++;
```

挿入位置に `item` を入れ、要素数と `_version` を増やします。

### 具体例で確かめる

`[a, c]`（要素数 2、容量 4）の位置 1 に `b` を入れます。

```
容量に余裕があり、位置 1 は末尾ではない → c を位置 2 へずらす
位置 1 に b を入れる → [a, b, c]
要素数を 3 にする
```

## ここがすごい

- **余裕があれば拡張しない**: 容量が残っていれば、配列を作り直さずに同じ配列の中でずらします。
- **末尾への挿入は速い**: 位置が要素数と同じなら、ずらす処理は起きません。
- **範囲を正確に判定**: `(uint)index > (uint)_size` という 1 回の比較で、負の値も要素数を超える値も、まとめて弾けます。
- **挿入後の整合性**: 要素数と変更の回数を必ず更新するので、他の処理が古い状態を読むことがありません。

## まとめ

- `Insert` は、指定位置に要素を入れ、後ろの要素を `Array.Copy` で後ろへずらす。
- 容量が足りなければ、先に `GrowForInsertion` で拡張する。
- 末尾への挿入も正しい操作として扱い、その場合はずらす処理が起きない。
