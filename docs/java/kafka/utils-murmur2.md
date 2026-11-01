---
title: "4 バイトずつ混ぜて、最後の端数もまとめるハッシュ関数"
description: "Kafka がキーからパーティションを決めるときに使う MurmurHash2 の実装。4 バイトずつ掛け算と XOR で混ぜ、残りの端数を switch の fallthrough で処理する。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/Utils.java
lines: [502, 542]
function: "Utils.murmur2"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 標準ライブラリ]
---

## ひとことで

`Utils.murmur2(data)` は、バイト配列から `int` のハッシュ値を作る関数です。名前は、この方式の作者が作った「MurmurHash2」に由来します。

Kafka では、メッセージのキーからどのパーティション（分割された保存先）に入れるかを決めるときに、この関数の結果を使います。同じキーは必ず同じハッシュ値になるので、同じ保存先に入ります。

## コード

::: code-group

```java:line-numbers=502 [日本語訳]
    @SuppressWarnings("fallthrough")
    public static int murmur2(final byte[] data) {
        int length = data.length;
        int seed = 0x9747b28c;
        // 'm' と 'r' は、あらかじめ計算で決めた混ぜ合わせの定数。
        // 特別な「魔法の数」ではなく、たまたまうまく働く値というだけだ。
        final int m = 0x5bd1e995;
        final int r = 24;

        // ハッシュの初期値を、ある程度ばらけた値にする
        int h = seed ^ length;
        int length4 = length >> 2;

        for (int i = 0; i < length4; i++) {
            final int i4 = i << 2;
            int k = (int) INT_HANDLE.get(data, i4);
            k *= m;
            k ^= k >>> r;
            k *= m;
            h *= m;
            h ^= k;
        }

        // 入力の末尾に残った数バイトを処理する
        int index = length4 << 2;
        switch (length - index) {
            case 3:
                h ^= (data[index + 2] & 0xff) << 16;
            case 2:
                h ^= (data[index + 1] & 0xff) << 8;
            case 1:
                h ^= data[index] & 0xff;
                h *= m;
        }

        h ^= h >>> 13;
        h *= m;
        h ^= h >>> 15;

        return h;
    }
```

```java:line-numbers=502 [原文]
    @SuppressWarnings("fallthrough")
    public static int murmur2(final byte[] data) {
        int length = data.length;
        int seed = 0x9747b28c;
        // 'm' and 'r' are mixing constants generated offline.
        // They're not really 'magic', they just happen to work well.
        final int m = 0x5bd1e995;
        final int r = 24;

        // Initialize the hash to a random value
        int h = seed ^ length;
        int length4 = length >> 2;

        for (int i = 0; i < length4; i++) {
            final int i4 = i << 2;
            int k = (int) INT_HANDLE.get(data, i4);
            k *= m;
            k ^= k >>> r;
            k *= m;
            h *= m;
            h ^= k;
        }

        // Handle the last few bytes of the input array
        int index = length4 << 2;
        switch (length - index) {
            case 3:
                h ^= (data[index + 2] & 0xff) << 16;
            case 2:
                h ^= (data[index + 1] & 0xff) << 8;
            case 1:
                h ^= data[index] & 0xff;
                h *= m;
        }

        h ^= h >>> 13;
        h *= m;
        h ^= h >>> 15;

        return h;
    }
```

:::

## 前提知識

- **ハッシュ値**: データから作る、短い固定長の値です。同じデータからは同じ値が出ます。違うデータからは、なるべく違う値が出るように設計します。
- **`byte[]`**: バイトの配列です。1 バイトは 8 ビットです。
- **リトルエンディアン**: 4 バイトの整数を、下位のバイトから並べる順序です。`INT_HANDLE` は、この順序で 4 バイトを `int` として読みます。
- **掛け算のあふれ**: `int` の掛け算は上位ビットが失われますが、Java ではエラーになりません。ハッシュ計算では、この性質をそのまま使います。
- **`switch` の fallthrough**: `case` の後に `break` がないと、次の `case` の処理も続けて実行されます。

