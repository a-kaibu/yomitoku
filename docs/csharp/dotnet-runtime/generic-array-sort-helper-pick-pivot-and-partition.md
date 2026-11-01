---
title: "添字を捨てて「参照」で歩く、型専用のクイックソート分割"
description: "IComparable を実装した型専用の分割処理。配列の添字ではなく ref 参照そのものを進めて範囲チェックを消し、null をピボットにした場合の特別な道も用意している。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/ArraySortHelper.cs
lines: [458, 505]
function: "GenericArraySortHelper<T>.PickPivotAndPartition"
difficulty: 3
tags: [ソート, 最適化, 低レイヤ]
---

## ひとことで

この関数は、クイックソートの「分割」（ピボットより小さい値を左、大きい値を右に集める処理）を、`int` や `string` など **自分で大小比較ができる型（`IComparable<T>`）専用** に書き直した高速版です。

比較関数を受け取る汎用版（同じファイルの 179 行目〜）と考え方は同じですが、配列の添字 `keys[i]` を使わず、**要素への参照（`ref`）を直接進めていく** ことで、範囲チェックを完全になくしています。

## コード

```csharp:line-numbers=458
        private static unsafe int PickPivotAndPartition(Span<T> keys)
        {
            Debug.Assert(keys.Length >= Array.IntrosortSizeThreshold);

            // Use median-of-three to select a pivot. Grab a reference to the 0th, Length-1th, and Length/2th elements, and sort them.
            ref T zeroRef = ref MemoryMarshal.GetReference(keys);
            ref T lastRef = ref Unsafe.Add(ref zeroRef, keys.Length - 1);
            ref T middleRef = ref Unsafe.Add(ref zeroRef, (keys.Length - 1) >> 1);
            SwapIfGreater(ref zeroRef, ref middleRef);
            SwapIfGreater(ref zeroRef, ref lastRef);
            SwapIfGreater(ref middleRef, ref lastRef);

            // Select the middle value as the pivot, and move it to be just before the last element.
            ref T nextToLastRef = ref Unsafe.Add(ref zeroRef, keys.Length - 2);
            T pivot = middleRef;
            Swap(ref middleRef, ref nextToLastRef);

            // Walk the left and right pointers, swapping elements as necessary, until they cross.
            ref T leftRef = ref zeroRef, rightRef = ref nextToLastRef;
            while (Unsafe.IsAddressLessThan(ref leftRef, ref rightRef))
            {
                if (pivot == null)
                {
                    while (Unsafe.IsAddressLessThan(ref leftRef, ref nextToLastRef) && (leftRef = ref Unsafe.Add(ref leftRef, 1)) == null) ;
                    while (Unsafe.IsAddressGreaterThan(ref rightRef, ref zeroRef) && (rightRef = ref Unsafe.Add(ref rightRef, -1)) != null) ;
                }
                else
                {
                    while (Unsafe.IsAddressLessThan(ref leftRef, ref nextToLastRef) && GreaterThan(ref pivot, ref leftRef = ref Unsafe.Add(ref leftRef, 1))) ;
                    while (Unsafe.IsAddressGreaterThan(ref rightRef, ref zeroRef) && LessThan(ref pivot, ref rightRef = ref Unsafe.Add(ref rightRef, -1))) ;
                }

                if (Unsafe.IsAddressGreaterThanOrEqualTo(ref leftRef, ref rightRef))
                {
                    break;
                }

                Swap(ref leftRef, ref rightRef);
            }

            // Put the pivot in the correct location.
            if (!Unsafe.AreSame(ref leftRef, ref nextToLastRef))
            {
                Swap(ref leftRef, ref nextToLastRef);
            }

            return (int)((nint)Unsafe.ByteOffset(ref zeroRef, ref leftRef) / sizeof(T));
        }
```

## 前提知識

