---
title: "小さい値は線形探索、大きい値は二分探索で素数表を引く"
description: "ハッシュ表の容量を決める GetPrime。用意した素数表を、よく使う小さい範囲は単純なループで、大きい範囲は二分探索で引き、表を超えたら計算で素数を探す。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Collections/HashHelpers.cs
lines: [68, 106]
function: "HashHelpers.GetPrime"
difficulty: 2
format: 2
tags: [探索, ハッシュ, 最適化]
---

## ひとことで

`GetPrime(min)` は、**`min` 以上で最小の素数** を返す関数です。`Dictionary` や `HashSet` が内部配列の大きさを決めるときに使います。
`GetPrime(10)` は `11`、`GetPrime(100)` は `107`（表にある素数のうち 100 以上で最小のもの）を返します。

あらかじめ用意した素数の表（`Primes`）を引くのが基本ですが、**小さい値と大きい値で探し方を変えて** います。

## コード

::: code-group

```csharp:line-numbers=68 [日本語訳]
        public static int GetPrime(int min)
        {
            if (min < 0)
            {
                throw new ArgumentException(SR.Arg_HTCapacityOverflow);
            }

            if (min <= MinPrime)
            {
                return MinPrime;
            }

            // 小さい容量では、短い線形探索のほうが速い。
            const int LinearSearchCount = 16;

            ReadOnlySpan<int> primes = Primes;
            if (min <= primes[LinearSearchCount - 1])
            {
                for (int i = 1; i < LinearSearchCount; i++)
                {
                    if (primes[i] >= min)
                    {
                        return primes[i];
                    }
                }
            }
            else
            {
                int index = primes.Slice(LinearSearchCount).BinarySearch(min);
                index = index < 0 ? ~index : index;
                index += LinearSearchCount;
                if ((uint)index < (uint)primes.Length)
                {
                    return primes[index];
                }
            }

            return GetPrimeAtLeastCore(min);
        }
```

```csharp:line-numbers=68 [原文]
        public static int GetPrime(int min)
        {
            if (min < 0)
            {
                throw new ArgumentException(SR.Arg_HTCapacityOverflow);
            }

            if (min <= MinPrime)
            {
                return MinPrime;
            }

            // A short linear scan is faster for the common small capacities.
            const int LinearSearchCount = 16;

            ReadOnlySpan<int> primes = Primes;
            if (min <= primes[LinearSearchCount - 1])
            {
                for (int i = 1; i < LinearSearchCount; i++)
                {
                    if (primes[i] >= min)
                    {
                        return primes[i];
                    }
                }
            }
            else
            {
                int index = primes.Slice(LinearSearchCount).BinarySearch(min);
                index = index < 0 ? ~index : index;
                index += LinearSearchCount;
                if ((uint)index < (uint)primes.Length)
                {
                    return primes[index];
                }
            }

            return GetPrimeAtLeastCore(min);
        }
```

:::

## 前提知識

- **`throw new ArgumentException(...)`**: 例外（エラー）を投げて処理を中断します。`SR.Arg_HTCapacityOverflow` はエラーメッセージの文字列リソースです。
- **`ReadOnlySpan<int>`**: 読み取り専用の配列の「窓」です。`Slice(16)` は 16 番目から後ろの部分を、コピーせずに切り出します。
- **`BinarySearch`**: 並んでいる配列から二分探索で値を探します。見つからなかったときは、**「入るべき位置」をビット反転した負の数** を返します。
- **`~index`**: ビット反転です。`~(~x) == x` なので、BinarySearch が返した負の数から「入るべき位置」を取り戻せます。
- **`(uint)index < (uint)primes.Length`**: 符号なしにしてから比べると、`index` が負の場合も巨大な数になって false になります。「0 以上かつ長さ未満」を 1 回の比較で確かめる定番の書き方です。

## 何をしているか

### 1. 範囲外と小さい値

```csharp:line-numbers=70
            if (min < 0)
            {
                throw new ArgumentException(SR.Arg_HTCapacityOverflow);
            }

            if (min <= MinPrime)
            {
                return MinPrime;
            }
```

負の値はエラー、3 以下なら最小の素数 3 を返します。

### 2. 表の先頭 16 個の範囲なら線形探索

```csharp:line-numbers=81
            const int LinearSearchCount = 16;

            ReadOnlySpan<int> primes = Primes;
            if (min <= primes[LinearSearchCount - 1])
            {
                for (int i = 1; i < LinearSearchCount; i++)
                {
                    if (primes[i] >= min)
                    {
                        return primes[i];
                    }
                }
            }
```

`primes[15]` は `239` です。`min` が 239 以下なら、表の頭から順に見て最初に `min` 以上になった素数を返します。
`min = 10` なら `3, 7, 11` と見て `11` を返します（ループは `i = 1` から。`primes[0] = 3` は直前の if で処理済みだから）。

### 3. それより大きければ二分探索

```csharp:line-numbers=94
            else
            {
                int index = primes.Slice(LinearSearchCount).BinarySearch(min);
                index = index < 0 ? ~index : index;
                index += LinearSearchCount;
                if ((uint)index < (uint)primes.Length)
                {
                    return primes[index];
                }
            }
```

表の 16 番目以降を `Slice` で切り出して二分探索します。`min = 300` なら、ちょうど 300 はないので「293 と 353 の間」を示す負の数が返り、`~` で位置に戻すと 353 の位置になります。最後に切り出した分の 16 を足して元の表の添字に戻します。

### 4. 表を超えたら計算で探す

```csharp:line-numbers=105
            return GetPrimeAtLeastCore(min);
```

表の最大値 `7199369` より大きい `min` は、`GetPrimeAtLeastCore` で 1 つずつ素数判定して探します。

## ここがすごい

- **よく使う範囲を特別扱い**: コメントの通り、ハッシュ表の多くは小さいので、要素数 16 程度なら二分探索より単純なループのほうが速いという判断です。分岐予測が当たりやすく、メモリも連続して読めます。
- **BinarySearch の「見つからなかったら ~位置」**: .NET の伝統的な API の約束をうまく使い、ちょうど一致する場合と挿入位置の場合を 1 行で同じに扱っています。
- **表の作り方に意味がある**: コメントによれば、表の素数はおおむね前の値の 1.2 倍ずつ大きくなるように並んでいます。容量を倍にしたいときは、2 倍した値で GetPrime を呼べば、その近くの素数が見つかります。
- **表に頼りすぎない**: 表は 72 個で済ませ、それを超える巨大なサイズは計算で求めます。DLL のサイズとスピードのバランスをとっています。

## まとめ

- 小さい配列なら、二分探索より線形探索のほうが速いことがある。
- BinarySearch は「見つからないときは挿入位置の補数」を返す。`~` で元に戻せる。
- `(uint)i < (uint)length` で、負の数のチェックと上限チェックを 1 回にできる。
