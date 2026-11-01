---
title: "離れた 2 か所の値の差で次の乱数を作る、Knuth の減算型乱数"
description: "Random の互換実装 CompatPrng の InternalSample。56 個の配列を循環しながら、2 つの離れた位置の値を引いて次の値を作る。昔の .NET と同じ数列を出すために残されている古い方式。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Random.CompatImpl.cs
lines: [339, 373]
function: "Random.CompatPrng.InternalSample"
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`InternalSample` は、`new Random(seed)` のように **種を指定した** 乱数を作るときに使われる、古い方式の乱数生成器の中心です。
毎回 **配列の中の 2 つの位置の値を引き算して**、次の乱数とします。

この方式は Donald Knuth の「減算型乱数生成器」を変形したものです。新しい実装（xoshiro）に切り替えると、種を指定したときに出る数列が変わってしまうので、互換性のためにそのまま残されています。

## コード

```csharp:line-numbers=339
            [MethodImpl(MethodImplOptions.NoInlining)]
            internal int InternalSample()
            {
                Debug.Assert(_seedArray is not null);

                int locINext = _inext;
                if (++locINext >= 56)
                {
                    locINext = 1;
                }

                int locINextp = _inextp;
                if (++locINextp >= 56)
                {
                    locINextp = 1;
                }

                int[] seedArray = _seedArray;
                int retVal = seedArray[locINext] - seedArray[locINextp];

                if (retVal == int.MaxValue)
                {
                    retVal--;
                }
                if (retVal < 0)
                {
                    retVal += int.MaxValue;
                }

                seedArray[locINext] = retVal;
                _inext = locINext;
                _inextp = locINextp;

                return retVal;
            }
```

## 前提知識

- **配列の循環**: 配列の末尾まで来たら先頭に戻る、という使い方です。ここでは 1〜55 の位置を循環させ、添字 0 は使いません。
- **状態**: 乱数生成器は、前の値などの「記憶」（状態）を持っています。この関数は `_seedArray` と 2 つの添字 `_inext`、`_inextp` を状態として使います。
- **`int.MaxValue`**: 32 ビット符号付き整数の最大値（2147483647）です。
- **減算と補正**: 引き算すると負になることがあるので、そのときは `int.MaxValue` を足して正の範囲に戻します。
- **`NoInlining`**: この関数を呼び出し側に展開しないように指定します。コメントにあるように、展開すると分岐の多いコードになり、かえって遅くなるためです。

## 何をしているか

### 1. 2 つの添字を進める

```csharp:line-numbers=344
                int locINext = _inext;
                if (++locINext >= 56)
                {
                    locINext = 1;
                }

                int locINextp = _inextp;
                if (++locINextp >= 56)
                {
                    locINextp = 1;
                }
```

`_inext` と `_inextp` は、どちらも 1 ずつ進みます。56 に達したら 1 に戻ります。2 つの添字は、初期化の時点で 21 だけずれているので、離れた位置の値を組み合わせられます。

### 2. 2 つの値の差を取る

```csharp:line-numbers=356
                int[] seedArray = _seedArray;
                int retVal = seedArray[locINext] - seedArray[locINextp];
```

`seedArray[locINext]` から `seedArray[locINextp]` を引きます。この差が次の乱数の元になります。

### 3. 範囲を正しい値に直す

```csharp:line-numbers=359
                if (retVal == int.MaxValue)
                {
                    retVal--;
                }
                if (retVal < 0)
                {
                    retVal += int.MaxValue;
                }
```

差が `int.MaxValue` と等しければ 1 減らし、負なら `int.MaxValue` を足します。これで、結果は必ず 0 以上で、`int.MaxValue` 未満に収まります。

### 4. 結果を書き戻す

```csharp:line-numbers=368
                seedArray[locINext] = retVal;
                _inext = locINext;
                _inextp = locINextp;

                return retVal;
```

差の結果を `seedArray[locINext]` に書き戻し、2 つの添字を保存して値を返します。書き戻すことで、次の計算で使われる状態が更新されます。

## ここがすごい

- **少ない計算で乱数を作る**: 1 回の呼び出しで、添字の更新、引き算、補正、代入だけです。昔のコンピュータでも十分速く動く軽さを持っています。
- **種の値が同じなら同じ列**: 初期化が決まった手順で行われるので、同じ種からは同じ数列が出ます。テストで毎回同じ数字を出したいときに役立ちます。
- **互換性を守る**: 新しい乱数の方式（xoshiro）に替えたいところですが、古いプログラムが種指定の結果に頼っている可能性があるため、この実装を残しています。コードの歴史が見える例です。
- **`NoInlining` の判断**: 乱数を大量に作る処理の中でこの関数を展開すると、ループが大きくなって分岐予測も悪くなります。そこであえて展開を禁止しています。

## まとめ

- 配列の 2 つの離れた位置の差を使うと、単純な規則で乱数列を作れる。
- 互換性のある乱数は、古い方式をそのまま残す判断が必要になることがある。
- 関数を展開するかどうかは、呼び出し方によって速さが変わるので、コメントに理由を残すと分かりやすい。
