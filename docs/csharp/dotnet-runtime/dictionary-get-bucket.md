---
title: "割り算の余りを掛け算で求めて、バケットを選ぶ"
description: "Dictionary<TKey, TValue>.GetBucket は、ハッシュ値をバケット数で割った余りを、事前に計算した乗数との掛け算（FastMod）で求める。64 ビット環境でのみ割り算を避ける。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Dictionary.cs
lines: [1860, 1869]
function: "Dictionary<TKey, TValue>.GetBucket"
difficulty: 2
format: 2
tags: [ハッシュ, 最適化, データ構造]
---

## ひとことで

`GetBucket(hashCode)` は、キーのハッシュ値から **どのバケット（配列の箱）に入れるか** を決める関数です。
ハッシュ値をバケットの数で割った **余り** が、その番号になります。

ハッシュ表は検索や追加のたびにこの計算を行うので、割り算の速さが全体の速さに直結します。この関数は、その割り算を掛け算に置き換えています。

## コード

```csharp:line-numbers=1860
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private ref int GetBucket(uint hashCode)
        {
            int[] buckets = _buckets!;
#if TARGET_64BIT
            return ref buckets[HashHelpers.FastMod(hashCode, (uint)buckets.Length, _fastModMultiplier)];
#else
            return ref buckets[(uint)hashCode % buckets.Length];
#endif
        }
```

`_fastModMultiplier` は、バケット数が決まったときに 1 回だけ計算しておく値です。`Initialize` と `Resize` の中で `HashHelpers.GetFastModMultiplier` によって作られます。

## 前提知識

- **バケット**: ハッシュ表の中の「箱」です。同じ番号の箱に、ハッシュ値が同じキーが入ります。
- **余り**: `hash % buckets.Length` で求まる番号です。割る数が必ず配列の長さになるので、結果は配列の範囲内に収まります。
- **`ref int`**: 配列の要素そのものへの参照を返しています。呼び出し側は、この参照に代入するだけでバケットを書き換えられます。
- **`_buckets!`**: 「null ではない」と宣言する演算子です。
- **`#if TARGET_64BIT`**: 64 ビット向けのビルドでだけ有効になるコードです。

## 何をしているか

### 1. 64 ビット環境では FastMod を使う

```csharp:line-numbers=1863
            int[] buckets = _buckets!;
#if TARGET_64BIT
            return ref buckets[HashHelpers.FastMod(hashCode, (uint)buckets.Length, _fastModMultiplier)];
```

`HashHelpers.FastMod` は、乗数 `_fastModMultiplier` を使って `hashCode % buckets.Length` と同じ値を、割り算なしで求めます。

### 2. 32 ビット環境では普通の余り

```csharp:line-numbers=1866
#else
            return ref buckets[(uint)hashCode % buckets.Length];
```

64 ビットの掛け算が重い 32 ビット環境では、普通の `%` を使います。

### 3. 参照を返す

```csharp:line-numbers=1868
#endif
```

`ref` で返すので、呼び出し側はバケットの値を読むことも、書き換えることもできます。新しく値を作ってからコピーする必要がありません。

## ここがすごい

- **割り算を事前の計算に移す**: バケット数は、リサイズのときにしか変わりません。乗数はそのときに 1 回だけ計算し、以降の検索では掛け算と右シフトだけで余りを求めます。
- **プラットフォームで使い分ける**: 64 ビット環境では掛け算が速いので `FastMod` を使い、32 ビット環境では `%` のほうが単純で速い、という判断をコンパイル時に行っています。
- **`ref` で書き換えを 1 回に**: バケットを調べて値を変えるときも、番号の計算を 1 回だけで済ませられます。
- **AggressiveInlining**: 検索や追加の中から頻繁に呼ばれるため、展開されて関数呼び出しのコストが消えます。

## まとめ

- 余りを求める割り算は、除数が決まっているなら、事前に計算した値との掛け算で置き換えられる。
- プラットフォームによって速い方法が違うので、コンパイル時に分岐させると無駄がない。
- 配列の要素を `ref` で返すと、読み書きを 1 回の番号計算で済ませられる。
