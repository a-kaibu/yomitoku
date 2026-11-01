---
title: "小数の符号を求め、NaN は例外にする"
description: ".NET Runtime の Math.Sign(double)。負なら -1、正なら 1、0 なら 0 を返す。NaN は符号を決められないため、ArithmeticException を投げる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [1446, 1462]
function: "Math.Sign(double)"
difficulty: 1
format: 2
tags: [数値計算, エラー処理, 防御的プログラミング]
---

## ひとことで

`Math.Sign(double)` は、小数の **符号** を求める関数です。負なら `-1`、0 なら `0`、正なら `1` を返します。
たとえば `-2.5` は `-1`、`0.0` は `0`、`3.1` は `1` になります。

ただし、`NaN`（数でないことを表す特別な値）は符号を決められないため、例外を投げます。

## コード

```csharp:line-numbers=1446
        public static int Sign(double value)
        {
            if (value < 0)
            {
                return -1;
            }
            else if (value > 0)
            {
                return 1;
            }
            else if (value == 0)
            {
                return 0;
            }

            throw new ArithmeticException(SR.Arithmetic_NaN);
        }
```

## 前提知識

- **`double`**: 小数を表す型です。
- **`NaN`**: 「数ではない」ことを表す特別な値です。`0.0 / 0.0` などで作られます。
- **比較演算子と NaN**: `NaN` は、`<` も `>` も `==` も、どれも `false` になります。そのため、3 つの比較がすべて外れたら、`NaN` だと判断できます。
- **`ArithmeticException`**: 計算の結果が定義できないときに投げられる例外です。

## 何をしているか

### 1. 負の数なら -1

```csharp:line-numbers=1448
            if (value < 0)
            {
                return -1;
            }
```

`value < 0` なら、負の数なので `-1` を返します。

### 2. 正の数なら 1

```csharp:line-numbers=1452
            else if (value > 0)
            {
                return 1;
            }
```

`value > 0` なら、正の数なので `1` を返します。

### 3. 0 なら 0

```csharp:line-numbers=1456
            else if (value == 0)
            {
                return 0;
            }
```

`value == 0` なら、符号がないので `0` を返します。`-0.0` もここに入ります。

### 4. どれにも当てはまらなければ例外

```csharp:line-numbers=1461
            throw new ArithmeticException(SR.Arithmetic_NaN);
```

ここまで残ったのは、`NaN` だけです。符号を決められないので、`ArithmeticException` を投げます。

## ここがすごい

- **NaN を黙って通さない**: 符号が不明な値を、誤った `0` などにせず、例外で知らせます。
- **比較だけで判定する**: 3 つの比較の順序だけで、`NaN` を最後に残しています。特別な判定関数は使いません。
- **よく使う順に書ける**: 負・正・0 の順に並べて、読みやすくしています。

## まとめ

- 負なら `-1`、正なら `1`、0 なら `0` を返す。
- どれにも当てはまらない `NaN` は、例外にする。
- 比較の順序で `NaN` を残す、という書き方になっている。
