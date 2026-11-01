---
title: "割り算の商と余りを、1 回の割り算から求める"
description: ".NET の Math.DivRem(int, int, out int)。商を / で求め、余りは a - 商 × b で計算する。コード中の注釈が、なぜ % を使わないのかを説明している。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Math.cs
lines: [387, 396]
function: "Math.DivRem(int, int, out int)"
difficulty: 2
format: 2
tags: [数値計算, 最適化, 標準ライブラリ]
---

## ひとことで

`Math.DivRem(a, b, out result)` は、`a` を `b` で割った **商** を返し、**余り** を `result` に入れて返す関数です。
たとえば `DivRem(17, 5, out r)` は、商の `3` を返し、`r` に余りの `2` を入れます。

2 つの値を別々に `/` と `%` で求めると割り算が 2 回になります。この関数は、その 2 回分をまとめるための道具です。

## コード

::: code-group

```csharp:line-numbers=387 [日本語訳]
        public static int DivRem(int a, int b, out int result)
        {
            // TODO（課題 https://github.com/dotnet/runtime/issues/5213）:
            // JIT が割り算の命令（idiv）を 1 つ消せるようになったら、% と / を使う形に戻す。
            // それまでは、* と - を使う方が、余分な / を使うより計測上速い。

            int div = a / b;
            result = a - (div * b);
            return div;
        }
```

```csharp:line-numbers=387 [原文]
        public static int DivRem(int a, int b, out int result)
        {
            // TODO https://github.com/dotnet/runtime/issues/5213:
            // Restore to using % and / when the JIT is able to eliminate one of the idivs.
            // In the meantime, a * and - is measurably faster than an extra /.

            int div = a / b;
            result = a - (div * b);
            return div;
        }
```

:::

## 前提知識

- **商と余り**: `17 ÷ 5 = 3 あまり 2` のように、割り算の結果は商と余りの組になります。
- **`out` 引数**: 関数の中で値を入れて、呼び出し側に返すための引数です。戻り値とは別に、もう 1 つの結果を受け取れます。
- **余りの式**: 割られる数 `a` は、`b × 商 + 余り` で表せます。だから、余りは `a - 商 × b` で求められます。
- **整数の割り算の切り捨て**: C# の整数の `/` は、0 に近い方へ切り捨てます。`-17 / 5` は `-3` になります。
- **JIT（ジャスト・イン・タイム・コンパイラ）**: 実行時に機械語へ変換する仕組みです。割り算の命令を減らせるかどうかを判断します。

## 何をしているか

### 1. 商を `/` で求める

```csharp:line-numbers=393
            int div = a / b;
```

`a / b` で商を求めます。これが戻り値になります。

### 2. 余りを引き算で求める

```csharp:line-numbers=394
            result = a - (div * b);
```

余りは `a - (商 × b)` で求めます。`%` を使わず、掛け算と引き算だけで余りを出しています。

### 3. 商を返す

```csharp:line-numbers=395
            return div;
```

戻り値として商を返します。余りは `out` 引数の `result` に入っています。

### 具体的に追う

`a = -17`, `b = 5` の場合を確かめます。

```
商   = -17 / 5 = -3   （0 に近い方へ切り捨て）
余り = -17 - (-3 × 5) = -17 - (-15) = -2
```

余りの符号は割られる数と同じになります。これは C# の `%` と同じ決まりです。

## ここがすごい

- **割り算は 1 回だけ**: 商を求めた後は、掛け算と引き算だけで余りが出せます。割り算の命令は重い処理なので、回数が減ると速くなります。
- **注釈が理由を残している**: `TODO` の注釈は、なぜ `%` と `/` を使わないのかを書いています。計測した結果を書いておくと、後の人が勝手に戻すのを防げます。
- **条件が変われば戻す計画**: 注釈は、コンパイラが改善したら元の書き方に戻す、という条件を示しています。
- **2 つのバージョン**: 同じ名前で `int` と `long` が用意されています。型ごとに数値の範囲に合わせた計算をしています。

## まとめ

- `DivRem` は、商と余りを 1 回の割り算から求める関数。
- 余りは `a - 商 × b` で計算でき、符号は `a` と同じになる。
- コードの注釈は、速さの理由と、元に戻す条件を残している。
