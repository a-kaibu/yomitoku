---
title: "リストの要素を、両端から入れ替えて逆順にする"
description: "Newtonsoft.Json の FastReverse。List を前後から 1 つずつ入れ替え、新しいリストを作らずに逆順にする。値型での速度改善のための処理。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [268, 280]
function: "CollectionUtils.FastReverse<T>(List<T>)"
difficulty: 1
format: 2
tags: [最適化, アルゴリズム, 低レイヤ]
---

## ひとことで

`FastReverse` は、`List<T>` の要素の並びを **逆順に並べ替える** 関数です。
たとえば `1, 2, 3, 4` は `4, 3, 2, 1` になります。

新しいリストは作らず、もとのリストの中で要素を入れ替えます。

## コード

```csharp:line-numbers=268
        public static void FastReverse<T>(this List<T> list)
        {
            int i = 0;
            int j = list.Count - 1;
            while (i < j)
            {
                T temp = list[i];
                list[i] = list[j];
                list[j] = temp;
                i++;
                j--;
            }
        }
```

## 前提知識

- **`List<T>`**: 要素を順番に並べて持つ、伸び縮みする配列です。番号（インデックス）で要素を読み書きできます。
- **インデックス**: 先頭から 0 で始まる番号です。`list[i]` で `i` 番目の要素を表します。
- **一時変数（`temp`）**: 2 つの値を入れ替えるときに、一時的に値を退避しておく変数です。
- **値型と参照型**: `int` などの値型は、代入すると中身がコピーされます。この関数は、値型の場合に速くなるように作られています。

## 何をしているか

### 1. 両端の番号を用意する

```csharp:line-numbers=270
            int i = 0;
            int j = list.Count - 1;
```

`i` は先頭の番号（0）、`j` は末尾の番号（`Count - 1`）です。

### 2. 両端の要素を入れ替える

```csharp:line-numbers=272
            while (i < j)
            {
                T temp = list[i];
                list[i] = list[j];
                list[j] = temp;
                i++;
                j--;
            }
```

`i` が `j` より小さい間、`list[i]` と `list[j]` を入れ替えます。入れ替えたら、`i` を 1 つ進め、`j` を 1 つ戻します。

`i` と `j` が出会ったところで、ループが終わります。真ん中より後ろは、すでに入れ替え済みです。

## ここがすごい

- **新しいリストを作らない**: もとのリストの中で入れ替えるだけなので、メモリを追加で使いません。
- **半分だけ回す**: 両端を同時に動かすので、ループは要素数のおよそ半分の回数で終わります。
- **値型で速い**: コメントにある通り、古い .NET Framework では、`Reverse` より速く動くように作られています。

## まとめ

- `i` と `j` の 2 つの番号を、両端から中央へ近づける。
- 対応する 2 つの要素を入れ替えるだけで、逆順になる。
- 新しいリストを作らず、もとのリストを直接変える。
