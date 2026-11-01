---
title: "2 つのバイト配列を、長さを先に比べてから中身を順に比べる"
description: "Newtonsoft.Json の MiscellaneousUtils.ByteArrayCompare。長さが違えば、中身を見ずに長さで順序を決める。長さが同じなら、先頭から 1 バイトずつ比べて最初の違いで決める。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MiscellaneousUtils.cs
lines: [102, 120]
function: "MiscellaneousUtils.ByteArrayCompare(byte[], byte[])"
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, 可読性]
---

## ひとことで

`ByteArrayCompare(a1, a2)` は、2 つのバイト配列の **大小（順序）** を決める関数です。
戻り値が負なら `a1` が小さく、0 なら同じ、正なら `a1` が大きい、という意味です。

ふつうの辞書順と違い、**まず長さを比べ** ます。短い配列は、中身に関係なく小さいと判断されます。

## コード

```csharp:line-numbers=102
        public static int ByteArrayCompare(byte[] a1, byte[] a2)
        {
            int lengthCompare = a1.Length.CompareTo(a2.Length);
            if (lengthCompare != 0)
            {
                return lengthCompare;
            }

            for (int i = 0; i < a1.Length; i++)
            {
                int valueCompare = a1[i].CompareTo(a2[i]);
                if (valueCompare != 0)
                {
                    return valueCompare;
                }
            }

            return 0;
        }
```

## 前提知識

- **バイト（byte）**: 0 から 255 までの値を表す 8 ビットの数です。
- **`CompareTo`**: 2 つの値を比べて、小さい・同じ・大きいを表す整数を返す関数です。
- **辞書順**: 文字列を先頭から 1 文字ずつ比べて、最初に違う文字で大小を決める並べ方です。
- **戻り値の符号**: 負は「前が小さい」、0 は「同じ」、正は「前が大きい」を表す約束です。
- **早期 return**: 結論が出た時点で、残りを調べずに関数を抜けることです。

## 何をしているか

### 1. 長さを比べる

```csharp:line-numbers=104
            int lengthCompare = a1.Length.CompareTo(a2.Length);
            if (lengthCompare != 0)
            {
                return lengthCompare;
            }
```

2 つの配列の長さを比べ、違えばその結果をすぐ返します。中身は一切見ません。

### 2. 先頭から 1 バイトずつ比べる

```csharp:line-numbers=110
            for (int i = 0; i < a1.Length; i++)
            {
                int valueCompare = a1[i].CompareTo(a2[i]);
                if (valueCompare != 0)
                {
                    return valueCompare;
                }
            }
```

長さが同じなら、先頭から順にバイトを比べます。最初に違いが見つかったら、その結果を返します。

### 3. すべて同じなら 0

```csharp:line-numbers=119
            return 0;
```

最後まで違いが無ければ、2 つの配列は同じ内容なので 0 を返します。

### 具体例で確かめる

```
[1, 2, 3]  と [9, 9]        → 長さが 3 対 2 なので、長さの比較で 1（a1 が大きい）
[1, 2]     と [1, 3]        → 長さは同じ。2 番目で 2 対 3 なので -1（a1 が小さい）
[5, 6]     と [5, 6]        → すべて同じなので 0
```

## ここがすごい

- **長さの比較が先**: 長さが違えば、中身を 1 バイトも読まずに答えが出ます。
- **違いが見つかった時点で終わる**: 残りの要素は比べません。長い配列でも、途中で止まれば速く済みます。
- **符号を使った戻り値**: 「どちらが小さいか」と「同じか」を 1 つの整数で返せるので、並べ替えや検索の比較関数として使えます。
- **標準の `CompareTo` を使う**: 1 バイトずつの大小は、標準の比較に任せて簡潔に書いています。

## まとめ

- `ByteArrayCompare` は、まず長さを比べ、同じなら先頭から 1 バイトずつ比べる。
- 結果は符号で表し、負なら前が小さい、0 は同じ、正なら前が大きい。
- 長さを先に比べるので、辞書順とは違う順序になる点に注意する。
