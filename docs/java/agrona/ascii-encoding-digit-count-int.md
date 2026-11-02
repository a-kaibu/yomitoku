---
title: "整数の桁数を、表への 1 回の足し算で求める"
description: "Agrona の AsciiEncoding.digitCount(int)。2 進の桁数で表を引き、表の下位 32 ビットに入れた 10 の累乗との繰り上がりで、10 進の桁数を 1 回の加算で得る。"
language: java
project: Agrona
repo: https://github.com/real-logic/agrona
license: Apache-2.0
copyright: "Copyright 2014-2025 Real Logic Limited."
commit: "4e576b8628ee8d5516c7352eae95720263b4dc59"
file: agrona/src/main/java/org/agrona/AsciiEncoding.java
lines: [210, 213]
function: "AsciiEncoding.digitCount"
difficulty: 3
format: 2
tags: [数値計算, 文字列処理, 最適化]
---

## ひとことで

`digitCount(value)` は、整数 `value` を 10 進数の文字列にしたときの桁数を返します。たとえば `12345` なら 5、`9` なら 1 を返します。

ふつうは、`String.valueOf(value).length()` のように文字列にしてから数えます。ところが、`AsciiEncoding` のこのメソッドは、文字列を作らずに、ビットの数と表を使って桁数を求めます。ログメッセージなどで、大量の整数を文字に変換するときに役立ちます。

## コード

```java:line-numbers=210
    public static int digitCount(final int value)
    {
        return (int)((value + INT_DIGITS[31 - Integer.numberOfLeadingZeros(value | 1)]) >> 32);
    }
```

## 前提知識

- **2 進の桁数**: `value` の 2 進表記の長さです。`31 - Integer.numberOfLeadingZeros(value | 1)` で求められます。これは、`value` の最上位 1 ビットの位置（`floor(log2(value))`）に当たります。
- **10 進の桁数**: `10^k` 以上の値は、少なくとも `k + 1` 桁です。桁数は、どの `10^k` を超えたかで決まります。
- **`INT_DIGITS` の表**: 2 進の桁数ごとに 1 つの `long` を持つ表です。上位 32 ビットに基準の桁数を、下位 32 ビットに判定用の値を入れています。
- **`value | 1`**: 0 のときに `numberOfLeadingZeros` が 32 になってしまうのを避けるために、最下位ビットを 1 にします。0 は 1 桁なので、同じ扱いになります。
- **`>> 32`**: 上位 32 ビットを取り出す操作です。

## 何をしているか

### 1. 表を作る（準備）

```java:line-numbers=117
    private static final long[] INT_DIGITS = new long[32];
```

`INT_DIGITS` は、2 進の桁数ごとに 1 つの `long` を持つ表です。

```java:line-numbers=121
    static
    {
        for (int i = 1; i < 33; i++)
        {
            final int smallest = 1 << (i - 1);
            final long smallestLog10 = (long)Math.ceil(Math.log10(smallest) / Math.log10(10));
            if (1 == i)
            {
                INT_DIGITS[i - 1] = 1L << 32;
            }
            else if (i < 31)
            {
                INT_DIGITS[i - 1] = (1L << 32) - LONG_POW_10[(int)smallestLog10] + (smallestLog10 << 32);
            }
            else
            {
                INT_DIGITS[i - 1] = smallestLog10 << 32;
            }
        }
```

各要素には、その 2 進の桁数の最小の値 `2^(i-1)` の 10 進の桁数（`smallestLog10`）が、上位 32 ビットに入ります。下位 32 ビットには、`2^32 - 10^smallestLog10` が入ります。この値を足すと、`value` が `10^smallestLog10` 以上のときだけ、下位 32 ビットが `2^32` を超えて、上位へ繰り上がります。繰り上がった分の 1 が、桁数を 1 つ増やします。

### 2. 表を引いて、足して、上を取る

```java:line-numbers=210
    public static int digitCount(final int value)
    {
        return (int)((value + INT_DIGITS[31 - Integer.numberOfLeadingZeros(value | 1)]) >> 32);
```

`31 - Integer.numberOfLeadingZeros(value | 1)` で、2 進の桁数に対応する表の位置を求めます。`value` をその表の値に足して `>> 32` を取ると、基準の桁数に、繰り上がりの 1 があれば 1 を足した値が出ます。これが 10 進の桁数です。

## ここがすごい

- **文字列を作らない**: `String` や配列を作らず、2 回の表の参照のような計算だけで答えを出します。割り当てもありません。
- **比較をまとめて 1 回の加算にする**: 「10 の何乗を超えたか」の判定を、個別の `if` で行う代わりに、下位ビットの繰り上がりで行います。
- **表は起動時に 1 回だけ作る**: 表は `static` ブロックで作られるので、呼び出しの度に 10 の累乗を計算しません。
- **`long` 版も同じ考え方**: `digitCount(long)` は、表を 64 要素に広げ、2 進の桁数の計算に `63 ^ Long.numberOfLeadingZeros` を使っています。

## まとめ

- `digitCount(int)` は、`value` の 2 進の桁数で表を引き、表の値を足して上位 32 ビットを取る。
- 表は、10 の累乗を超えたときだけ繰り上がるように、下位 32 ビットに `2^32 - 10^k` を入れている。
- 文字列を作らず、ビット演算と 1 回の加算で、10 進の桁数が求まる。
