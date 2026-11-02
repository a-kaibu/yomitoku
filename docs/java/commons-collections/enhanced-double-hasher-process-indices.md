---
title: "2 つのハッシュから、ずれを増やしながら位置を作る"
description: "Apache Commons Collections の EnhancedDoubleHasher.processIndices。二重ハッシュに 3 次の項（四面体数）を加えた拡張二重ハッシュで、ブルームフィルタのビット位置を、剰余を取らずに符号ビットで折り返して作る。"
language: java
project: Apache Commons Collections
repo: https://github.com/apache/commons-collections
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "9e14d468e850e4175187023557b0735ad9bb19ea"
file: src/main/java/org/apache/commons/collections4/bloomfilter/EnhancedDoubleHasher.java
lines: [158, 210]
function: "EnhancedDoubleHasher.processIndices"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, 数値計算]
---

## ひとことで

`processIndices` は、ブルームフィルタで使うビット位置を、順番に `consumer` へ渡します。1 つの値から、`k` 個のビット位置を作るのが目的です。

基本は二重ハッシュ（`h1 + i * h2`）です。さらにこの実装では、増分そのものを毎回少しずつ変える「拡張」を使い、位置が似た並びに偏らないようにしています。

## コード

::: code-group

```java:line-numbers=158 [日本語訳]
            public boolean processIndices(final IntPredicate consumer) {
                Objects.requireNonNull(consumer, "consumer");
                final int bits = shape.getNumberOfBits();
                // 拡張二重ハッシュ
                // hash[i] = ( h1(x) + i*h2(x) + (i*i*i - i)/6 ) を bits で割った余り
                // 参考: Wikipedia の「Double hashing」の「Enhanced double hashing」
                //
                // これは、開始位置と増分から、折り返した剰余を計算し、さらに四面体数の項を加えている
                // 四面体数の項は、増分に加えられる
                // ループの前に剰余は 2 回だけ取る
                // ループの中では、符号ビットで折り返しを判定する
                // 0 <= index < bits（添字は 0 以上 bits 未満）
                // 0 <= inc < bits（増分は 0 以上 bits 未満）
                // 最終的なハッシュは次のとおり
                // hash[i] = ( h1(x) - i*h2(x) - (i*i*i - i)/6 ) を [0, bits) に折り返したもの

                int index = BitMaps.mod(initial, bits);
                if (!consumer.test(index)) {
                    return false;
                }
                int inc = BitMaps.mod(increment, bits);

                final int k = shape.getNumberOfHashFunctions();

                if (k >= bits) {
                    // 四面体数の増分（tetrahedral incrementer）。この数が bits - 1 を超えないようにしないと、index が bits を超える
                    // （超えると添字が範囲を外れるため）
                    int tet = 1;
                    for (int i = 1; i < k; i++) {
                        // 添字を更新し、折り返しを処理する
                        index -= inc;
                        index = index < 0 ? index + bits : index;
                        if (!consumer.test(index)) {
                            return false;
                        }

                        // カウンタを増分に取り込み、四面体数の追加項を作る。折り返しも処理する
                        // 四面体数の追加項を作る。折り返しも処理する
                        inc -= tet;
                        inc = inc < 0 ? inc + bits : inc;
                        if (++tet == bits) {
                            tet = 0;
                        }
                    }
                } else {
                    for (int i = 1; i < k; i++) {
                        // 添字を更新し、折り返しを処理する
                        index -= inc;
                        index = index < 0 ? index + bits : index;
                        if (!consumer.test(index)) {
                            return false;
                        }

```

