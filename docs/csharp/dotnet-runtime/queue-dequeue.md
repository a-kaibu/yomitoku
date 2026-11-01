---
title: "循環する配列から先頭を取り出し、参照を外して GC に返す"
description: "Queue<T>.Dequeue。リングバッファの先頭の要素を読み、参照型なら配列の場所を既定値に戻してから、先頭の位置を 1 つ進める。取り出した要素のメモリを GC が回収できるようにする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [194, 213]
function: "Queue<T>.Dequeue"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, イディオム]
---

## ひとことで

`Dequeue` は、`Queue<T>`（先に入れた要素から先に取り出すキュー）の **先頭の要素を取り出して返す** 関数です。
空のキューから取り出そうとすると、例外を投げます。

中身は循環する配列（リングバッファ）の先頭を読み、先頭の位置を 1 つ進めるだけの単純な処理です。ただし、参照型の場合には後片付けを行うところに工夫があります。

## コード

```csharp:line-numbers=194
        public T Dequeue()
        {
            int head = _head;
            T[] array = _array;

            if (_size == 0)
            {
                ThrowForEmptyQueue();
            }

            T removed = array[head];
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[head] = default!;
            }
            MoveNext(ref _head);
            _size--;
            _version++;
            return removed;
        }
```

## 前提知識

- **キュー（待ち行列）**: 先に入った要素から順に取り出す仕組みです。列に並ぶ人が、先に来た人から呼ばれるのと同じです。
- **リングバッファ**: 配列を輪のように使い、先頭（`_head`）と末尾（`_tail`）の位置を進めていく方式です。
- **`_size`**: キューに入っている要素の数です。
- **`_version`**: 変更されるたびに増える番号です。`foreach` の途中で変更が起きたことを検出するのに使います。
- **`ThrowForEmptyQueue()`**: 空のときに例外を投げる、専用の関数です。

## 何をしているか

### 1. 空かどうかを確かめる

```csharp:line-numbers=196
            int head = _head;
            T[] array = _array;

            if (_size == 0)
            {
                ThrowForEmptyQueue();
            }
```

先頭の位置と配列を、ローカル変数に入れておきます。要素数が 0 なら例外を投げます。

### 2. 先頭の要素を読み、参照型なら外す

```csharp:line-numbers=204
            T removed = array[head];
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[head] = default!;
            }
```

先頭の要素を `removed` に読み取ります。型が参照を含むなら、配列の先頭の場所を既定値（`null` など）に戻します。

### 3. 先頭を進めて、数を減らす

```csharp:line-numbers=209
            MoveNext(ref _head);
            _size--;
            _version++;
            return removed;
```

`MoveNext` で先頭の位置を 1 つ進め（配列の末尾なら 0 に戻る）、要素数を 1 減らし、バージョンを増やします。最後に取り出した要素を返します。

## ここがすごい

- **配列を詰め直さない**: 先頭を取り出すとき、残りの要素を前にずらす必要がありません。先頭の位置を進めるだけで済むので、取り出しは定数時間です。
- **取り出した場所を空にする**: 参照型の要素は、キューを離れた後も配列に残ると、ガベージコレクタがメモリを回収できません。既定値に戻して参照を切ることで、使わなくなったオブジェクトを解放できます。
- **型で処理を分ける**: `RuntimeHelpers.IsReferenceOrContainsReferences<T>()` は、型ごとに判定が決まります。`int` のようなキューでは、この後片付けは丸ごと消えます。
- **先頭の位置を先に保存**: 最初に `_head` を変数に入れておくと、途中で位置が変わっても、取り出す要素は正しいものになります。

## まとめ

- 循環する配列では、先頭を進めるだけで取り出せる。
- 参照を含む要素は、取り出した後に場所を空けると、メモリの解放が早まる。
- 型の性質（参照を含むか）によって、不要な処理を省ける。
