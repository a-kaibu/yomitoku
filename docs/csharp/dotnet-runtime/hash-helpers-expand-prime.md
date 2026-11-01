---
title: "2 倍にしたらあふれる？を uint キャスト 1 つで見抜く"
description: "ハッシュ表を広げるときの新しい容量を決める ExpandPrime。2 倍した値が int をあふれて負になっても、uint に変えて比べることで最大サイズにうまく丸める。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Collections/HashHelpers.cs
lines: [150, 164]
function: "HashHelpers.ExpandPrime"
difficulty: 1
format: 2
tags: [防御的プログラミング, ハッシュ, イディオム]
---

## ひとことで

`ExpandPrime(oldSize)` は、ハッシュ表がいっぱいになったときに **次の容量** を決める関数です。
基本は「今の容量の 2 倍以上で最小の素数」ですが、容量が巨大になって 2 倍すると `int` の範囲を超えてしまう場合を、短い条件式でうまく処理しています。

## コード

::: code-group

```csharp:line-numbers=150 [日本語訳]
        // 拡張先のハッシュテーブルのサイズを返す。
        public static int ExpandPrime(int oldSize)
        {
            int newSize = 2 * oldSize;

            // ハッシュテーブルは容量オーバーになるまで（約 20 億要素まで）大きくできるようにする。
            // (uint) キャストのおかげで、_items.Length がオーバーフローしていてもこのチェックは正しく働く。
            if ((uint)newSize > MaxPrimeArrayLength && MaxPrimeArrayLength > oldSize)
            {
                Debug.Assert(MaxPrimeArrayLength == GetPrime(MaxPrimeArrayLength), "Invalid MaxPrimeArrayLength");
                return MaxPrimeArrayLength;
            }

            return GetPrime(newSize);
        }
```

```csharp:line-numbers=150 [原文]
        // Returns the size of the hashtable to grow to.
        public static int ExpandPrime(int oldSize)
        {
            int newSize = 2 * oldSize;

            // Allow the hashtables to grow to maximum possible size (~2G elements) before encountering capacity overflow.
            // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
            if ((uint)newSize > MaxPrimeArrayLength && MaxPrimeArrayLength > oldSize)
            {
                Debug.Assert(MaxPrimeArrayLength == GetPrime(MaxPrimeArrayLength), "Invalid MaxPrimeArrayLength");
                return MaxPrimeArrayLength;
            }

            return GetPrime(newSize);
        }
```

:::

`MaxPrimeArrayLength` は同じファイルで定義されている定数 `0x7FFFFFC3`（= 2147483587）で、.NET の配列の最大長より小さい最大の素数です。

## 前提知識

- **`int` のオーバーフロー**: `int` は約 −21 億〜+21 億の範囲の整数です。C# では既定で、範囲を超えた計算は **エラーにならず、ぐるっと回って負の数になります**。たとえば 15 億 × 2 は約 −12.9 億になります。
- **`(uint)newSize`**: `int` を符号なしの `uint` として読み直します。ビットの並びはそのままなので、負の数は 21 億より大きい正の数として扱われます。
- **`&&`**: 「かつ」です。
- **`GetPrime(n)`**: 同じファイルにある、n 以上で最小の（表または計算で見つけた）素数を返す関数です。
- **`Debug.Assert`**: デバッグビルドでだけ動く確認です。

## 何をしているか

### 1. とりあえず 2 倍する

```csharp:line-numbers=153
            int newSize = 2 * oldSize;
```

`oldSize = 1000` なら `newSize = 2000`、その後 `GetPrime(2000)` で `2333` が返ります（表の中で 2000 以上の最小の素数）。

### 2. 大きすぎたら最大値に丸める

```csharp:line-numbers=157
            if ((uint)newSize > MaxPrimeArrayLength && MaxPrimeArrayLength > oldSize)
            {
                Debug.Assert(MaxPrimeArrayLength == GetPrime(MaxPrimeArrayLength), "Invalid MaxPrimeArrayLength");
                return MaxPrimeArrayLength;
            }
```

`oldSize = 1_500_000_000` のとき、2 倍は 30 億で `int` をあふれ、`newSize` は約 −12.9 億という **負の数** になります。

もし `newSize > MaxPrimeArrayLength` と `int` のまま比べると、負の数は小さいので「超えていない」と判定されてしまいます。
ここで `(uint)newSize` にすると、約 −12.9 億は約 30 億という正の数に戻り、正しく「最大値を超えた」と判定できます。コメントが、まさにこのことを説明しています。

条件の後半 `MaxPrimeArrayLength > oldSize` は、「すでに最大サイズなら、それ以上は広げない」という意味です。最大サイズのまま呼ばれた場合は `GetPrime` に進み、最終的に容量オーバーのエラーになります。

## ここがすごい

- **あふれを「検出」ではなく「解釈し直す」**: 2 倍の結果はいったんあふれますが、`uint` として見れば正しい値（30 億など）になっています。`int` の 2 倍は `uint` の範囲には必ず収まるので、キャスト 1 つで安全に比べられます。`checked` や `long` を使う方法よりも軽い書き方です。
- **限界まで使い切る**: 2 倍できないからといってエラーにせず、使える最大の素数サイズまでは広げます。コメントの通り、約 20 億要素まで使えるようにするための配慮です。
- **定数の正しさを Assert で確認**: `MaxPrimeArrayLength` が本当に素数として扱われるか（GetPrime が同じ値を返すか）を、デバッグ時に確かめています。

## まとめ

- `int` の足し算や掛け算は、黙ってあふれて負の数になることがある。
- 2 倍程度のあふれなら、`uint` に読み直すだけで正しい大きさとして比較できる。
- 上限に近づいたら、エラーにする前に「使える最大値」に丸める選択肢もある。
