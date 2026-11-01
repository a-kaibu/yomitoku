---
title: "素数判定は「6 の倍数 ± 1」だけを調べればいい"
description: "ハッシュ表の容量が素数かを判定する IsPrime。2 と 3 で割れるかを最初に除き、あとは 6k-1 と 6k+1 の形の数だけで割ってみることで試す回数を 3 分の 1 にする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Collections/HashHelpers.cs
lines: [41, 66]
function: "HashHelpers.IsPrime"
difficulty: 1
format: 2
tags: [アルゴリズム, 数値計算, ハッシュ]
---

## ひとことで

`IsPrime` は、整数が **素数**（1 と自分自身でしか割り切れない数）かどうかを調べる関数です。
.NET の `Hashtable` や `Dictionary` は、内部の配列の大きさを素数にすることでハッシュ値の偏りの影響を減らしています。そのために素数判定が必要になります。

書き方は「`√n` まで順に割ってみる」という基本どおりですが、**割ってみる数を 3 分の 1 に減らす** 工夫が入っています。

## コード

::: code-group

```csharp:line-numbers=41 [日本語訳]
        public static bool IsPrime(int candidate)
        {
            // ハッシュテーブルの容量だけを判定するので最小は MinPrime。2 は意図的に除外している。
            Debug.Assert(candidate >= MinPrime);

            if ((candidate & 1) == 0 || (uint)candidate % MinPrime == 0)
            {
                return candidate == MinPrime;
            }

            return HasNoPrimeDivisors(candidate, (int)Math.Sqrt(candidate));
        }

        private static bool HasNoPrimeDivisors(int candidate, int limit)
        {
            // 3 より大きい素数は 6k - 1 か 6k + 1 なので、各組の両方を調べる。
            for (int divisor = 5; divisor <= limit; divisor += 6)
            {
                if (candidate % divisor == 0 || candidate % (divisor + 2) == 0)
                {
                    return false;
                }
            }

            return true;
        }
```

```csharp:line-numbers=41 [原文]
        public static bool IsPrime(int candidate)
        {
            // This only tests hash table capacities, whose minimum is MinPrime, so 2 is intentionally excluded.
            Debug.Assert(candidate >= MinPrime);

            if ((candidate & 1) == 0 || (uint)candidate % MinPrime == 0)
            {
                return candidate == MinPrime;
            }

            return HasNoPrimeDivisors(candidate, (int)Math.Sqrt(candidate));
        }

        private static bool HasNoPrimeDivisors(int candidate, int limit)
        {
            // Every prime greater than 3 is 6k - 1 or 6k + 1, so test both candidates in each group.
            for (int divisor = 5; divisor <= limit; divisor += 6)
            {
                if (candidate % divisor == 0 || candidate % (divisor + 2) == 0)
                {
                    return false;
                }
            }

            return true;
        }
```

:::

## 前提知識

- **`(candidate & 1) == 0`**: `&` はビットごとの AND です。2 進数の一番下の桁が 0 なら偶数なので、これは「偶数か？」の判定です。`% 2 == 0` と同じ意味ですが、より軽い計算です。
- **`(uint)candidate % MinPrime`**: `uint` に変換してから割り算しています。符号なしの割り算は、負の数を考えなくてよい分だけ CPU にとって少し単純になります。
- **`Math.Sqrt`**: 平方根です。結果は小数（`double`）なので `(int)` で整数に切り捨てています。
- **`for (int divisor = 5; divisor <= limit; divisor += 6)`**: C 系の言語の for 文で、「5 から始めて、limit 以下の間、6 ずつ増やして繰り返す」という意味です。
- **`||`**: 「または」。左側が真なら右側は計算しません（短絡評価）。

## 何をしているか

### 1. 2 と 3 の倍数を先に除く

```csharp:line-numbers=46
            if ((candidate & 1) == 0 || (uint)candidate % MinPrime == 0)
            {
                return candidate == MinPrime;
            }
```

偶数か 3 の倍数なら、素数なのは 3 そのもののときだけです（2 は コメントの通り、ハッシュ表の容量としては使わないので対象外）。

### 2. √n までを 6 個ずつ調べる

```csharp:line-numbers=51
            return HasNoPrimeDivisors(candidate, (int)Math.Sqrt(candidate));
        }

        private static bool HasNoPrimeDivisors(int candidate, int limit)
        {
            // 3 より大きい素数は 6k - 1 か 6k + 1 なので、各組の両方を調べる。
            for (int divisor = 5; divisor <= limit; divisor += 6)
            {
                if (candidate % divisor == 0 || candidate % (divisor + 2) == 0)
                {
                    return false;
                }
            }

            return true;
        }
```

`n` が合成数（素数でない数）なら、必ず `√n` 以下の約数を持ちます。なので `√n` まで調べれば十分です。

さらに、2 と 3 の倍数はすでに除いたので、残る候補は **6 で割って 1 か 5 余る数**（6k ± 1）だけです。0, 2, 3, 4 余る数は 2 か 3 の倍数だからです。

`candidate = 221`（= 13 × 17）で追うと、`limit = 14` です。

- divisor = 5: 221 % 5 = 1、221 % 7 = 4 → 割り切れない
- divisor = 11: 221 % 11 = 1、221 % **13 = 0** → 合成数なので false

1 回のループで 2 つの候補（5 と 7、11 と 13、…）を調べているので、ループ回数は √n / 6 ほどで済みます。

## ここがすごい

- **候補を 3 分の 1 に**: 全部の数で割ると √n 回、奇数だけでも √n / 2 回ですが、6k ± 1 だけなら √n / 3 回です。わかりやすさを保ったまま、簡単な数学で手間を減らしています。
- **前提をコメントと Assert で明示**: 「2 は意図的に除外している」とコメントで書き、`Debug.Assert(candidate >= MinPrime)` で確認しています。「ハッシュ表の容量しか判定しない」という用途に合わせて仕様を絞っているのです。
- **ループ部分を別の関数に分ける**: `HasNoPrimeDivisors` は、上限 `limit` を引数で受け取ります。同じファイルの `GetPrimeAtLeastCore` は、候補を増やしながら `limit` を少しずつ更新し、毎回 `Math.Sqrt` を計算しなくて済むようにこの関数を再利用しています。

## まとめ

- 合成数は √n 以下の約数を必ず持つので、√n まで調べればよい。
- 5 以上の素数は必ず 6k − 1 か 6k + 1 の形。2 と 3 を先に除けば候補は 3 分の 1 になる。
- 用途に合わせて仕様を絞り、その前提をコメントと Assert で残す。
