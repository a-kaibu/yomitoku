---
title: "ハッシュ値から、バケツの場所を ref で指し示す"
description: ".NET の HashSet<T>.GetBucketRef。ハッシュ値を実際のバケツ（インデックスの表）の位置へ変換し、その場所への参照を返す。FastMod を使って割り算を避ける。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/HashSet.cs
lines: [273, 281]
function: "HashSet<T>.GetBucketRef(int)"
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, 最適化]
---

## ひとことで

`GetBucketRef(hashCode)` は、値のハッシュ値から **バケツ（入れ物の場所）** を選び、その場所への **参照** を返す関数です。
参照を返すので、呼び出し側は場所の値を読むだけでなく、書き換えることもできます。

ハッシュ集合（`HashSet`）が、要素をどの場所に入れるかを決める、中心の部品です。

## コード

```csharp:line-numbers=273
        private ref int GetBucketRef(int hashCode)
        {
            int[] buckets = _buckets!;
#if TARGET_64BIT
            return ref buckets[HashHelpers.FastMod((uint)hashCode, (uint)buckets.Length, _fastModMultiplier)];
#else
            return ref buckets[(uint)hashCode % (uint)buckets.Length];
#endif
        }
```

## 前提知識

- **ハッシュ値**: 値から計算した整数です。同じ値からは同じハッシュ値が出ます。
- **バケツ**: ハッシュ値をもとに選ぶ、入れ物の場所です。配列の添字で指します。
- **`ref` の戻り値**: 配列の要素そのものを指す参照を返す書き方です。コピーではないので、書き換えが元の場所に反映されます。
- **剰余（余り）**: `hashCode % 個数` で、ハッシュ値を個数の範囲に収めます。これにより、バケツの番号が 0 から個数 - 1 の間に入ります。
- **`#if TARGET_64BIT`**: 64 ビット環境と 32 ビット環境で、別の書き方をするためのコンパイル時の切り替えです。

## 何をしているか

### 1. バケツの配列を取り出す

```csharp:line-numbers=275
            int[] buckets = _buckets!;
```

`_buckets` は、バケツの番号を入れておく配列です。`!` は、ここでは null ではないことを約束する印です。

### 2. 64 ビット環境では FastMod を使う

```csharp:line-numbers=276
#if TARGET_64BIT
            return ref buckets[HashHelpers.FastMod((uint)hashCode, (uint)buckets.Length, _fastModMultiplier)];
```

64 ビット環境では、`HashHelpers.FastMod` を使って剰余を求めます。通常の `%` より速い計算を、掛け算と桁の操作で行います。その結果を添字にして、`buckets` の要素への参照を返します。

### 3. 32 ビット環境では普通の剰余を使う

```csharp:line-numbers=278
#else
            return ref buckets[(uint)hashCode % (uint)buckets.Length];
#endif
```

32 ビット環境では、通常の `%` で剰余を求めます。コンパイル時の切り替えにより、どちらか一方だけが使われます。

## ここがすごい

- **場所を 1 か所にまとめる**: バケツの場所を決める計算を、この関数だけに閉じ込めています。検索や追加の処理は、この関数を呼ぶだけで済みます。
- **参照を返す**: 値を読んでから書き戻す手間がなく、場所に直接書き込めます。
- **割り算を速くする**: FastMod により、64 ビットでの剰余計算を速くしています。
- **環境ごとに最適な書き方**: `#if` で、64 ビットと 32 ビットの計算を切り替えています。同じ動きを、速さだけ変えて実現しています。

## まとめ

- `GetBucketRef` は、ハッシュ値からバケツの場所を求め、その参照を返す。
- 64 ビットでは `FastMod`、32 ビットでは `%` を使い、剰余を求める。
- 参照を返すので、呼び出し側は場所の値を直接読み書きできる。
