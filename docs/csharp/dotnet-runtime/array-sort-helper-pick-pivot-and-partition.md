---
title: "3 つの値の真ん中をピボットにして番兵まで作る分割処理"
description: "クイックソートの分割を担う PickPivotAndPartition。先頭・中央・末尾の 3 つを並べてから中央値をピボットにし、両端を番兵にして内側のループから範囲チェックを消す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/ArraySortHelper.cs
lines: [179, 215]
function: "ArraySortHelper<T>.PickPivotAndPartition"
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`PickPivotAndPartition` は、クイックソートの「分割」を行う関数です。基準になる値（ピボット）を選び、**それより小さい値を左に、大きい値を右に** 集め、最後にピボットの位置を返します。

ピボットには、先頭・中央・末尾の 3 つの値の **真ん中（中央値）** を使います。しかもその 3 つを並べ替える作業が、そのまま分割の一部と「番兵」の役割を兼ねているのが見どころです。

## コード

::: code-group

```csharp:line-numbers=179 [日本語訳]
        private static int PickPivotAndPartition(Span<T> keys, Comparison<T> comparer)
        {
            Debug.Assert(keys.Length >= Array.IntrosortSizeThreshold);
            Debug.Assert(comparer != null);

            int hi = keys.Length - 1;

            // 中央値の 3 つを選ぶ。比較のついでに分割もしておく。
            int middle = hi >> 1;

            // 下端・中央・上端を並べ替え、中央をピボットとして選ぶ。
            SwapIfGreater(keys, comparer, 0, middle); // 下端と中央の点を入れ替える
            SwapIfGreater(keys, comparer, 0, hi); // 下端と上端を入れ替える
            SwapIfGreater(keys, comparer, middle, hi); // 中央と上端を入れ替える

            T pivot = keys[middle];
            Swap(keys, middle, hi - 1);
            int left = 0, right = hi - 1; // 下端と上端はすでに分割済みで、ピボットは hi - 1 に置いた。以下では前置の ++ と -- を使う。

            while (left < right)
            {
                while (comparer(keys[++left], pivot) < 0) ;
                while (comparer(pivot, keys[--right]) < 0) ;

                if (left >= right)
                    break;

                Swap(keys, left, right);
            }

            // ピボットを正しい位置に置く。
            if (left != hi - 1)
            {
                Swap(keys, left, hi - 1);
            }
            return left;
        }
```

```csharp:line-numbers=179 [原文]
        private static int PickPivotAndPartition(Span<T> keys, Comparison<T> comparer)
        {
            Debug.Assert(keys.Length >= Array.IntrosortSizeThreshold);
            Debug.Assert(comparer != null);

            int hi = keys.Length - 1;

            // Compute median-of-three.  But also partition them, since we've done the comparison.
            int middle = hi >> 1;

            // Sort lo, mid and hi appropriately, then pick mid as the pivot.
            SwapIfGreater(keys, comparer, 0, middle);  // swap the low with the mid point
            SwapIfGreater(keys, comparer, 0, hi);   // swap the low with the high
            SwapIfGreater(keys, comparer, middle, hi); // swap the middle with the high

            T pivot = keys[middle];
            Swap(keys, middle, hi - 1);
            int left = 0, right = hi - 1;  // We already partitioned lo and hi and put the pivot in hi - 1.  And we pre-increment & decrement below.

            while (left < right)
            {
                while (comparer(keys[++left], pivot) < 0) ;
                while (comparer(pivot, keys[--right]) < 0) ;

                if (left >= right)
                    break;

                Swap(keys, left, right);
            }

            // Put pivot in the right location.
            if (left != hi - 1)
            {
                Swap(keys, left, hi - 1);
            }
            return left;
        }
```

:::

## 前提知識

- **`Span<T> keys`**: 並べ替える範囲を指す「窓」です。`keys[i]` で読み書きできます。
- **`comparer(a, b)`**: a < b なら負、a > b なら正を返す比較関数です。
- **`SwapIfGreater(keys, comparer, i, j)`**: 同じファイルにある関数で、`keys[i] > keys[j]` なら 2 つを入れ替えます。
- **`hi >> 1`**: 右に 1 ビットずらす、つまり 2 で割る（切り捨て）計算です。
- **`++left` / `--right`**: 前置のインクリメント／デクリメントです。**先に 1 増やして（減らして）から**、その値を使います。
- **`while (条件) ;`**: 中身が空のループです。条件の中で `++left` が実行されるので、条件が偽になるまで `left` が進み続けます。

