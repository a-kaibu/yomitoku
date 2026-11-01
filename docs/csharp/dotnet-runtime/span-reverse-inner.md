---
title: "配列の両端から 1 組ずつ入れ替えて、真ん中で止める"
description: ".NET の SpanHelpers.ReverseInner。先頭と末尾の位置を参照で指し、値を交換しながら中心へ近づける。要素が参照型でも使える、一般的な反転の処理。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/SpanHelpers.cs
lines: [330, 345]
function: "SpanHelpers.ReverseInner<T>(ref T, nuint)"
difficulty: 3
format: 2
tags: [アルゴリズム, 低レイヤ, 最適化]
---

## ひとことで

`ReverseInner` は、並びの **順序を逆にする** 処理です。
たとえば `[1, 2, 3, 4, 5]` は `[5, 4, 3, 2, 1]` になります。先頭と末尾の要素を入れ替え、その内側の組を入れ替え、というふうに中心へ向かって進みます。

`Array.Reverse` や `Span.Reverse` の内部で使われている、基本の反転の方法です。

## コード

```csharp:line-numbers=330
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static void ReverseInner<T>(ref T elements, nuint length)
        {
            Debug.Assert(length > 1);

            ref T first = ref elements;
            ref T last = ref Unsafe.Subtract(ref Unsafe.Add(ref first, length), 1);
            do
            {
                T temp = first;
                first = last;
                last = temp;
                first = ref Unsafe.Add(ref first, 1);
                last = ref Unsafe.Subtract(ref last, 1);
            } while (Unsafe.IsAddressLessThan(ref first, ref last));
        }
```

## 前提知識

- **参照（`ref`）**: 配列の要素そのものを指す、一種の住所です。`ref` の値を書き換えると、元の配列が変わります。
- **`Unsafe.Add` と `Unsafe.Subtract`**: 参照の位置を、要素いくつ分だけ進めたり戻したりする命令です。配列の添字を使わずに、位置を動かします。
- **`nuint`**: メモリの大きさや位置を表すための、アドレスの幅の符号なし整数です。
- **交換（スワップ）**: 2 つの値を一時的な変数を使って入れ替えることです。
- **`Unsafe.IsAddressLessThan`**: 2 つの参照のアドレスを比べる命令です。添字の比較より、比べる対象を直接指定できます。

## 何をしているか

### 1. 先頭と末尾を指す

```csharp:line-numbers=335
            ref T first = ref elements;
            ref T last = ref Unsafe.Subtract(ref Unsafe.Add(ref first, length), 1);
```

`first` は先頭、`last` は末尾の要素を指す参照です。末尾は `elements + length - 1` の位置です。

### 2. 両端の値を入れ替える

```csharp:line-numbers=337
            do
            {
                T temp = first;
                first = last;
                last = temp;
```

`temp` を使って、`first` と `last` の値を入れ替えます。

### 3. 内側へ進む

```csharp:line-numbers=342
                first = ref Unsafe.Add(ref first, 1);
                last = ref Unsafe.Subtract(ref last, 1);
```

`first` を 1 つ後ろへ、`last` を 1 つ前へ動かします。これで、次の内側の組に進みます。

### 4. 真ん中で止める

```csharp:line-numbers=344
            } while (Unsafe.IsAddressLessThan(ref first, ref last));
```

`first` が `last` より前にある間だけ、繰り返します。両者が同じ位置か交差したら、反転は終わりです。

### 具体例で確かめる

`[1, 2, 3, 4, 5]` を反転させます。

```
組 1: first=1, last=5 → 入れ替え → [5, 2, 3, 4, 1]
組 2: first=2, last=4 → 入れ替え → [5, 4, 3, 2, 1]
中心（3 番目の要素）で first と last が重なったので、ここで終わり
```

## ここがすごい

- **半分だけ動く**: 組ごとに 2 要素を入れ替えるので、回数は要素数の約半分です。
- **型に依存しない**: `T` が何であれ、値の大きさや型を知らずに入れ替えられます。参照型の要素でも扱えます。
- **添字の境界検査を省く**: 参照の位置を直接動かすので、添字ごとの範囲の確認が要りません。長さは最初に確かめておきます。
- **大きさに応じた速い版**: 型が 1, 2, 4, 8 バイトなら、まとめて入れ替える専用の版が使われます。この関数は、それ以外の型のための基本の版です。

## まとめ

- `ReverseInner` は、先頭と末尾の値を交換し、内側へ進みながら反転させる。
- 参照を動かすので、添字の範囲検査を毎回しなくてよい。
- 要素の大きさに合わせた専用の版があり、この版は一般的な型のための基本の処理である。
