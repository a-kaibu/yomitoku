---
title: "31 を掛けながら足す、配列のハッシュ値"
description: "Java 標準の Arrays.hashCode(long[])。要素ごとに 31 を掛けて足していくことで、並び順まで含めたハッシュ値を作る。null の扱いにも注目する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Arrays.java
lines: [4343, 4352]
function: "Arrays.hashCode(long[])"
difficulty: 1
format: 2
tags: [ハッシュ, イディオム, 標準ライブラリ]
---

## ひとことで

`Arrays.hashCode(long[] a)` は、`long` の配列から 1 つの `int` のハッシュ値を作ります。同じ要素が同じ順番で並んでいれば、必ず同じ値になります。`HashMap` のキーに配列を使うときなど、中身で比べたいときに役立ちます。

配列の中身が同じでも、順番が違えば値が変わるのがポイントです。`{1, 2}` と `{2, 1}` は、別のハッシュ値になります。

## コード

```java:line-numbers=4343
    public static int hashCode(long[] a) {
        if (a == null) {
            return 0;
        }
        int result = 1;
        for (long element : a) {
            result = 31 * result + Long.hashCode(element);
        }
        return result;
    }
```

## 前提知識

- **ハッシュ値**: データから作る短い整数です。同じデータからは同じ値が出ます。`HashMap` などはこの値を使って格納場所を決めます。
- **`long`**: 64 ビットの整数型です。`int` より大きな値を持てます。
- **`Long.hashCode(element)`**: `long` 1 つを `int` に縮めたハッシュ値を返します。上位 32 ビットと下位 32 ビットを XOR しています。
- **`null`**: 値がないことを表します。`null` の配列は、ここでは例外ではなく 0 として扱われます。
- **`int` の桁あふれ**: `int` の計算は 32 ビットに収まるように、上位の桁が切り捨てられます。この関数はそれを前提に書かれています。

## 何をしているか

### 1. null なら 0 を返す

```java:line-numbers=4344
        if (a == null) {
            return 0;
        }
```

配列が `null` のときは、0 を返します。`null` を例外にせず、ハッシュ値として扱える値にしています。

### 2. 初期値を 1 にする

```java:line-numbers=4347
        int result = 1;
```

`result` を 1 で始めます。0 から始めると、要素がすべて 0 の配列と、空の配列が同じ値になってしまうため、1 を使っています。

### 3. 要素を順に混ぜる

```java:line-numbers=4348
        for (long element : a) {
            result = 31 * result + Long.hashCode(element);
        }
```

各要素を `Long.hashCode` で `int` にしてから、`31 * result` に足していきます。31 は素数で、掛け算すると前の値が上位へずれていきます。そのため、要素の順番が違えば、結果も違うものになります。

## ここがすごい

- **順番に意味を持たせる**: 単純な足し算だと、`{1, 2}` と `{2, 1}` は同じ値になります。`31 * result` を挟むと、先に入った要素ほど大きく影響するので、順番が区別されます。
- **31 という数の理由**: 31 は `2^5 - 1` で、`31 * x` は `(x << 5) - x` と書けます。2 の 5 乗から 1 を引いた数です。
- **`List.hashCode` と同じ形**: `java.util.List` の `hashCode` も、同じ 31 倍の式で書かれています。配列とリストで同じ中身なら、同じハッシュ値になるように揃えてあります。
- **null を安全に扱う**: 呼び出し側が `null` を気にしなくても、0 が返るだけで例外は起きません。

## まとめ

- 配列のハッシュは、要素ごとに 31 を掛けて足して作る。
- 初期値を 1 にすると、空の配列と全部 0 の配列を区別できる。
- 順番を含めたハッシュ値になるので、`List` と値を揃えられる。
