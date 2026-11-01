---
title: "集合に新しい要素を入れるとき、削除で空いた枠を先に使う"
description: ".NET の HashSet<T> で要素を追加する後半部分。削除で空いた枠（空きリスト）を優先して使い、無ければ末尾に追加する。新しい枠は、バケツの先頭につないで鎖の一部にする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/HashSet.cs
lines: [1522, 1551]
function: "HashSet<T>.AddIfNotPresent(T, out int)（追加の後半）"
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, メモリ管理]
---

## ひとことで

この部分は、`HashSet<T>` に **まだ無い要素を追加する** 処理です。
要素の入る場所（枠）を、まず削除で空いた枠から探し、無ければ配列の末尾に作ります。そのあと、ハッシュ値のバケツの先頭につないで、検索できるようにします。

## コード

::: code-group

```csharp:line-numbers=1522 [日本語訳]
            int index;
            if (_freeCount > 0)
            {
                index = _freeList;
                _freeCount--;
                Debug.Assert((StartOfFreeList - entries[_freeList].Next) >= -1, "shouldn't overflow because `next` cannot underflow");
                _freeList = StartOfFreeList - entries[_freeList].Next;
            }
            else
            {
                int count = _count;
                if (count == entries.Length)
                {
                    Resize();
                    bucket = ref GetBucketRef(hashCode);
                }
                index = count;
                _count = count + 1;
                entries = _entries;
            }

            {
                ref Entry entry = ref entries![index];
                entry.HashCode = hashCode;
                entry.Next = bucket - 1; // バケツの値は 1 から始まるので、1 を引いて添字の形で保存する。
                entry.Value = value;
                bucket = index + 1;
                _version++;
                location = index;
            }
```

```csharp:line-numbers=1522 [原文]
            int index;
            if (_freeCount > 0)
            {
                index = _freeList;
                _freeCount--;
                Debug.Assert((StartOfFreeList - entries[_freeList].Next) >= -1, "shouldn't overflow because `next` cannot underflow");
                _freeList = StartOfFreeList - entries[_freeList].Next;
            }
            else
            {
                int count = _count;
                if (count == entries.Length)
                {
                    Resize();
                    bucket = ref GetBucketRef(hashCode);
                }
                index = count;
                _count = count + 1;
                entries = _entries;
            }

            {
                ref Entry entry = ref entries![index];
                entry.HashCode = hashCode;
                entry.Next = bucket - 1; // Value in _buckets is 1-based
                entry.Value = value;
                bucket = index + 1;
                _version++;
                location = index;
            }
```

:::

## 前提知識

- **エントリ（Entry）**: 要素の値、ハッシュ値、次のエントリの場所（`Next`）を持つ入れ物です。すべてのエントリは、1 つの配列に並んでいます。
- **バケツ（`_buckets`）**: ハッシュ値から選ばれる、鎖の先頭の位置を表す配列です。値は 1 から始まる番号です。
- **空きリスト（free list）**: 削除されて空いたエントリを、つないでおいたものです。新しい要素はここから再利用されます。
- **`_count`**: 配列の中で、これまでに使った枠の数です。
- **`_version`**: 変更の回数です。列挙の途中で変わったことを検出するために増やします。

## 何をしているか

### 1. 空き枠があれば、それを使う

```csharp:line-numbers=1523
            if (_freeCount > 0)
            {
                index = _freeList;
                _freeCount--;
                Debug.Assert((StartOfFreeList - entries[_freeList].Next) >= -1, "shouldn't overflow because `next` cannot underflow");
                _freeList = StartOfFreeList - entries[_freeList].Next;
            }
```

`_freeCount` が 0 より大きければ、空きリストの先頭の枠を使います。使った分だけ、空きの数を 1 減らし、空きリストの先頭を次の枠に進めます。

### 2. 空き枠がなければ、末尾に作る

```csharp:line-numbers=1530
            else
            {
                int count = _count;
                if (count == entries.Length)
                {
                    Resize();
                    bucket = ref GetBucketRef(hashCode);
                }
                index = count;
                _count = count + 1;
                entries = _entries;
            }
```

空き枠がなければ、末尾の位置 `index` を使います。配列がいっぱいなら、`Resize` で広げてから、バケツを取り直します。

### 3. 枠に値を入れ、鎖につなぐ

```csharp:line-numbers=1543
            {
                ref Entry entry = ref entries![index];
                entry.HashCode = hashCode;
                entry.Next = bucket - 1; // バケツの値は 1 から始まるので、1 を引いて添字の形で保存する。
                entry.Value = value;
                bucket = index + 1;
                _version++;
                location = index;
            }
```

新しい枠に、ハッシュ値と値を入れます。`Next` には、今のバケツの先頭（1 を引いた添字）を入れ、バケツの先頭を新しい枠に変えます。これで、新しい要素は同じバケツの鎖の先頭になります。最後に、変更の回数を増やし、枠の番号を `location` に返します。

## ここがすごい

- **空き枠を再利用する**: 削除の後に追加しても、配列を大きくせずに済みます。メモリの無駄が減ります。
- **先頭につなぐ**: 鎖の先頭に入れるので、バケツの場所を変える必要がなく、1 回の書き込みで済みます。
- **必要なときだけ広げる**: 配列がいっぱいになったときだけ、`Resize` で広げます。
- **位置を返す**: 追加した枠の番号を返すので、呼び出し側は、その要素の場所をすぐ使えます。

## まとめ

- 追加では、空きリストの枠を優先し、無ければ末尾の枠を使う。
- 新しい枠は、バケツの鎖の先頭につなぎ、すぐに検索できるようにする。
- 配列がいっぱいのときだけ広げ、変更の回数を記録する。