```java:line-numbers=158 [原文]
            public boolean processIndices(final IntPredicate consumer) {
                Objects.requireNonNull(consumer, "consumer");
                final int bits = shape.getNumberOfBits();
                // Enhanced double hashing:
                // hash[i] = ( h1(x) + i*h2(x) + (i*i*i - i)/6 ) mod bits
                // See: https://en.wikipedia.org/wiki/Double_hashing#Enhanced_double_hashing
                //
                // Essentially this is computing a wrapped modulus from a start point and an
                // increment and an additional term as a tetrahedral number.
                // You only need two modulus operations before the loop. Within the loop
                // the modulus is handled using the sign bit to detect wrapping to ensure:
                // 0 <= index < bits
                // 0 <= inc < bits
                // The final hash is:
                // hash[i] = ( h1(x) - i*h2(x) - (i*i*i - i)/6 ) wrapped in [0, bits)

                int index = BitMaps.mod(initial, bits);
                if (!consumer.test(index)) {
                    return false;
                }
                int inc = BitMaps.mod(increment, bits);

                final int k = shape.getNumberOfHashFunctions();

                if (k >= bits) {
                    // the tetraheadral incrementer.  We need to ensure that this
                    // number does not exceed bits-1 or we may end up with an index > bits.
                    int tet = 1;
                    for (int i = 1; i < k; i++) {
                        // Update index and handle wrapping
                        index -= inc;
                        index = index < 0 ? index + bits : index;
                        if (!consumer.test(index)) {
                            return false;
                        }

                        // Incorporate the counter into the increment to create a
                        // tetrahedral number additional term, and handle wrapping.
                        inc -= tet;
                        inc = inc < 0 ? inc + bits : inc;
                        if (++tet == bits) {
                            tet = 0;
                        }
                    }
                } else {
                    for (int i = 1; i < k; i++) {
                        // Update index and handle wrapping
                        index -= inc;
                        index = index < 0 ? index + bits : index;
                        if (!consumer.test(index)) {
                            return false;
                        }

```

:::

## 前提知識

- **ブルームフィルタ**: 複数のビットの組で、値の有無を確率的に記録するデータ構造です。
- **二重ハッシュ**: 2 つのハッシュ値 `h1` と `h2` から、`h1 + i * h2` の形で `k` 個の位置を作る方法です。
- **四面体数**: `(i*i*i - i) / 6` の形で増える数列です。増分に加えると、二重ハッシュの位置の並びがさらにずれます。
- **剰余（mod）**: 割った余りです。位置を `0` 以上 `bits` 未満の範囲に収めるために使います。
- **`consumer`**: 位置を 1 つ受け取って、続けるかどうかを `true` / `false` で返す関数です。`false` なら途中で止めます。

## 何をしているか

### 1. 開始位置と増分を、範囲に収める

```java:line-numbers=174
                int index = BitMaps.mod(initial, bits);
                if (!consumer.test(index)) {
                    return false;
                }
                int inc = BitMaps.mod(increment, bits);
```

開始位置 `index` と増分 `inc` を、ビット数で割った余りにします。この余りは、ループの前に一度だけ取ります。以降は、符号ビットで折り返しを判定するので、割り算をしなくて済みます。

### 2. 位置を 1 つずつ進める

```java:line-numbers=187
                        // 添字を更新し、折り返しを処理する
                        index -= inc;
                        index = index < 0 ? index + bits : index;
                        if (!consumer.test(index)) {
                            return false;
```

ループの中で、位置を増分の分だけ減らします。0 より小さくなったら、`bits` を足して範囲に戻します。毎回 `consumer` に渡し、止めるよう言われたら終わります。

### 3. 増分にも四面体数の項を足す

```java:line-numbers=194
                        // カウンタを増分に取り込み、四面体数の追加項を作る。折り返しも処理する
                        // 四面体数の追加項を作る。折り返しも処理する
                        inc -= tet;
                        inc = inc < 0 ? inc + bits : inc;
                        if (++tet == bits) {
                            tet = 0;
                        }
                    }
```

カウンタ `tet` を増分の値から引き、0 より小さくなったら `bits` を足して戻します。`tet` が `bits` に達したら 0 に戻します。これで、増分が位置ごとに変わり、同じ間隔の並びにならないようになります。

## ここがすごい

- **剰余を毎回取らない**: 剰余（`%`）は重い演算です。範囲の外に出たときだけ `+ bits` で戻すので、ループの中に割り算がありません。
- **符号ビットによる折り返し**: 負になったかどうかを見るだけで、範囲に戻せます。分岐はひとつだけで済みます。
- **位置が偏りにくい**: 増分も変わるので、単純な二重ハッシュより、ビット配列の中で位置が均等に散らばります。
- **k が大きいときの注意**: `k >= bits` の場合は、四面体数の増分が範囲を超えないように、別の経路を使っています。境界の扱いを丁寧にしている点がポイントです。

## まとめ

- 二重ハッシュに四面体数の項を加え、増分も位置ごとに変えて、位置の偏りを減らす。
- 剰余は最初の一度だけ取り、ループの中では符号ビットを見て範囲に戻す。
- `consumer` が `false` を返せば途中で止まり、必要な位置だけを作れる。
