---
title: "先頭の 0 の数から、整数の 2 進数の桁数を 1 行で出す"
description: "LMAX Disruptor の Util.log2。int の底 2 の対数（切り捨て）を、numberOfLeadingZeros と引き算だけで求める。値が 1 未満のときは例外にする安全策も入っている。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2011 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/util/Util.java
lines: [97, 104]
function: "Util.log2"
difficulty: 1
format: 2
tags: [ビット演算, 数値計算, 防御的プログラミング]
---

## ひとことで

`Util.log2(value)` は、正の `int` の **底 2 の対数を切り捨てた値** を返します。言い換えると、その数を 2 進数で書いたときの **桁数から 1 を引いた値** です。たとえば `8`（`1000`）は `3`、`9`（`1001`）も `3`、`1` は `0` です。

Disruptor は、高速なメッセージのやり取りを行うライブラリです。リングバッファの大きさを 2 のべき乗にして、位置を `&` で求めるので、その大きさを「2 の何乗か」で扱う場面が多くあります。

## コード

```java:line-numbers=97
    public static int log2(final int value)
    {
        if (value < 1)
        {
            throw new IllegalArgumentException("value must be a positive number");
        }
        return Integer.SIZE - Integer.numberOfLeadingZeros(value) - 1;
    }
```

## 前提知識

- **対数（log）**: 「2 を何回掛けると、この数になるか」を表す数です。`log2(8) = 3` です。
- **切り捨て**: `log2(9)` は約 3.17 ですが、整数の答えとしては小数点以下を捨てた `3` を返します。
- **桁数**: 2 進数で、最上位の 1 から最下位までの桁の数です。`9` は `1001` なので 4 桁です。
- **`Integer.SIZE`**: `int` のビット数で、32 です。
- **`Integer.numberOfLeadingZeros(x)`**: 上位から 0 が何個続くかを返します。`9` なら `28` です。
- **`IllegalArgumentException`**: 引数が不正なときに投げる例外です。

## 何をしているか

### 1. 不正な値を弾く

```java:line-numbers=99
        if (value < 1)
        {
            throw new IllegalArgumentException("value must be a positive number");
        }
```

対数は、1 以上の数にしか定義されていません。0 や負の数を渡されたら、例外を投げて知らせます。

### 2. 桁数から 1 を引く

```java:line-numbers=103
        return Integer.SIZE - Integer.numberOfLeadingZeros(value) - 1;
```

`Integer.SIZE - Integer.numberOfLeadingZeros(value)` は、`value` を 2 進数で書いたときの桁数です。ここから 1 を引くと、底 2 の対数の切り捨てになります。

### 3. 具体的な値で追う

`value = 9`（`0000 … 1001`）で進めます。

- `numberOfLeadingZeros(9) = 28`（上位に 0 が 28 個）。
- 桁数は `32 - 28 = 4`。
- `4 - 1 = 3`。

`2^3 = 8 ≤ 9 < 16 = 2^4` なので、`log2(9)` の切り捨ては `3` で正しいです。

## ここがすごい

- **ループなしで桁数が分かる**: 2 で割りながら数える方法は、桁数の回数だけ割り算が必要です。`numberOfLeadingZeros` は、多くの CPU で 1 命令で済みます。
- **対数の定義とビットの対応**: 「2 進数の桁数 - 1」が、そのまま底 2 の対数の切り捨てになるという関係を、そのまま式にしています。
- **例外で早めに知らせる**: 0 以下の値で誤った答えを返すより、例外で止めた方が、バグの原因を見つけやすくなります。
- **2 のべき乗を扱う基盤**: リングバッファの大きさや、ビットでの位置計算に使う値を、この関数で求められます。Disruptor のような性能重視のライブラリでは、こうした小さな関数の積み重ねが速さを支えています。

## まとめ

- 2 進数の桁数から 1 を引くと、底 2 の対数の切り捨てが得られる。
- `numberOfLeadingZeros` を使えば、ループなしで桁数が分かる。
- 対数が定義されない値は、早めに例外で知らせる。
