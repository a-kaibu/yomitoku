---
title: "範囲の両端を含むかどうかを、比較 1 回で判定する"
description: ".NET の UnicodeUtility.IsInRangeInclusive。値から下限を引き、範囲の幅と比べる。符号なし整数の折り返しを使い、下限より小さい値も比較 1 回で弾く判定の定番の書き方。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Text/UnicodeUtility.cs
lines: [141, 141]
function: "UnicodeUtility.IsInRangeInclusive(uint, uint, uint)"
difficulty: 2
format: 2
tags: [数値計算, 最適化, 可読性]
---

## ひとことで

`IsInRangeInclusive(value, lower, upper)` は、`value` が `lower` 以上 `upper` 以下の範囲に入るかを判定する関数です。
たとえば `IsInRangeInclusive(5, 1, 10)` は `true`、`IsInRangeInclusive(0, 1, 10)` は `false` です。

ふつうは「`lower` 以上か」と「`upper` 以下か」の 2 回の比較を書きます。この関数は、比較を 1 回に減らしています。

## コード

```csharp:line-numbers=141
        public static bool IsInRangeInclusive(uint value, uint lowerBound, uint upperBound) => (value - lowerBound) <= (upperBound - lowerBound);
```

## 前提知識

- **範囲の判定**: `lower <= value <= upper` を調べることです。両端の値を含みます。
- **符号なし整数（`uint`）**: 0 以上だけを表す整数です。0 より小さい値を引くと、2 の 32 乗から引いた大きな値（折り返し）になります。
- **範囲の幅**: `upper - lower` で求める、範囲の大きさです。`lower` と `upper` を含むので、幅に 1 を足した個数になります。
- **比較演算子 `<=`**: 左辺が右辺以下なら `true` を返します。

## 何をしているか

この 1 行で、次の 2 つの動きを同時に行っています。

```csharp:line-numbers=141
        public static bool IsInRangeInclusive(uint value, uint lowerBound, uint upperBound) => (value - lowerBound) <= (upperBound - lowerBound);
```

### 1. 下限からの距離を求める

`value - lowerBound` は、`value` が下限からどれだけ離れているかを表します。`value` が下限より小さいと、符号なしの引き算は、折り返して大きな値になります。

### 2. 範囲の幅と比べる

`upperBound - lowerBound` は、範囲の幅です。下限からの距離が、幅以下であれば、範囲の中にあります。

### 具体例で確かめる

範囲は `[1, 10]`、幅は `10 - 1 = 9` です。

```
value = 5  → 5 - 1 = 4  → 4 ≤ 9 → true
value = 10 → 10 - 1 = 9 → 9 ≤ 9 → true
value = 11 → 11 - 1 = 10 → 10 ≤ 9 → false
value = 0  → 0 - 1 = 折り返して大きな値 → false
```

下限より小さい値は、引き算で大きな値に折り返すので、上限の側の比べ方だけで弾けます。

## ここがすごい

- **比較が 1 回で済む**: 「下限以上」と「上限以下」を 2 回比べる代わりに、1 回の比較で両方を判定します。
- **分岐を減らす**: `&&` で 2 つの条件をつなぐ必要がないので、CPU の分岐の失敗が減ります。
- **符号なしの性質を利用**: 下限より小さい値の判定を、折り返しに任せています。特別な場合分けは要りません。
- **Unicode の判定で繰り返し使われる**: サロゲートや文字の種類の判定など、範囲の確認が多い場所で、この書き方が使われています。

## まとめ

- `IsInRangeInclusive` は、`value - lower` と範囲の幅を 1 回の比較で比べ、範囲に入るかを判定する。
- 下限より小さい値は、符号なし整数の折り返しで大きな値になり、自然に弾かれる。
- 比較が 1 回で済むので、よく使われる範囲の判定を速く行える。
