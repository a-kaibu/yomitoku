---
title: "黄金比から作る 55 個の初期値を、Knuth の方法で混ぜて種にする"
description: "Random の互換実装 CompatPrng の Initialize。整数の種から 56 要素の配列を作り、黄金比由来の定数を使って初期値を並べ、さらに 4 回の混ぜ合わせで偏りを減らす。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Random.CompatImpl.cs
lines: [272, 324]
function: "Random.CompatPrng.Initialize"
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

`Initialize(seed)` は、`new Random(seed)` で渡された **整数の種** から、乱数生成器の内部状態（56 個の整数の配列）を作る関数です。
乱数の質は、この初期化で決まると言ってもよい部分です。

種の値をそのまま使うと、似た種からは似た数列が出てしまいます。この関数は、黄金比に由来する定数と、何度もの混ぜ合わせで、初期値を十分にばらつかせています。

## コード

::: code-group

```csharp:line-numbers=272 [日本語訳]
            [MemberNotNull(nameof(_seedArray))]
            private void Initialize(int seed)
            {
                Debug.Assert(_seedArray is null);

                int[] seedArray = new int[56];

                int subtraction = (seed == int.MinValue) ? int.MaxValue : Math.Abs(seed);
                int mj = 161803398 - subtraction; // 黄金比に基づくマジックナンバー
                seedArray[55] = mj;
                int mk = 1;

                int ii = 0;
                for (int i = 1; i < 55; i++)
                {
                    // 範囲 [1..55] は Knuth の特別な範囲なので、0 番目の位置は使わない。
                    if ((ii += 21) >= 55)
                    {
                        ii -= 55;
                    }

                    seedArray[ii] = mk;
                    mk = mj - mk;
                    if (mk < 0)
                    {
                        mk += int.MaxValue;
                    }

                    mj = seedArray[ii];
                }

                for (int k = 1; k < 5; k++)
                {
                    for (int i = 1; i < 56; i++)
                    {
                        int n = i + 30;
                        if (n >= 55)
                        {
                            n -= 55;
                        }

                        seedArray[i] -= seedArray[1 + n];
                        if (seedArray[i] < 0)
                        {
                            seedArray[i] += int.MaxValue;
                        }
                    }
                }

                _seedArray = seedArray;
                _inext = 0;
                _inextp = 21;
            }
```

```csharp:line-numbers=272 [原文]
            [MemberNotNull(nameof(_seedArray))]
            private void Initialize(int seed)
            {
                Debug.Assert(_seedArray is null);

                int[] seedArray = new int[56];

                int subtraction = (seed == int.MinValue) ? int.MaxValue : Math.Abs(seed);
                int mj = 161803398 - subtraction; // magic number based on Phi (golden ratio)
                seedArray[55] = mj;
                int mk = 1;

                int ii = 0;
                for (int i = 1; i < 55; i++)
                {
                    // The range [1..55] is special (Knuth) and so we're wasting the 0'th position.
                    if ((ii += 21) >= 55)
                    {
                        ii -= 55;
                    }

                    seedArray[ii] = mk;
                    mk = mj - mk;
                    if (mk < 0)
                    {
                        mk += int.MaxValue;
                    }

                    mj = seedArray[ii];
                }

                for (int k = 1; k < 5; k++)
                {
                    for (int i = 1; i < 56; i++)
                    {
                        int n = i + 30;
                        if (n >= 55)
                        {
                            n -= 55;
                        }

                        seedArray[i] -= seedArray[1 + n];
                        if (seedArray[i] < 0)
                        {
                            seedArray[i] += int.MaxValue;
                        }
                    }
                }

                _seedArray = seedArray;
                _inext = 0;
                _inextp = 21;
            }
```

:::

## 前提知識

