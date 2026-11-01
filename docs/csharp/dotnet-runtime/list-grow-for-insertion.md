---
title: "配列を広げるついでに「挿入のための隙間」も空けておく"
description: "List<T>.GrowForInsertion は、途中への挿入で配列が足りないとき、新しい配列へのコピーを 2 つに分けて隙間を空けておく。広げてから要素をずらすより、コピーが 1 回少ない。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs
lines: [456, 485]
function: "List<T>.GrowForInsertion"
difficulty: 2
format: 2
tags: [最適化, データ構造, メモリ管理]
---

## ひとことで

`List<T>.Insert` などで、リストの **途中に** 要素を入れたいのに配列がいっぱいのとき、この `GrowForInsertion` が呼ばれます。
新しい大きな配列を作り、そこへ古い要素を写すときに、**挿入する場所にあらかじめ隙間を空けて** 写します。

## コード

::: code-group

```csharp:line-numbers=456 [日本語訳]
        /// <summary>
        /// このリストに、少なくとも insertionCount 個の要素を追加できるようにする。
        /// 挿入後の位置へデータをコピーする。
        /// 挿入専用のメソッドで、配列のコピーを 1 回減らせる。
        /// Count + insertionCount > Capacity のときだけ呼ぶこと。
        /// </summary>
        /// <param name="indexToInsert">最初の挿入位置。</param>
        /// <param name="insertionCount">挿入する要素数。</param>
        internal void GrowForInsertion(int indexToInsert, int insertionCount = 1)
        {
            Debug.Assert(insertionCount > 0);

            int requiredCapacity = checked(_size + insertionCount);
            int newCapacity = GetNewCapacity(requiredCapacity);

            // set_Capacity のロジックをここにインライン化して調整する

            T[] newItems = new T[newCapacity];
            if (indexToInsert != 0)
            {
                Array.Copy(_items, newItems, length: indexToInsert);
            }

            if (_size != indexToInsert)
            {
                Array.Copy(_items, indexToInsert, newItems, indexToInsert + insertionCount, _size - indexToInsert);
            }

            _items = newItems;
        }
```

```csharp:line-numbers=456 [原文]
        /// <summary>
        /// Enlarge this list so it may contain at least <paramref name="insertionCount"/> more elements
        /// And copy data to their after-insertion positions.
        /// This method is specifically for insertion, as it avoids 1 extra array copy.
        /// You should only call this method when Count + insertionCount > Capacity.
        /// </summary>
        /// <param name="indexToInsert">Index of the first insertion.</param>
        /// <param name="insertionCount">How many elements will be inserted.</param>
        internal void GrowForInsertion(int indexToInsert, int insertionCount = 1)
        {
            Debug.Assert(insertionCount > 0);

            int requiredCapacity = checked(_size + insertionCount);
            int newCapacity = GetNewCapacity(requiredCapacity);

            // Inline and adapt logic from set_Capacity

            T[] newItems = new T[newCapacity];
            if (indexToInsert != 0)
            {
                Array.Copy(_items, newItems, length: indexToInsert);
            }

            if (_size != indexToInsert)
            {
                Array.Copy(_items, indexToInsert, newItems, indexToInsert + insertionCount, _size - indexToInsert);
            }

            _items = newItems;
        }
```

:::

`GetNewCapacity` は 関数で、基本的には今の容量の 2 倍（空なら既定の 4）を新しい容量として返します。

## 前提知識

- **`List<T>` の中身**: 実際のデータは配列 `_items` にあり、`_size` 個が使われています。途中に挿入するには、挿入位置より後ろの要素を 1 つずつ後ろへずらす必要があります。
- **`Array.Copy(src, srcIndex, dst, dstIndex, length)`**: 配列 src の srcIndex から length 個を、配列 dst の dstIndex 以降に写します。`Array.Copy(src, dst, length: n)` は先頭から n 個です。`length:` は「名前付き引数」で、どの引数かを名前で示しています。
- **`checked(...)`**: かっこの中の計算でオーバーフロー（int の範囲超え）が起きたら、黙って負の数になる代わりに例外を投げます。
- **省略可能な引数 `int insertionCount = 1`**: 呼び出し側が省略すると 1 になります。

## 何をしているか

`[A, B, C, D]`（容量 4、満杯）の 1 番目（B の位置）に X を 1 つ挿入する場合を考えます。

### 1. 新しい容量を決めて配列を作る

```csharp:line-numbers=468
            int requiredCapacity = checked(_size + insertionCount);
            int newCapacity = GetNewCapacity(requiredCapacity);

            // set_Capacity のロジックをここにインライン化して調整する

            T[] newItems = new T[newCapacity];
```

必要な容量は `4 + 1 = 5`、`GetNewCapacity` は 2 倍の 8 を返します。長さ 8 の新しい配列を作ります。

### 2. 挿入位置より前を写す

```csharp:line-numbers=474
            if (indexToInsert != 0)
            {
                Array.Copy(_items, newItems, length: indexToInsert);
            }
```

先頭から 1 個（A）を、新しい配列の先頭に写します。

```
新: [A, _, _, _, _, _, _, _]
```

### 3. 挿入位置より後ろを、隙間の分ずらして写す

```csharp:line-numbers=479
            if (_size != indexToInsert)
            {
                Array.Copy(_items, indexToInsert, newItems, indexToInsert + insertionCount, _size - indexToInsert);
            }
```

もとの 1 番目から 3 個（B, C, D）を、新しい配列の `1 + 1 = 2` 番目から写します。

```
新: [A, _, B, C, D, _, _, _]
```

1 番目に隙間ができました。呼び出し元（`Insert`）は、ここに X を書き込むだけです。

## ここがすごい

- **コピーを 1 回減らす**: ふつうに書くと「配列を広げる（全要素をコピー）」→「挿入位置より後ろを 1 つずらす（もう一度コピー）」となり、後ろの要素は 2 回動きます。この関数は新しい配列に写すときに最初から正しい位置に置くので、どの要素も 1 回しか動きません（コメント）。
- **一般的な `Grow` との使い分け**: 末尾への追加では隙間がいらないので普通の `Grow` を、途中への挿入ではこの関数を使います。同じ「広げる」でも目的に合わせて専用の版を用意しています。
- **無駄な呼び出しを省く**: 先頭への挿入（`indexToInsert == 0`）なら前半のコピーを、末尾への挿入なら後半のコピーを、if で飛ばしています。
- **オーバーフローを checked で検出**: 要素数 + 挿入数が int を超えると、黙って負の容量になる危険があります。`checked` で例外にして、壊れた状態を防いでいます。

## まとめ

- 配列を作り直すときは、次の操作のことも考えてコピーの仕方を決めると無駄が減る。
- 同じ「広げる」処理でも、用途ごとに専用の版を用意すると効率がよい。
- サイズの計算は `checked` であふれを検出できる。