## 何をしているか

`keys = [5, 9, 1, 7, 3, 8, 2, 6, 4]` 程度の短い例で流れを追います（実際には 16 要素以上のときだけ呼ばれます）。

### 1. 3 つの値を並べて中央値を選ぶ

```csharp:line-numbers=187
            int middle = hi >> 1;

            // 下端・中央・上端を並べ替え、中央をピボットとして選ぶ。
            SwapIfGreater(keys, comparer, 0, middle); // 下端と中央の点を入れ替える
            SwapIfGreater(keys, comparer, 0, hi); // 下端と上端を入れ替える
            SwapIfGreater(keys, comparer, middle, hi); // 中央と上端を入れ替える

            T pivot = keys[middle];
```

先頭 `keys[0]`、中央 `keys[middle]`、末尾 `keys[hi]` の 3 つを `SwapIfGreater` 3 回で小さい順に並べます。例では 5, 3, 4 → 3, 4, 5 となり、中央の 4 がピボットになります。

### 2. ピボットを末尾の 1 つ手前に避難

```csharp:line-numbers=195
            Swap(keys, middle, hi - 1);
            int left = 0, right = hi - 1; // 下端と上端はすでに分割済みで、ピボットは hi - 1 に置いた。以下では前置の ++ と -- を使う。
```

ピボットを `hi - 1` に移します。この時点で、

- `keys[0]` はピボット **以下**
- `keys[hi]` はピボット **以上**

であることが 1. の並べ替えで保証されています。

### 3. 左右から挟み込む

```csharp:line-numbers=198
            while (left < right)
            {
                while (comparer(keys[++left], pivot) < 0) ;
                while (comparer(pivot, keys[--right]) < 0) ;

                if (left >= right)
                    break;

                Swap(keys, left, right);
            }
```

`left` は左から「ピボット以上の値」を探し、`right` は右から「ピボット以下の値」を探します。両方見つかったら入れ替え、`left` と `right` が交差したら終わりです。

ここで、`while` は **配列の端に届いたかどうかを調べていません**。右に進む `left` は、遅くとも `hi - 1` にあるピボット自身で止まり、左に進む `right` は `keys[0]`（ピボット以下）で必ず止まるからです。1. で並べた両端の値が **番兵**（ループを止める見張り役）になっています。

### 4. ピボットを正しい位置へ

```csharp:line-numbers=210
            if (left != hi - 1)
            {
                Swap(keys, left, hi - 1);
            }
            return left;
```

最後に `left` の位置とピボットを入れ替えると、ピボットより左は全部ピボット以下、右は全部ピボット以上になります。その位置を返します。

## ここがすごい

- **中央値ピボットで最悪ケースを避ける**: 先頭だけをピボットにすると、すでに並んでいる配列で毎回最小値を選んでしまい、とても遅くなります。3 つの中央値なら、整列済みの配列でもちょうど真ん中の値が選ばれます。
- **比較の結果を無駄にしない**: コメントの通り、中央値を選ぶための比較で両端も並べ替えておくので、その 2 つはもう分割済みです。だからループは `0` と `hi - 1` の間だけを見ればよいのです。
- **番兵で範囲チェックを消す**: 内側のループは、比較 1 回とインクリメントだけのとても小さなループです。ここが並べ替え全体でいちばん多く実行される場所なので、範囲チェックを 1 つ減らす効果は大きくなります。
- **ピボットと同じ値でも止まる**: `< 0`（真に小さい）でだけ進むので、ピボットと等しい値でも止まって入れ替えます。同じ値がたくさんある配列でも、分割が片寄らずにほぼ半分になります。

## まとめ

- 先頭・中央・末尾の中央値をピボットにすると、整列済みの入力でも分割が偏りにくい。
- 両端に「必ず止まる値」を置くと、ループから範囲チェックを省ける（番兵）。
- いちばん内側のループほど、1 命令の節約が全体の速さに効く。