- **`ref T`（参照）**: 変数や配列要素「そのもの」を指す参照です。C 言語のポインタに近いものですが、GC（ガベージコレクタ）が正しく追跡できる安全な形です。`ref T x = ref keys[0];` で x は keys[0] の別名になり、x に代入すると keys[0] が書き換わります。
- **`MemoryMarshal.GetReference(span)`**: Span の先頭要素への参照を取り出します。
- **`Unsafe.Add(ref r, n)`**: 参照 r から n 要素先の参照を作ります。範囲チェックはしません。
- **`Unsafe.IsAddressLessThan(ref a, ref b)`**: a が b より前のアドレスを指しているかを比べます。
- **`Unsafe.ByteOffset(ref a, ref b)`**: 2 つの参照の間のバイト数です。要素のサイズ `sizeof(T)` で割ると、要素何個分離れているか（＝添字）がわかります。`sizeof(T)` を使うので関数に `unsafe` が付いています。
- **`GreaterThan` / `LessThan`**: 同じクラスにある補助関数で、`int` や `double` などの基本型では直接 `<` や `>` を使い、それ以外の型では `CompareTo` を呼びます（562 行目以降のコメント）。
- **`ref leftRef = ref Unsafe.Add(ref leftRef, 1)`**: 「参照の付け替え」です。leftRef が指す先を 1 つ右にずらします（値のコピーではありません）。

## 何をしているか

### 1. 中央値を選んでピボットを避難（462〜473 行目）

先頭・末尾・中央の 3 つへの参照を作り、`SwapIfGreater` 3 回で並べ、中央の値をピボットにします。ピボットは末尾の 1 つ手前（`nextToLastRef`）に移します。ここまでは汎用版と同じです。

### 2. 参照を左右から進める（476〜496 行目）

`leftRef` は先頭から右へ、`rightRef` は末尾の 1 つ手前から左へ、**参照そのものを 1 要素ずつずらしながら** 進みます。486 行目では、

1. `leftRef` を 1 つ右にずらし、
2. ずらした先の値がピボットより小さい間は続ける

という 2 つのことを、条件式の中で同時に行っています。両方止まったら `Swap` で入れ替えます。

### 3. ピボットが null の場合（479〜483 行目）

参照型の配列では、`null` が「いちばん小さい値」として扱われます。`null` に対して `CompareTo` は呼べないので、ピボットが `null` のときは「`null` かどうか」だけで左右を分ける専用のループを使います。

### 4. 位置を添字に戻して返す（499〜504 行目）

ピボットを最終位置に入れ、先頭からのバイト数を要素サイズで割って添字に戻します。

## ここがすごい

- **範囲チェックをなくす**: `keys[i]` と書くと、JIT はアクセスのたびに「i が範囲内か」を確かめるコードを入れます（消せる場合もありますが、このような複雑なループでは難しい）。参照を直接動かせば、そのチェックは生まれません。安全性は、ループの条件（`IsAddressLessThan(ref leftRef, ref nextToLastRef)` など）で人間が保証しています。
- **型ごとに専用の比較**: `Comparison<T>` デリゲート経由の比較は、毎回関数を間接的に呼ぶコストがかかります。この版はジェネリクスの型が確定した時点で `<` などに直接置き換わるので、`int[]` の並べ替えでは比較がほぼ 1 命令になります。
- **安全なまま「ポインタ風」**: `ref` は C のポインタのように動かせますが、GC が参照先を追跡できるので、ガベージコレクションで配列が移動しても正しく動きます。`fixed` でメモリを固定する必要もありません。
- **null を特別扱い**: `null` を含む配列でも正しく並ぶよう、ピボットが `null` の場合だけ別のループを使い、通常のループには `null` の判定を入れていません。

## まとめ

- `ref` と `Unsafe.Add` を使うと、添字なしで配列を歩き、範囲チェックを消せる。
- 型が確定するジェネリクスでは、比較関数を呼ぶより直接比較したほうがずっと速い。
- 高速化のために安全装置を外すときは、ループの条件で安全性を保証する。
