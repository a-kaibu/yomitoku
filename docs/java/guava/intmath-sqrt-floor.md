---
title: "浮動小数点の平方根を (int) で切るだけで整数の平方根を求める"
description: "Guava の IntMath.sqrtFloor。int の平方根の切り捨てを、double の Math.sqrt と (int) キャストの 1 行で求める。int は double に変換しても精度が落ちないため、この短い実装で正しく答えが出る。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [296, 300]
function: "IntMath.sqrtFloor"
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`IntMath.sqrtFloor(x)` は、`x` の平方根を **小数点以下を切り捨てた整数** で返します。たとえば `sqrt(10)` は約 3.16 なので、答えは `3` です。`sqrtFloor(16)` は `4` です。

ふつうに整数だけで平方根を求めるには、ニュートン法などのループが必要です。この関数はそれを使わず、**`double` の平方根を求めて `(int)` で切り捨てるだけ** です。短く、速く、しかも正しい答えが出ます。

## コード

::: code-group

```java:line-numbers=296 [日本語訳]
  private static int sqrtFloor(int x) {
    // int から double への変換では精度は失われない（JLS の変換の規則による）
    // http://java.sun.com/docs/books/jls/third_edition/html/conversions.html#5.1.2 （Java 言語仕様の 5.1.2 節）
    return (int) Math.sqrt(x);
  }
```

```java:line-numbers=296 [原文]
  private static int sqrtFloor(int x) {
    // There is no loss of precision in converting an int to a double, according to
    // http://java.sun.com/docs/books/jls/third_edition/html/conversions.html#5.1.2
    return (int) Math.sqrt(x);
  }
```

:::

## 前提知識

- **平方根**: ある数 `y` に対して、`y × y = x` となる `y` です。`sqrt(16) = 4` です。
- **切り捨て**: 小数点以下を捨てることです。`3.16` は `3`、`3.99` も `3` です。
- **`double`**: 64 ビットの小数（浮動小数点数）です。有効な桁数は約 15〜16 桁です。
- **`(int)` キャスト**: 小数や大きな値を `int` に変換します。小数の場合は、0 に向かって切り捨てます。
- **`Math.sqrt`**: 平方根を `double` で返す関数です。

## 何をしているか

### 1. 平方根を小数で求める

```java:line-numbers=299
    return (int) Math.sqrt(x);
```

`Math.sqrt(x)` は、`x` の平方根を `double` で返します。`x` は `int` なので、まず `double` に変換されてから計算されます。

### 2. 切り捨てて整数にする

`(int)` キャストで、小数点以下を捨てます。`sqrt(10) ≈ 3.16` は `3` に、`sqrt(16) = 4.0` は `4` になります。

### 3. 精度の心配がない理由

コメントにあるとおり、`int` を `double` に変換しても、値は失われません。`double` の仮数部は 53 ビットあり、`int` の 32 ビットをすべて正確に表せるからです。

さらに、平方根の計算は IEEE 754 の規則で、結果がもっとも近い `double` に丸められます。`x = k² − 1` の平方根は、およそ `k − 1/(2k)` です。`k` が大きくても、この差は `double` の精度よりずっと大きいので、`k` より小さい値として正しく区別できます。

そのため、`x = 15` の平方根（約 3.87）は `3` になり、`x = 16` の平方根（ちょうど `4`）は `4` になります。

## ここがすごい

- **1 行で済む**: 整数の平方根には、ニュートン法や二分探索など、いくつかの方法があります。しかし `int` の範囲では、浮動小数点の平方根で十分に正確です。コードは、読みやすく、間違えにくいものになります。
- **精度の根拠を明記**: コメントには、変換で精度が失われないという根拠が、Java 言語仕様の該当する節へのリンクとともに書かれています。「たぶん大丈夫」ではなく、理由を残しているのが特徴です。
- **大きな数でも安全**: `int` の範囲（約 21 億）では、平方根は約 4 万 6 千で、`double` の精度に十分収まります。範囲を `long` に広げると精度の問題が出てくるので、この関数は `int` 専用です。
- **速さ**: 平方根は CPU の専用命令で計算されることが多く、ループより速く答えが出ます。

## まとめ

- 整数の平方根は、`double` の平方根を `(int)` で切り捨てれば求まる。
- `int` は `double` に正確に変換でき、平方根の丸めもこの範囲では誤らない。
- 範囲を広げるときは、精度の限界を確かめてから、この方法を使う。
