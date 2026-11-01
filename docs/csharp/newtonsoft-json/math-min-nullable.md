---
title: "null 許容の整数どうしの小さい方を、null を無視して求める"
description: "Newtonsoft.Json の MathUtils.Min(int?, int?)。片方が null なら、もう片方をそのまま返す。両方に値があるときだけ、Math.Min で比べる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MathUtils.cs
lines: [130, 142]
function: "MathUtils.Min(int?, int?)"
difficulty: 1
format: 2
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`Min(int?, int?)` は、2 つの **値が無いかもしれない整数**（`int?`）の小さい方を求める関数です。
たとえば `3` と `5` なら `3`、`null` と `5` なら `5` を返します。

`null` を「比べる対象から外す」という意味で扱います。そのため、片方だけに値があれば、その値がそのまま結果になります。

## コード

```csharp:line-numbers=130
        public static int? Min(int? val1, int? val2)
        {
            if (val1 == null)
            {
                return val2;
            }
            if (val2 == null)
            {
                return val1;
            }

            return Math.Min(val1.GetValueOrDefault(), val2.GetValueOrDefault());
        }
```

## 前提知識

- **`int?`（Nullable 型）**: 整数の値に加えて、値が無いこと（`null`）を表せる型です。
- **`GetValueOrDefault()`**: 値があればその値を、`null` なら既定値（`0`）を返す関数です。
- **`Math.Min`**: 2 つの数のうち、小さい方を返す .NET の関数です。
- **早期の `return`**: 条件に当てはまったら、残りを実行せずに値を返す書き方です。

## 何をしているか

### 1. 1 つ目が null なら 2 つ目を返す

```csharp:line-numbers=132
            if (val1 == null)
            {
                return val2;
            }
```

1 つ目が `null` なら、比べる相手がないので、2 つ目の値（`null` のこともある）をそのまま返します。

### 2. 2 つ目が null なら 1 つ目を返す

```csharp:line-numbers=136
            if (val2 == null)
            {
                return val1;
            }
```

2 つ目が `null` なら、1 つ目をそのまま返します。

### 3. 両方に値があれば小さい方を返す

```csharp:line-numbers=141
            return Math.Min(val1.GetValueOrDefault(), val2.GetValueOrDefault());
```

両方に値があるときだけ、`Math.Min` で比べます。`GetValueOrDefault` は、ここでは値が必ずあるので、値をそのまま取り出す役目です。

## ここがすごい

- **null を特別扱いしない比べ方**: 「値がない方は無視する」という決まりを、条件の順番だけで表しています。
- **早く返す**: 片方が `null` なら、比較の計算をせずに返します。
- **両方が null なら null**: 1 つ目が `null` のとき、2 つ目も `null` なら、結果も `null` になります。

## まとめ

- 1 つ目が `null` なら 2 つ目を返す。
- 2 つ目が `null` なら 1 つ目を返す。
- 両方に値があるときだけ、小さい方を返す。
