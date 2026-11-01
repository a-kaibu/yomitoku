---
title: "浮動小数点の 2 つの数が、誤差の範囲で等しいかを調べる"
description: "Newtonsoft.Json の MathUtils.ApproxEquals。小数の計算誤差を考えて、2 つの double の差が許容範囲（小さな誤差）に収まるかで等しいとみなす。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MathUtils.cs
lines: [172, 185]
function: "MathUtils.ApproxEquals(double, double)"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`ApproxEquals` は、2 つの小数（`double`）が **ほぼ等しいか** を調べる関数です。
たとえば `0.1 + 0.2` と `0.3` は、コンピュータの中では完全には一致しません。この関数では、誤差の範囲なので等しいと判定します。

完全に一致するかどうかではなく、「誤差の範囲で同じとみなせるか」を答えます。

## コード

```csharp:line-numbers=172
        public static bool ApproxEquals(double d1, double d2)
        {
            const double epsilon = 2.2204460492503131E-16;

            if (d1 == d2)
            {
                return true;
            }

            double tolerance = ((Math.Abs(d1) + Math.Abs(d2)) + 10.0) * epsilon;
            double difference = d1 - d2;

            return (-tolerance < difference && tolerance > difference);
        }
```

## 前提知識

- **浮動小数点数（`double`）**: 小数を 2 進数で近似して表す型です。`0.1` のような数は、正確には表せません。
- **計算誤差**: 小数の計算では、わずかなずれが出ます。`0.1 + 0.2` は `0.30000000000000004` になります。
- **イプシロン（`epsilon`）**: `double` が表せる 1 に最も近い数との差です。ここでは `2.22...E-16` が使われています。
- **絶対値（`Math.Abs`）**: 符号を取った値です。負の数も正の大きさで扱えます。

## 何をしているか

### 1. 完全に一致したら、すぐ `true`

```csharp:line-numbers=176
            if (d1 == d2)
            {
                return true;
            }
```

`d1 == d2` なら、誤差を考える必要はないので `true` を返します。

### 2. 許容範囲（tolerance）を作る

```csharp:line-numbers=181
            double tolerance = ((Math.Abs(d1) + Math.Abs(d2)) + 10.0) * epsilon;
```

2 つの数の大きさと、固定の `10.0` を使って、許容範囲を作ります。数が大きいほど、許容範囲も大きくなります。`epsilon` をかけるので、範囲は非常に小さい値です。

### 3. 差が許容範囲の中にあるかを調べる

```csharp:line-numbers=182
            double difference = d1 - d2;

            return (-tolerance < difference && tolerance > difference);
```

2 つの数の差を求め、その差が `-tolerance` より大きく、`tolerance` より小さければ、誤差の範囲内なので `true` です。

## ここがすごい

- **大きさに合わせて許容範囲を変える**: 固定の誤差では、大きい数と小さい数の両方に対応できません。数の大きさに比例させることで、両方に対応しています。
- **`10.0` で下限を作る**: 0 付近の数でも、わずかな許容範囲が残るように、固定の値を足しています。
- **速い判定**: 差を 1 回計算して比べるだけなので、負担が小さい書き方です。

## まとめ

- まず完全一致を調べ、一致しなければ許容範囲で判定する。
- 許容範囲は、数の大きさと `epsilon` から作る。
- 差が許容範囲の中なら、等しいとみなす。
