---
title: "1 行のシフトで「以上の最小の 2 のべき乗」を作る"
description: "Guava の IntMath.ceilingPowerOfTwo。先頭の 0 の数に負号をつけてシフト量にすると、ループなしで x 以上の最小の 2 のべき乗が作れる。シフト量が 0〜31 に丸められる Java の性質を利用した書き方。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/math/IntMath.java
lines: [63, 69]
function: "IntMath.ceilingPowerOfTwo"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, ハック]
---

## ひとことで

`IntMath.ceilingPowerOfTwo(x)` は、`x` 以上で最小の 2 のべき乗を返します。たとえば `5` なら `8`、`8` なら `8`、`1` なら `1` です。

ループで `1, 2, 4, 8…` と探すこともできますが、この実装は **`numberOfLeadingZeros` の結果を使って 1 つのシフトで答えを作ります**。

## コード

```java:line-numbers=63
  public static int ceilingPowerOfTwo(int x) {
    checkPositive("x", x);
    if (x > MAX_SIGNED_POWER_OF_TWO) {
      throw new ArithmeticException("ceilingPowerOfTwo(" + x + ") not representable as an int");
    }
    return 1 << -Integer.numberOfLeadingZeros(x - 1);
  }
```

上限の `MAX_SIGNED_POWER_OF_TWO` は、同じファイルで次のように定義されています。

```java:line-numbers=52
  @VisibleForTesting static final int MAX_SIGNED_POWER_OF_TWO = 1 << (Integer.SIZE - 2);
```

## 前提知識

- **2 のべき乗**: 1, 2, 4, 8, 16… のように 2 を何回か掛けた数です。2 進数では `1` が 1 つだけ立った形です。
- **`Integer.numberOfLeadingZeros(x)`**: `x` の上位（左）から 0 が何個続くかを返します。`4`（`100`）なら `29` です。
- **`1 << k`**: `1` を `k` ビット左にずらすと `2^k` になります。
- **`-` の符号をつける**: `-29` のように負の数をシフト量に使うと、Java ではどうなるかが重要なポイントになります（後で説明します）。
- **`checkPositive`**: 引数が 1 以上であることを確かめる関数です。

## 何をしているか

### 1. 大きすぎる値を弾く

```java:line-numbers=65
    if (x > MAX_SIGNED_POWER_OF_TWO) {
      throw new ArithmeticException("ceilingPowerOfTwo(" + x + ") not representable as an int");
    }
```

`int` で表せる最大の 2 のべき乗は `2^30` です。それより大きい `x` は答えが `int` に収まらないので、例外を投げます。

### 2. `x - 1` の桁数から答えを作る

```java:line-numbers=68
    return 1 << -Integer.numberOfLeadingZeros(x - 1);
```

ここが中心です。`x - 1` より大きい最小の 2 のべき乗が答えになります。たとえば `x = 5` で追います。

- `x - 1 = 4`（`100`）。上位の 0 は `29` 個です。
- `-29` をシフト量にして `1 << -29` を計算します。

### 3. 負のシフト量の扱い

Java では、シフト量は **下位 5 ビットだけ** が使われ、0〜31 に丸められます。`-29` を 5 ビットで見ると `00011`（`3`）です。したがって `1 << -29` は `1 << 3 = 8` と同じになります。

これが答えです。`5` 以上で最小の 2 のべき乗は `8` です。

### 4. 具体的な値で確かめる

| `x` | `x - 1` | 上位の 0 の数 | シフト量（5 ビット） | 結果 |
| --- | --- | --- | --- | --- |
| `1` | `0` | `32` | `0` | `1` |
| `5` | `4`（`100`） | `29` | `3` | `8` |
| `8` | `7`（`111`） | `29` | `3` | `8` |
| `9` | `8`（`1000`） | `28` | `4` | `16` |

`x = 8` のとき `x - 1 = 7` で、`8` を返すのが正しいです。`x - 1` を使うことで、ちょうど 2 のべき乗の値が正しく「そのまま」になります。

## ここがすごい

- **ループなし**: 2 のべき乗を 1 つずつ探す方法は、最大 31 回の比較です。この実装は、`numberOfLeadingZeros` と 1 回のシフトで済みます。
- **`x - 1` の一手間**: `x` がすでに 2 のべき乗（例: 8）のとき、そのまま桁数を数えると、答えが 2 倍になってしまいます。`x - 1` にしておけば、`8` は `7` になり、正しく `8` が返ります。
- **シフトの丸めを利用**: 負のシフト量を使うのは一見危険ですが、Java の仕様（下位 5 ビットだけ使う）が、ちょうど正しい値になるように働いています。ただし、この性質を知らないと読みにくいので、コメントや仕様の理解が必要です。
- **`x = 1` の特別な扱い**: `x - 1 = 0` のとき、`numberOfLeadingZeros(0)` は `32` で、`-32` は `0` 位のシフトになります。`1 << 0 = 1` で、ここでも正しく動きます。

## まとめ

- 2 のべき乗の切り上げは、`x - 1` の先頭の 0 の数から 1 回のシフトで求められる。
- Java のシフト量は下位 5 ビットだけ使われるので、負の値も意図どおりに丸められる。
- `x - 1` にするのは、ちょうど 2 のべき乗の入力を正しく扱うため。
