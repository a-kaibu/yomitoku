---
title: "割り算の丸め方向を、符号のビットから 1 か -1 で決める"
description: "Guava の IntMath.divide。Java の割り算は 0 へ丸めるので、丸め方の指定に合わせて切り上げるかを、p と q の符号の XOR から作った signum で判定する。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [313, 332]
function: "IntMath.divide"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

整数の割り算 `p / q` は、余りを捨てて 0 の方向へ丸めます。たとえば `7 / 2` は `3`、`-7 / 2` は `-3` になります。

Guava の `IntMath.divide` は、丸め方を指定できるメソッドです。切り捨て、切り上げ、四捨五入などを、同じ関数で扱います。その判定に、`p` と `q` の符号の情報を使います。

## コード

::: code-group

```java:line-numbers=313 [日本語訳]
  public static int divide(int p, int q, RoundingMode mode) {
    checkNotNull(mode);
    if (q == 0) {
      throw new ArithmeticException("/ by zero"); //       throw new ArithmeticException("/ by zero"); // GWT 向けの記述（ゼロ除算の例外）
    }
    int div = p / q;
    int rem = p - q * div; //     int rem = p - q * div; // p % q に等しい

    if (rem == 0) {
      return div;
    }

    /*     /*
     *      * 通常の Java の割り算は 0 に向かって丸める。RoundingMode.DOWN と一致する。
     *      * 0 への丸めが誤りになるのは、主に p / q の符号に依存する場合で、その場合だけ扱う。
     *      * つまり、問題になるのは p / q の符号のとき。
     *      *
     *      * signum は、p と q が両方とも 0 以上か両方とも負なら 1、そうでなければ -1。
     *      */
    int signum = 1 | ((p ^ q) >> (Integer.SIZE - 1));
```

```java:line-numbers=313 [原文]
  public static int divide(int p, int q, RoundingMode mode) {
    checkNotNull(mode);
    if (q == 0) {
      throw new ArithmeticException("/ by zero"); // for GWT
    }
    int div = p / q;
    int rem = p - q * div; // equal to p % q

    if (rem == 0) {
      return div;
    }

    /*
     * Normal Java division rounds towards 0, consistently with RoundingMode.DOWN. We just have to
     * deal with the cases where rounding towards 0 is wrong, which typically depends on the sign of
     * p / q.
     *
     * signum is 1 if p and q are both nonnegative or both negative, and -1 otherwise.
     */
    int signum = 1 | ((p ^ q) >> (Integer.SIZE - 1));
```

:::

## 前提知識

- **RoundingMode**: 丸め方を表す列挙型です。`DOWN`（0 の方向）、`UP`（0 から遠ざかる方向）、`FLOOR`（小さい方）、`CEILING`（大きい方）などがあります。
- **XOR（`^`）と符号**: 2 つの数の最上位ビット（符号ビット）が同じなら、XOR の最上位は 0 になります。違えば 1 です。
- **算術右シフト（`>>`）**: 負の数を右へずらすと、空いた上のビットは 1 で埋められます。`>> 31` を使うと、負なら `-1`、0 以上なら `0` になります。
- **剰余（`%`）**: 割り切れなかったときの余りです。Java では、余りの符号は割られる数（`p`）と同じになります。

## 何をしているか

### 1. 商と余りを求める

```java:line-numbers=318
    int div = p / q;
    int rem = p - q * div; //     int rem = p - q * div; // p % q に等しい
```

`div` は、0 へ丸めた商です。`rem` は `p - q * div` で求めた余りです。余りが 0 なら、割り切れているので、そのまま `div` を返します。

### 2. 符号で「増やすか」を決める

```java:line-numbers=332
    int signum = 1 | ((p ^ q) >> (Integer.SIZE - 1));
```

`(p ^ q) >> 31` は、`p` と `q` の符号が違うときは `-1`、同じときは `0` になります。`1 |` を掛けると、同じ符号なら `1`、違う符号なら `-1` が残ります。これが `signum` で、0 から遠ざかる向きを表します。

### 3. 丸め方ごとに判定する

```java:line-numbers=344
      case CEILING:
        increment = signum > 0;
        break;
      case FLOOR:
        increment = signum < 0;
        break;
```

`CEILING` は、`signum` が正のとき、0 から遠ざかる側へ 1 増やします。`FLOOR` は、`signum` が負のとき、1 減らすように判定しています。

最後に `increment ? div + signum : div` で、必要なら `signum` を足します。

例として `-7 / 2` は、`div = -3`、`rem = -1`、`signum = -1` です。`FLOOR` では `increment` が真になり、`-3 + -1 = -4` になります。これは、小さい方への丸めの結果です。

## ここがすごい

- **分岐を減らす**: 符号の判定を、XOR とシフトで 1 行にまとめています。`if` で符号を比べるより、短く書けます。
- **同じ式で増減を両方扱う**: `div + signum` だけで、0 から遠ざかる向きへ 1 動かせます。正負に関係なく、同じ式が使えます。
- **割り切れたら戻る**: 余りが 0 のときは、丸めの判定が不要なので、最初に返します。
- **割り算は 1 回だけ**: 商と余りを 1 回の割り算で求め、丸めの補正は足し算 1 回で済ませます。

## まとめ

- Java の割り算は 0 へ丸めるので、丸め方が違うときだけ 1 を足す。
- `signum` は `1 | ((p ^ q) >> 31)` で、符号が同じなら 1、違えば -1 になる。
- 切り上げと切り捨ては、`signum` の正負を見て、`div + signum` で 1 だけ動かす。