- **種（seed）**: 乱数の列の出発点となる整数です。同じ種からは同じ列が出ます。
- **`int[]`**: 整数の配列です。ここでは 56 要素を使います。0 番目は使わず、1〜55 を循環させるのが Knuth の方式です。
- **`Math.Abs`**: 絶対値です。ただし `int.MinValue` の絶対値は `int` に収まらないので、特別な場合で扱っています。
- **黄金比**: 約 1.618 の数です。161803398 は、その小数点を取り除いた値を近似しています。
- **`Debug.Assert`**: デバッグビルドでだけ確かめられる前提です。

## 何をしているか

### 1. 種から出発点の値を作る

```csharp:line-numbers=277
                int[] seedArray = new int[56];

                int subtraction = (seed == int.MinValue) ? int.MaxValue : Math.Abs(seed);
                int mj = 161803398 - subtraction; // 黄金比に基づくマジックナンバー
                seedArray[55] = mj;
```

`int.MinValue` の場合だけ `int.MaxValue` を使い、絶対値を取ります。そこから、黄金比を由来とする定数 `161803398` を引いた値を `mj` とし、配列の末尾に入れます。

### 2. 位置を 21 ずつずらして値を並べる

```csharp:line-numbers=282
                int mk = 1;

                int ii = 0;
                for (int i = 1; i < 55; i++)
                {
                    // 範囲 [1..55] は Knuth の特別な範囲なので、0 番目の位置は使わない。
                    if ((ii += 21) >= 55)
                    {
                        ii -= 55;
                    }

                    seedArray[ii] = mk;
                    mk = mj - mk;
                    if (mk < 0)
                    {
                        mk += int.MaxValue;
                    }

                    mj = seedArray[ii];
                }
```

`ii` は 21 ずつ進み、55 を超えたら 55 を引いて戻ります。そこに値を置き、次の値は今の `mj` から `mk` を引いて作ります。負になったら `int.MaxValue` を足します。

21 と 55 は互いに素（最大公約数が 1）なので、`ii` は 54 回の繰り返しで 1〜54 のすべての位置を一度ずつ訪れます。これで、配列の全体に値が散らばって入ります。

### 3. 4 回の混ぜ合わせ

```csharp:line-numbers=303
                for (int k = 1; k < 5; k++)
                {
                    for (int i = 1; i < 56; i++)
                    {
                        int n = i + 30;
                        if (n >= 55)
                        {
                            n -= 55;
                        }

                        seedArray[i] -= seedArray[1 + n];
                        if (seedArray[i] < 0)
                        {
                            seedArray[i] += int.MaxValue;
                        }
                    }
                }
```

配列全体を 4 回なめて、それぞれの位置の値から、30 だけ離れた位置の値を引きます。負になったら補正します。何度も繰り返すことで、最初の並べ方の偏りが消えていきます。

### 4. 生成器の状態を確定する

```csharp:line-numbers=321
                _seedArray = seedArray;
                _inext = 0;
                _inextp = 21;
```

作った配列を `_seedArray` に入れ、添字を初期値に戻します。

## ここがすごい

- **黄金比で初期化の偏りを減らす**: 種の値そのものを使わず、黄金比の定数で出発点をずらしています。種が似ていても、初期値は大きく違うようになります。
- **互いに素な歩幅**: 21 と 55 は互いに素なので、`ii` の進み方で 1〜54 の位置を一度ずつ訪れられます。一部の位置が飛ばされることがありません。
- **混ぜ合わせを 4 回**: 1 回の混ぜ合わせでは十分ではないので、繰り返して状態を散らしています。計算は配列の 55 要素を 4 回なめるだけで、軽い処理です。
- **特別な種を扱う**: `int.MinValue` の絶対値はオーバーフローするので、`int.MaxValue` に置き換えています。数値の境界に気を配った書き方です。

## まとめ

- 乱数の初期値は、種をそのまま使わず、定数や混ぜ合わせで散らす必要がある。
- 歩幅を互いに素な数にすると、配列のすべての位置を偏りなく使える。
- 境界の値（`int.MinValue`）は、絶対値を取る前に特別扱いする。
