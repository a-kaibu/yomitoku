---
title: "最小値の符号を反転するとあふれる問題を「1 足してから反転」で避ける"
description: "Humanizer の GetAbsoluteValue。long.MinValue の絶対値は long に収まらないため、先に 1 を足してから符号を反転し、あとで 1 を戻して安全に絶対値を求める。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/Localisation/Ordinalizers/DefaultOrdinalizer.cs
lines: [56, 59]
function: "DefaultOrdinalizer.GetAbsoluteValue"
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, イディオム]
---

## ひとことで

`GetAbsoluteValue` は、`long` 型の数の **絶対値**（符号を取り除いた大きさ）を `ulong` で返す関数です。
たとえば `-5` は `5`、`5` はそのまま `5` です。

ふつうは `-number` と書けば絶対値になりますが、`long` の最小値だけは例外です。この関数は、その特別な場合でも正しく動くように書かれています。

## コード

```csharp:line-numbers=56
    protected static ulong GetAbsoluteValue(long number) =>
        number < 0
            ? (ulong)(-(number + 1)) + 1
            : (ulong)number;
```

## 前提知識

- **`long` と `ulong`**: `long` は符号付き 64 ビット整数で、`-9223372036854775808` から `9223372036854775807` までを表せます。`ulong` は符号なし 64 ビット整数で、0 から約 1.8 × 10¹⁹ までです。
- **`long.MinValue`**: `long` が表せる最小の値 `-9223372036854775808` です。
- **整数のオーバーフロー**: C# の既定の計算では、範囲を超えた結果は例外にならず、ぐるっと回って違う値になります。
- **三項演算子 `? :`**: `条件 ? a : b` は、条件が真なら `a`、偽なら `b` を返します。
- **`(ulong)`**: 値を符号なしとして読み直す変換です。負の数の値は、ビットの並びのまま大きな正の数になります。

## 何をしているか

### 1. 負の数の場合

```csharp:line-numbers=57
        number < 0
            ? (ulong)(-(number + 1)) + 1
```

`number < 0` のときは、まず `number + 1` を計算してから符号を反転し、`ulong` に変換して、最後に `+ 1` で戻します。

`number = -5` なら、`-5 + 1 = -4`、反転して `4`、`+ 1` で `5` になります。

### 2. 0 以上の場合

```csharp:line-numbers=59
            : (ulong)number;
```

0 以上なら、そのまま `ulong` に変換するだけです。

### 3. `long.MinValue` の場合

`number = long.MinValue` では、`number + 1` は `-9223372036854775807` で、これは `long` に収まります。反転すると `9223372036854775807` になり、これを `ulong` にして `+ 1` すると `9223372036854775808` が得られます。これは `ulong` に収まる正しい答えです。

もし単純に `-number` と書くと、`long.MinValue` の反転は `long` に収まらず、結果が `long.MinValue` のまま（負の数）になってしまいます。

## ここがすごい

- **1 を先に足すことでオーバーフローを避けている**: 負の数を反転する前に 1 を足すので、もっとも小さい値でも反転できる範囲に入ります。計算の順番を変えるだけで、例外に頼らず正しい値になります。
- **`ulong` で最後の 1 を受け止める**: 反転後に `ulong` に変換してから `+ 1` するので、最大の正の値に 1 を足しても、`ulong` の範囲内に収まります。
- **分岐を 1 つにまとめる**: 三項演算子で、負の数と正の数の場合を 1 つの式にまとめています。読み手にとっては 2 つのケースが並んで見えるので、理解しやすくなります。
- **例外を投げずに済ませる**: `checked` で例外を投げる書き方もありますが、ここでは例外なしで正しい答えを返すことを選んでいます。

## まとめ

- 負の数の絶対値は、反転すると範囲を超える場合がある。
- 反転の前に 1 を足し、反転後に 1 を足し直すと、最小値でも安全に計算できる。
- `long` と `ulong` の範囲の違いを理解していると、こうした境界の処理が読みやすくなる。