## 何をしているか

### 1. 初期値を作る

```java:line-numbers=505
        int seed = 0x9747b28c;
        // 'm' と 'r' は、あらかじめ計算で決めた混ぜ合わせの定数。
        // 特別な「魔法の数」ではなく、たまたまうまく働く値というだけだ。
        final int m = 0x5bd1e995;
        final int r = 24;

        // ハッシュの初期値を、ある程度ばらけた値にする
        int h = seed ^ length;
```

`seed` と入力の長さを XOR して、初期値 `h` を作ります。長さも混ぜることで、同じ先頭を持つ違う長さの入力が、同じ値になりにくくなります。

### 2. 4 バイトずつ混ぜる

```java:line-numbers=515
        for (int i = 0; i < length4; i++) {
            final int i4 = i << 2;
            int k = (int) INT_HANDLE.get(data, i4);
            k *= m;
            k ^= k >>> r;
            k *= m;
            h *= m;
            h ^= k;
        }
```

入力を 4 バイトずつ読み、その値 `k` を掛け算と XOR で混ぜてから、`h` に混ぜ込みます。`k ^= k >>> r` は、上位ビットを下位に降ろして混ぜる操作です。

### 3. 端数の処理

```java:line-numbers=526
        int index = length4 << 2;
        switch (length - index) {
            case 3:
                h ^= (data[index + 2] & 0xff) << 16;
            case 2:
                h ^= (data[index + 1] & 0xff) << 8;
            case 1:
                h ^= data[index] & 0xff;
                h *= m;
        }
```

4 で割り切れないときの残りは、1 バイトから 3 バイトです。`switch` は、残りの個数に応じて、必要なバイトだけを `h` に混ぜます。`case 3` から始まると、`case 2`、`case 1` と下に落ちていくので、残りのバイトすべてが混ざります。

### 4. 最後の仕上げ

```java:line-numbers=537
        h ^= h >>> 13;
        h *= m;
        h ^= h >>> 15;
```

全体を混ぜるための仕上げです。上位ビットを下位に降ろす XOR と、掛け算を交互に行います。これで、入力のわずかな違いが、結果の全体に広がります。

### 具体的な入力で確かめる

`data` が 5 バイトの場合、`length4 = 1` なので、4 バイトのかたまりが 1 つと、端数が 1 バイトです。

- 1 つめの 4 バイトを `k` にして、`h` に混ぜる。
- 残りの 1 バイトを `h` に XOR して、掛け算。
- 最後に仕上げの混ぜを行う。

どの段階でも、入力の全部のバイトが結果に影響します。

## ここがすごい

- **速さと散らばりの両立**: 1 バイトずつ混ぜるより、4 バイトずつ混ぜる方が速いです。掛け算と右シフトを組み合わせるので、少ない演算で、ハッシュ値が偏りにくくなります。
- **端数を fallthrough で一度に**: 端数の 3 通りを `switch` の下に落ちる形で書くと、同じ処理を 3 回書かずに済みます。意図的な使い方なので、`@SuppressWarnings("fallthrough")` の注釈で、警告を抑えています。
- **定数の出どころ**: コメントに「定数は計算で作られたもので、特別な魔法ではない」と書かれています。作者が選んだ値が、ハッシュの散らばりがよいことを確かめた結果なのです。
- **決まった結果**: 同じバイト列には、いつも同じハッシュ値が出ます。Kafka では、キーから保存先を決めるため、読み書きするどの場所でも同じ計算結果になる必要があります。だから計算方法そのものを固定しておくことが大切です。

## まとめ

- ハッシュ関数は、4 バイトずつ掛け算と XOR で混ぜ、残りの端数を最後にまとめて混ぜる。
- `switch` の fallthrough を使うと、端数の処理を短く書ける。
- 保存先を決めるハッシュは、実行のたびに同じ値が出ることが大切。
