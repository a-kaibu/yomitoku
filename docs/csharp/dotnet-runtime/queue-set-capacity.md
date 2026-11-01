---
title: "輪になった配列を、2 回のコピーで一直線に並べ直す"
description: "Queue<T> の SetCapacity は、リングバッファの中身を新しい配列に移すとき、先頭が末尾より後ろにある「折り返した」状態なら 2 回に分けてコピーし、先頭を 0 番目にそろえる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [310, 331]
function: "Queue<T>.SetCapacity"
difficulty: 1
format: 2
tags: [データ構造, メモリ管理]
---

## ひとことで

`Queue<T>` は配列を輪のように使うリングバッファです。要素が増えて配列がいっぱいになると、`SetCapacity` で大きな配列に作り直します。

輪の中身は、配列の途中から始まって末尾で折り返し、先頭側に続いていることがあります。この関数は、そうした中身を **新しい配列の 0 番目から一直線に並ぶように** 写し直します。

## コード

```csharp:line-numbers=310
        private void SetCapacity(int capacity)
        {
            Debug.Assert(capacity >= _size);
            T[] newarray = new T[capacity];
            if (_size > 0)
            {
                if (_head < _tail)
                {
                    Array.Copy(_array, _head, newarray, 0, _size);
                }
                else
                {
                    Array.Copy(_array, _head, newarray, 0, _array.Length - _head);
                    Array.Copy(_array, 0, newarray, _array.Length - _head, _tail);
                }
            }

            _array = newarray;
            _head = 0;
            _tail = (_size == capacity) ? 0 : _size;
            _version++;
        }
```

## 前提知識

- **`_head` と `_tail`**: `_head` は次に取り出す要素の位置、`_tail` は次に追加する位置です。`_size` は入っている要素数です。
- **`Array.Copy(src, srcIndex, dst, dstIndex, length)`**: 配列 src の srcIndex から length 個を、dst の dstIndex 以降に写します。内部ではメモリをまとめてコピーする高速な処理が使われます。
- **`Debug.Assert`**: デバッグビルドでだけ動く確認です。新しい容量が要素数より小さくないことを確かめています。
- **`(_size == capacity) ? 0 : _size`**: 三項演算子です。条件が真なら 0、偽なら `_size` になります。

## 何をしているか

長さ 4 の配列に、次のように 4 つの要素が入っているとします（`_head = 2`、`_tail = 2`、満杯）。

```
添字:  0  1  2  3
中身: [C, D, A, B]     取り出す順番は A, B, C, D
```

### 1. 折り返していないとき

```csharp:line-numbers=316
                if (_head < _tail)
                {
                    Array.Copy(_array, _head, newarray, 0, _size);
                }
```

`_head < _tail` なら、要素は `_head` から一続きに並んでいるので、1 回のコピーで済みます。

### 2. 折り返しているとき

```csharp:line-numbers=320
                else
                {
                    Array.Copy(_array, _head, newarray, 0, _array.Length - _head);
                    Array.Copy(_array, 0, newarray, _array.Length - _head, _tail);
                }
```

`_head` 以降の部分（A, B）をまず新しい配列の先頭に写し、続けて配列の先頭から `_tail` までの部分（C, D）を写します。

```
新しい配列（長さ 8）: [A, B, C, D, _, _, _, _]
```

### 3. 位置を更新

```csharp:line-numbers=327
            _array = newarray;
            _head = 0;
            _tail = (_size == capacity) ? 0 : _size;
            _version++;
```

`_head` は 0 に、`_tail` は要素数（4）になります。ただし、新しい容量と要素数が同じ（満杯）なら、次に追加する位置は輪を一周した 0 です。最後の三項演算子はこの境界の場合を扱っています。

## ここがすごい

- **作り直しのついでに整列**: 輪を「ほどいて」先頭からまっすぐ並べ直すので、作り直した直後は折り返しのない、単純な状態になります。以降しばらくは `_head < _tail` のまま使えます。
- **ループではなく `Array.Copy` 2 回**: 要素を 1 つずつ写すと、要素ごとに添字の計算と範囲チェックが入ります。`Array.Copy` は連続したメモリをまとめて写すので、ずっと速く動きます。
- **縮めるときにも使える**: `TrimExcess`（余った容量を減らす）からも同じ関数が呼ばれます。「広げる」「縮める」を 1 つの関数で扱えるよう、`capacity >= _size` だけを前提にしています。
- **`_version++`**: 中身の並びが変わるので、列挙中（`foreach` の途中）なら次の要素の取得で例外にできるよう、バージョンを進めています。

## まとめ

- リングバッファを作り直すときは、折り返しの有無で 1 回か 2 回のコピーに分ければよい。
- 新しい配列では先頭を 0 にそろえると、その後の扱いが単純になる。
- 満杯のときの `_tail` のような境界の値は、別に扱う必要がある。
