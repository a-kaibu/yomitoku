---
title: "4 ビットの値を 16 進の 1 文字にする、「9 より大きいなら飛ばす」小技"
description: ".NET の HexConverter.ToCharUpper。0〜15 の 4 ビットを '0' から足し、'9' を超えたら 'A' までの間の 7 文字を飛ばす。表を使わずに 16 進の 1 文字を作る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/HexConverter.cs
lines: [248, 260]
function: "HexConverter.ToCharUpper"
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, イディオム]
---

## ひとことで

`ToCharUpper(value)` は、0〜15 の値（4 ビットぶんの数）を、**大文字の 16 進数の 1 文字** に変えます。
たとえば `10` は `'A'`、`7` は `'7'`、`15` は `'F'` になります。

表（`"0123456789ABCDEF"` のような文字列）を引く方法もありますが、この関数は表を使わず、足し算と 1 回の比較だけで答えを出します。

## コード

```csharp:line-numbers=248
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static char ToCharUpper(int value)
        {
            value &= 0xF;
            value += '0';

            if (value > '9')
            {
                value += ('A' - ('9' + 1));
            }

            return (char)value;
        }
```

## 前提知識

- **`int` と `char`**: `char` は文字で、中身は数値（UTF-16 の番号）です。`'0'` は 48、`'9'` は 57、`'A'` は 65 です。
- **`value &= 0xF`**: `&` は AND で、`0xF`（2 進数の `1111`）との AND は下位 4 ビットだけを残します。上の桁を捨てて、0〜15 にします。
- **`value += '0'`**: `'0'` を足すと、0〜9 は文字 `'0'`〜`'9'` の番号になります。
- **`(char)value`**: 数値を文字に変換します。

## 何をしているか

### 1. 下位 4 ビットを取り出して '0' を足す

```csharp:line-numbers=251
            value &= 0xF;
            value += '0';
```

値を 0〜15 に絞り、`'0'` を足します。たとえば `value = 7` なら `48 + 7 = 55` で、これは `'7'` です。

### 2. 9 より大きいなら、'A' までの距離を補正する

```csharp:line-numbers=254
            if (value > '9')
            {
                value += ('A' - ('9' + 1));
            }
```

`value` が `'9'` より大きい、つまり 10〜15 のときだけ、`'A' - ('9' + 1)` を足します。

`value = 10` の場合は次のようになります。

```
10 + '0' = 58 （ ':' ）  → '9' より大きい
58 + ('A' - ('9' + 1)) = 58 + (65 - 58) = 65 = 'A'
```

`'9' + 1` は `'9'` の次の文字（`':'`）で、`':'` から `'A'` までの 7 文字（`:;<=>?@`）を飛ばしています。

## ここがすごい

- **表を持たない**: 16 個の文字を並べた表を使わなくても、「0〜9 は `'0'` から、A〜F は `'A'` から」の規則で作れます。キャッシュへのアクセスも不要です。
- **分岐は 1 つだけ**: 9 より大きいかどうかの比較は 1 回です。`AggressiveInlining` が付いているので、呼び出し元に展開されて、ほとんど関数呼び出しのコストが残りません。
- **大文字と小文字を分けて書く**: 同じ仕組みの `ToCharLower`は、`'a'` を使うだけです。大文字と小文字で別の関数にすると、呼び出し側は表記の選択を引数なしで済ませられます。
- **桁を捨てる処理を最初に**: `value &= 0xF` を先に書くことで、範囲外の入力が来ても必ず 1 文字に収まります。

## まとめ

- 0〜9 と A〜F は、文字の番号の並びを利用すると 1 回の補正で作れる。
- 小さな範囲の変換は、表を使うより計算のほうが速いことがある。
- 入力をマスクで先に絞ると、範囲外の値でも安全に扱える。
