---
title: "乱数で「飛び石」を渡り、バケット数が増えても移動を少なくする"
description: "Guava の Hashing.consistentHash。キーを n 個のバケットに割り当てるとき、バケットが 1 つ増えても移動するキーを約 1/(n+1) だけに抑える Jump Consistent Hash。線形合同法の乱数で飛び石を渡る。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/hash/Hashing.java
lines: [654, 671]
function: "Hashing.consistentHash"
difficulty: 3
format: 2
tags: [ハッシュ, アルゴリズム, 数値計算]
---

## ひとことで

`Hashing.consistentHash(input, buckets)` は、`input` というキーを `0` から `buckets - 1` のどれか 1 つのバケット（割り当て先）に振り分けます。同じキーには、同じバケットが返ります。

普通の `input % buckets` では、バケットの数が 1 つ増えるだけで、ほとんどのキーの割り当てが変わってしまいます。この関数は、**バケットが増えたときに、移るキーが約 1/(増えた後の数) だけ** になるように作られています。サーバーの台数を増やすキャッシュなどで役立つ考え方です。

## コード

::: code-group

```java:line-numbers=654 [日本語訳]
  @J2ktIncompatible
  public static int consistentHash(long input, int buckets) {
    checkArgument(buckets > 0, "buckets must be positive: %s", buckets);
    long generatorState = input;
    int candidate = 0;
    int generated;

    // ある範囲を出るまで、バケットからバケットへ飛び移る
    while (true) {
      generatorState = LinearCongruentialGenerator.nextState(generatorState);
      generated = (int) ((candidate + 1) / LinearCongruentialGenerator.toDouble(generatorState));
      if (generated >= 0 && generated < buckets) {
        candidate = generated;
      } else {
        return candidate;
      }
    }
  }
```

```java:line-numbers=654 [原文]
  @J2ktIncompatible
  public static int consistentHash(long input, int buckets) {
    checkArgument(buckets > 0, "buckets must be positive: %s", buckets);
    long generatorState = input;
    int candidate = 0;
    int generated;

    // Jump from bucket to bucket until we go out of range
    while (true) {
      generatorState = LinearCongruentialGenerator.nextState(generatorState);
      generated = (int) ((candidate + 1) / LinearCongruentialGenerator.toDouble(generatorState));
      if (generated >= 0 && generated < buckets) {
        candidate = generated;
      } else {
        return candidate;
      }
    }
  }
```

:::

## 前提知識

- **バケット**: キーを振り分ける先の番号です。ここでは `0` から `buckets - 1` までです。
- **線形合同法（LCG）**: 前の値から次の値を計算する、単純な乱数の作り方です。`state = a * state + c` の形をしています。
- **`long` の掛け算**: 掛け算が 64 ビットを超えると、上位が切り捨てられます。乱数の作り方の一部として、この性質を使っています。
- **`(double)`**: 整数を小数に変換します。割り算を小数で行うために使います。
- **`checkArgument`**: 引数の条件を確かめ、満たさなければ例外を投げる関数です。

## 何をしているか

### 1. 乱数の状態を進める

```java:line-numbers=663
      generatorState = LinearCongruentialGenerator.nextState(generatorState);
```

キーの値を種にして、線形合同法で次の状態を作ります。`nextState` は、掛け算と足し算だけで次の値を出します（同じファイルの次の定義を参照）。

```java:line-numbers=828
    static long nextState(long state) {
      return 2862933555777941757L * state + 1;
    }
```

### 2. 次の飛び先を決める

```java:line-numbers=664
      generated = (int) ((candidate + 1) / LinearCongruentialGenerator.toDouble(generatorState));
```

`toDouble` は、状態を `0` より大きく `1` 以下の小数に変えます。`(candidate + 1) / 乱数` は、現在のバケット番号より大きな数になり、その整数部分が次の候補です。乱数が小さいほど、大きく飛びます。

```java:line-numbers=833
    static double toDouble(long state) {
      return ((double) ((int) (state >>> 33) + 1)) / 0x1.0p31;
    }
```

### 3. 範囲を出たら終わり

```java:line-numbers=665
      if (generated >= 0 && generated < buckets) {
        candidate = generated;
      } else {
        return candidate;
      }
```

候補が `buckets` より小さければ、その番号へ移って繰り返します。範囲を出た時点の `candidate` が答えです。

### 4. 具体的な値で追う

`buckets = 10` のとき、飛び石をたどってみます。

- 最初の候補は `0`（バケット 0 から出発）。
- 乱数に従って、`1` から `9` の間の数に飛ぶ。たとえば `3`。
- さらに飛ぶ。たとえば `7`。
- さらに飛ぶと、`10` 以上になって範囲を出る。答えは `7`。

乱数の種が同じなら、結果はいつも同じになります。

## ここがすごい

- **バケットが増えても、移るキーが少ない**: 1 つのキーを考えると、バケットが `n` 個から `n + 1` 個になったとき、新しいバケット `n` に移る確率は `1/(n+1)` です。残りのキーは、そのまま同じ場所にとどまります。ドキュメントにも、この性質が確率で説明されています。
- **メモリを使わない**: 大きな表や、サーバーの一覧を持たずに、キーの値だけで答えが決まります。計算は乱数の数回分で、すぐ終わります。
- **飛び石の期待回数**: 飛ぶ回数は、バケットの数の対数程度です。大きな数でも、少ない回数で答えに着きます。
- **適用範囲の注意**: ドキュメントには、バケットの番号を任意に消す用途には向かないと書かれています。途中のバケットだけが消えると、残りのキーの割り当てが大きく変わるからです。末尾のバケットを増やしたり減らしたりする用途に限って使えます。

## まとめ

- キーから乱数で飛び石をたどると、バケットが増えても移るキーを少なくできる。
- 余分なデータを持たずに、キーの値だけで割り当てが決まる。
- 適用できる場面（末尾のバケットを増減する）を、設計の前提として確認する。
