---
title: "黄金比の数 0x61c88647 でハッシュを散らす ThreadLocal"
description: "ThreadLocal は自分のハッシュ値を、作られるたびに 0x61c88647 ずつ足して決める。この不思議な定数は黄金比から作られ、2 のべき乗の表で値を均等に散らす。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/ThreadLocal.java
lines: [93, 114]
function: "ThreadLocal.nextHashCode"
difficulty: 3
tags: [ハッシュ, 数値計算, 並行処理]
---

## ひとことで

`ThreadLocal`（スレッドごとに別々の値を持てる変数）は、内部で専用のハッシュ表を使います。その表で使う **自分のハッシュ値** を、ThreadLocal を作るたびに `0x61c88647` を足していくことで決めています。

`0, 0x61c88647, 0xc3910c8e, …` と並ぶこの値は、一見でたらめですが、**2 のべき乗の大きさの表に入れたとき、ほぼ均等にばらける** という性質を持っています。秘密は、この定数が黄金比から作られていることです。

## コード

```java:line-numbers=93
    private final int threadLocalHashCode = nextHashCode();

    /**
     * The next hash code to be given out. Updated atomically. Starts at
     * zero.
     */
    private static final AtomicInteger nextHashCode =
        new AtomicInteger();

    /**
     * The difference between successively generated hash codes - turns
     * implicit sequential thread-local IDs into near-optimally spread
     * multiplicative hash values for power-of-two-sized tables.
     */
    private static final int HASH_INCREMENT = 0x61c88647;

    /**
     * Returns the next hash code.
     */
    private static int nextHashCode() {
        return nextHashCode.getAndAdd(HASH_INCREMENT);
    }
```

## 前提知識

- **スレッド**: 1 つのプログラムの中で同時に動く処理の流れです。
- **`ThreadLocal`**: 「スレッドごとに別の値を持つ変数」です。同じ `ThreadLocal` を使っても、スレッド A とスレッド B は別々の値を見ます。値は各スレッドが持つ専用のハッシュ表（ThreadLocalMap）に、ThreadLocal 自身をキーとして保存されます。
- **`private final int threadLocalHashCode = nextHashCode();`**: オブジェクトが作られるときに一度だけ `nextHashCode()` を呼んで、その結果を変更できない（`final`）フィールドに入れます。
- **`static`**: クラス全体で 1 つだけ存在する変数です。`nextHashCode` カウンタは全 ThreadLocal で共有されます。
- **`AtomicInteger.getAndAdd`**: 複数のスレッドから同時に呼ばれても安全に「今の値を返して、指定した数を足す」操作です。
- **オーバーフロー**: `int` の足し算は 32 ビットに収まらないと上位があふれ、2^32 で割った余りになります。Java ではエラーにならず、ぐるっと回ります。

## 何をしているか

### 1. 作るたびに定数を足す（93・112〜114 行目）

ThreadLocal を作ると `nextHashCode()` が呼ばれ、カウンタの今の値をもらい、カウンタは `0x61c88647` 増えます。`int` はあふれても回り続けるので、値は 32 ビットの範囲を何周もします。

### 2. 表の位置は下位ビットで決まる

ThreadLocalMap の表の長さは 2 のべき乗で、位置は `hash & (長さ - 1)` です。長さ 16 なら下位 4 ビットを使います。

`0x61c88647` の倍数の下位 4 ビットを順に見てみます。

```
0 × k → 0
1 × k → 7
2 × k → 14
3 × k → 5
4 × k → 12
5 × k → 3
…
```

`0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9` と、16 回で **0〜15 の全部の箱を 1 回ずつ** 埋めます。しかも次の値が前の値から離れた場所に来るので、近くに固まりません。

### 3. 定数の正体

黄金比 φ ≈ 1.618 について、`2^32 × (φ - 1)` ≈ `2654435769` = `0x9E3779B9` です。`0x61c88647` は、これを 32 ビットの世界で符号反転した値（`2^32 - 0x9E3779B9`）にあたります。足す向きが逆なだけで、散らばり方の性質は同じです。

黄金比は「どんな分数でも近似しにくい数」として知られていて、その倍数の小数部分は、いつ途中で止めても区間をほぼ均等に埋めるという性質があります（三距離定理などで説明されます）。整数の世界では、これが「下位ビットが均等に散らばる」として現れます。

## ここがすごい

- **連番を賢いハッシュに変える**: ThreadLocal は多くの場合、続けて作られ、同じスレッドで一緒に使われます。単純な連番 `0, 1, 2…` でもぶつかりませんが、ThreadLocalMap は衝突したら次の箱を調べる「線形探索法」を使うので、隣り合う箱が埋まっていると探索が長くなります。黄金比の倍数なら、近い番号の ThreadLocal が表の中で遠くに散るので、探索が短く済みます。
- **表の大きさが変わっても効く**: 表が 16 でも 1024 でも、2 のべき乗なら同じ性質が成り立ちます。表を広げたあとも、ハッシュ値を作り直す必要がありません。
- **乗算ハッシュを足し算で**: 「ID × 黄金比の定数」で散らす方法はフィボナッチハッシュ（乗算ハッシュ）と呼ばれます。ここでは ID を明示的に持たず、定数を足し続けることで、掛け算すら使わずに同じ値を作っています。

## まとめ

- 黄金比から作った定数を足し続けると、2 のべき乗の表でも値が均等に散らばる。
- `int` のオーバーフローは Java では「回り込み」なので、ハッシュ計算の道具として使える。
- 使われ方（続けて作られ、一緒に使われる）に合わせてハッシュ関数を設計すると、衝突を大きく減らせる。
