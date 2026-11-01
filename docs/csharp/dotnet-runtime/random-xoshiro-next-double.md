---
title: "64 ビットの乱数から 0 以上 1 未満の小数を作る正しい方法"
description: "Random.NextDouble の xoshiro 版。double の精度が 53 ビットであることを利用して、乱数の上位 53 ビットを取り出し 2^-53 を掛けるだけで、等間隔で偏りのない小数を作る。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Random.Xoshiro256StarStarImpl.cs
lines: [182, 189]
function: "Random.XoshiroImpl.NextDouble"
difficulty: 2
tags: [乱数, 数値計算, 標準ライブラリ]
---

## ひとことで

`random.NextDouble()` は、**0.0 以上 1.0 未満の小数の乱数** を返します。

この実装はたった 1 行です。64 ビットの整数の乱数を、右に 11 ビットずらして **上位 53 ビット** だけにし、`1 / 2⁵³` を掛けます。なぜ 53 ビットなのかが、この 1 行の要点です。

## コード

```csharp:line-numbers=182
            public override double NextDouble() =>
                // As described in http://prng.di.unimi.it/:
                // "A standard double (64-bit) floating-point number in IEEE floating point format has 52 bits of significand,
                //  plus an implicit bit at the left of the significand. Thus, the representation can actually store numbers with
                //  53 significant binary digits. Because of this fact, in C99 a 64-bit unsigned integer x should be converted to
                //  a 64-bit double using the expression
                //  (x >> 11) * 0x1.0p-53"
                (NextUInt64() >> 11) * (1.0 / (1ul << 53));
```

## 前提知識

- **`double`（倍精度浮動小数点数）**: C# の 64 ビットの小数型です。IEEE 754 という規格で、「符号 1 ビット・指数 11 ビット・仮数 52 ビット」でできています。仮数の先頭には省略された 1 ビットがあるので、**有効数字は 2 進数で 53 桁** です。
- **`>> 11`**: 64 ビットの値を右に 11 ずらすと、上位 53 ビットが残ります（64 − 11 = 53）。
- **`1ul << 53`**: 1 を 53 ビット左にずらした `ulong`、つまり 2⁵³ です。`1.0 / (1ul << 53)` はコンパイル時に計算される定数で、2⁻⁵³ です。
- **式形式のメソッド `=>`**: `{ return ...; }` を省略して書く形です。
- **`override`**: 親クラス（`ImplBase`）で宣言されたメソッドを、このクラス用に上書きしています。

## 何をしているか

1. `NextUInt64()` で 64 ビットの一様な乱数を作る。
2. `>> 11` で 0 〜 2⁵³ − 1 の整数にする。
3. `× 2⁻⁵³` で 0 〜 (2⁵³ − 1) / 2⁵³ の小数にする。

結果は 0, 1/2⁵³, 2/2⁵³, … と **等間隔に並んだ 2⁵³ 通りの値** のどれかが、等しい確率で出ます。最大値は 1 − 2⁻⁵³ なので、1.0 は決して出ません。

## ここがすごい

- **53 ビットがちょうどいい理由**: 0〜2⁵³ − 1 の整数はすべて double で **誤差なく** 表せます。2⁻⁵³ を掛けるのは指数部を変えるだけなので、これも誤差が出ません。もし 64 ビット全部を使って `x / 2⁶⁴` とすると、整数を double に変換する段階で下位ビットが丸められ、隣り合う整数が同じ小数になったり、丸め上がって 1.0 そのものが出てしまったりします。
- **割り算ではなく掛け算**: `1.0 / (1ul << 53)` は定数なのでコンパイル時に計算され、実行時は掛け算 1 回です。
- **出典に忠実**: 183〜188 行目のコメントで、xoshiro の作者のサイトに書かれた推奨の変換式（C99 の `(x >> 11) * 0x1.0p-53`）をそのまま引用しています。浮動小数点の細かい落とし穴を、専門家の推奨に従うことで避けています。
- **float 版も同じ考え方**: すぐ下の `NextSingle` は、`float` の有効数字 24 ビットに合わせて `>> 40` と `2⁻²⁴` を使っています。

## まとめ

- double の有効数字は 2 進数で 53 桁。乱数の上位 53 ビットを使うと、誤差なく等間隔の小数を作れる。
- 定数の割り算はコンパイル時に計算させ、実行時は掛け算にする。
- 浮動小数点の変換は丸めの落とし穴が多い。信頼できる出典の式を使い、出典を残す。
