---
title: "符号なし 64 ビット整数の桁数を、大小の区切りで数える"
description: "Newtonsoft.Json の MathUtils.IntLength。10 のべき乗と比べる if の連鎖を、大きい区切りから二分して調べ、桁数を返す。0 は 1 桁とする。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MathUtils.cs
lines: [34, 76]
function: "MathUtils.IntLength(ulong)"
difficulty: 2
format: 2
tags: [数値計算, 最適化, アルゴリズム]
---

## ひとことで

`IntLength` は、符号なし 64 ビット整数（`ulong`）の **桁数** を求める関数です。
たとえば `0` は 1 桁、`12345` は 5 桁、`10000000000`（10 の 10 乗）は 11 桁です。

文字列に変換して長さを数える方法もありますが、この関数は比べるだけで桁数を求めます。

## コード

```csharp:line-numbers=34
        public static int IntLength(ulong i)
        {
            if (i < 10000000000)
            {
                if (i < 10)
                {
                    return 1;
                }
                if (i < 100)
                {
                    return 2;
                }
                if (i < 1000)
                {
                    return 3;
                }
                if (i < 10000)
                {
                    return 4;
                }
                if (i < 100000)
                {
                    return 5;
                }
                if (i < 1000000)
                {
                    return 6;
                }
                if (i < 10000000)
                {
                    return 7;
                }
                if (i < 100000000)
                {
                    return 8;
                }
                if (i < 1000000000)
                {
                    return 9;
                }

                return 10;
            }
```

## 前提知識

- **桁数**: 10 進数で表したときの、数字の個数です。
- **10 のべき乗**: 10、100、1000 などの数です。`i < 100` は、「2 桁以下」という意味になります。
- **二分の考え方**: 大きい区切りで最初に分けてから、それぞれの中で細かく比べると、比べる回数を減らせます。
- **`ulong` の範囲**: 約 1.8 × 10^19 までを表せます。そのため、20 桁まで扱えます。

## 何をしているか

### 1. 大きい区切りで二分する

```csharp:line-numbers=36
            if (i < 10000000000)
            {
                if (i < 10)
```

値が 10 の 10 乗（10000000000）より小さいかを、最初に調べます。ここで、10 桁以下と 11 桁以上に分かれます。

### 2. 10 桁以下を細かく調べる

```csharp:line-numbers=40
                    return 1;
                }
                if (i < 100)
                {
                    return 2;
                }
                if (i < 1000)
                {
                    return 3;
                }
                if (i < 10000)
                {
                    return 4;
                }
                if (i < 100000)
                {
                    return 5;
                }
                if (i < 1000000)
                {
                    return 6;
                }
                if (i < 10000000)
                {
                    return 7;
                }
                if (i < 100000000)
                {
                    return 8;
                }
                if (i < 1000000000)
                {
                    return 9;
                }

                return 10;
```

10 未満なら 1 桁、100 未満なら 2 桁、というように、10 のべき乗と比べて桁数を返します。

### 3. 11 桁以上を細かく調べる

```csharp:line-numbers=77
            else
            {
                if (i < 100000000000)
                {
                    return 11;
                }
                if (i < 1000000000000)
                {
                    return 12;
                }
                if (i < 10000000000000)
                {
                    return 13;
                }
                if (i < 100000000000000)
                {
                    return 14;
                }
                if (i < 1000000000000000)
                {
                    return 15;
                }
                if (i < 10000000000000000)
                {
                    return 16;
                }
                if (i < 100000000000000000)
                {
                    return 17;
                }
                if (i < 1000000000000000000)
                {
                    return 18;
                }
                if (i < 10000000000000000000)
                {
                    return 19;
                }

                return 20;
            }
        }
```

10 の 10 乗以上の場合も、同じように 10 のべき乗と比べて、桁数を返します。最大の 20 桁は、最後に返します。

## ここがすごい

- **比べる回数を減らす**: 最初の二分で、どちらの側を調べるかが決まるので、1 つの枝にだけ細かい比較が並びます。
- **割り算や文字列化をしない**: 比べるだけなので、速く、メモリも使いません。
- **表を持たない**: 10 のべき乗を配列にせず、定数と比べるだけで済ませています。

## まとめ

- 10 の 10 乗より小さいかで、大きく二分する。
- それぞれの側で、10 のべき乗と順に比べて桁数を決める。
- 0 から 20 桁までの値が、比べるだけで求まる。
