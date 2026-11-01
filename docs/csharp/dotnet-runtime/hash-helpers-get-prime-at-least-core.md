---
title: "平方根を 1 回だけ計算して素数を探し続ける"
description: "表にない大きな素数を探す GetPrimeAtLeastCore。候補を 6k±1 に限って 2 と 4 を交互に足し、平方根の上限は掛け算で少しずつ更新して Math.Sqrt を毎回呼ばない。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/Collections/HashHelpers.cs
lines: [118, 148]
function: "HashHelpers.GetPrimeAtLeastCore"
difficulty: 2
tags: [アルゴリズム, 数値計算, 最適化]
---

## ひとことで

`GetPrimeAtLeastCore(min)` は、**`min` 以上の最小の素数** を計算で探す関数です。
素数表（約 720 万まで）に載っていない大きなサイズのハッシュ表を作るときに呼ばれます。

候補の数を 1 つずつ素数判定していくのですが、**判定しなくてもよい数を飛ばす** ことと、**平方根を毎回計算しない** ことの 2 つの工夫があります。

## コード

```csharp:line-numbers=118
        private static int GetPrimeAtLeastCore(int min)
        {
            Debug.Assert(min > MinPrime);

            int candidate = min | 1;
            uint remainder = (uint)candidate % 6;
            if (remainder == 3)
            {
                candidate += 2;
            }

            int increment = remainder == 1 ? 4 : 2;
            int limit = (int)Math.Sqrt(candidate);
            long nextLimitSquared = (long)(limit + 1) * (limit + 1);
            while (true)
            {
                while (nextLimitSquared <= candidate)
                {
                    limit++;
                    nextLimitSquared = (long)(limit + 1) * (limit + 1);
                }

                if ((uint)(candidate - 1) % HashPrime != 0 && HasNoPrimeDivisors(candidate, limit))
                {
                    return candidate;
                }

                candidate += increment;
                increment = 6 - increment;
            }
        }
```

## 前提知識

- **`min | 1`**: `|` はビットごとの OR です。一番下のビットを 1 にするので、偶数は 1 つ上の奇数になり、奇数はそのまま変わりません。
- **`(uint)candidate % 6`**: 6 で割った余りです。符号なしで計算しています。
- **`long`**: 64 ビット整数です。`(limit + 1) * (limit + 1)` は `int`（32 ビット）だとあふれる可能性があるので、`(long)` に変換してから掛けています。
- **`while (true)`**: 無限ループです。中の `return` で抜けます。
- **`HashPrime`**: 16 行目で定義されている定数 101 です。
- **`HasNoPrimeDivisors(candidate, limit)`**: 同じファイルにある関数で、5 から `limit` までの「6k ± 1」の数で割り切れなければ true を返します。

## 何をしているか

### 1. 最初の候補を 6k ± 1 にそろえる（122〜129 行目）

5 以上の素数は必ず 6 で割って 1 か 5 余ります。`min | 1` で奇数にしたあと、余りが 3（つまり 3 の倍数）なら 2 を足して余り 5 にします。

次の候補への増分は、余り 1 の数からは +4（余り 5 へ）、余り 5 の数からは +2（次の余り 1 へ）です。146 行目の `increment = 6 - increment` で 4 と 2 を交互に切り替えます。

`min = 100` で追うと、`100 | 1 = 101`、101 % 6 = 5 なので候補は 101, 103, 107, 109, 113 … と進みます。

### 2. 平方根の上限を少しずつ更新する（130〜138 行目）

素数判定では「√candidate まで割ってみる」必要があります。最初に 1 回だけ `Math.Sqrt` を計算し、以降は **「(limit+1)² が candidate 以下になったら limit を 1 増やす」** という掛け算だけで上限を追いかけます。候補は少しずつしか大きくならないので、limit もときどき 1 増えるだけです。

### 3. 条件を満たせば返す（140〜143 行目）

`(candidate - 1) % 101 != 0` は、「`candidate - 1` が 101 の倍数ではない」という条件です。`Hashtable` は衝突したときの歩幅を `1 + (seed * 101) % (容量 - 1)` で決めています（Hashtable.cs の 408 行目）。そのコメント（390〜391 行目）によれば、`容量 - 1` が 101 の倍数でなければ歩幅は 1〜容量−1 のどの値にもなりえます。その前提を守るための条件です。そのうえで素数判定に通れば返します。

## ここがすごい

- **候補を 3 分の 1 に**: すべての数を調べると 6 個中 6 個、奇数だけでも 3 個ですが、6k ± 1 なら 2 個だけです。+4 と +2 を交互に足すだけで実現しています。
- **平方根の差分更新**: `Math.Sqrt` は浮動小数点の計算で比較的重く、誤差の心配もあります。一度だけ計算して、あとは整数の掛け算と比較で更新するので、ループの中が軽くなります。
- **オーバーフローを `long` で防ぐ**: `int` の最大値近くまで探しても `(limit + 1)²` が正しく計算できるよう、64 ビットで計算しています。
- **判定ロジックの再利用**: 実際の割り算は `HasNoPrimeDivisors` に任せ、この関数は「候補の作り方」と「上限の管理」だけに集中しています。

## まとめ

- 5 以上の素数は 6k ± 1 の形なので、+4 と +2 を交互に足せば候補を効率よく作れる。
- 少しずつ変わる値の平方根は、毎回計算せずに差分で更新できる。
- 掛け算の結果があふれそうなら、広い型に変換してから計算する。
