---
title: "要求数を、溢れさせずに CAS で足す"
description: "RxJava の BackpressureHelper.add。購読者の要求数を AtomicLong に CAS で足し、Long.MAX_VALUE で頭打ちにする。上限なしの要求を、溢れずに表す。"
language: java
project: RxJava
repo: https://github.com/ReactiveX/RxJava
license: Apache-2.0
copyright: "Copyright (c) 2016-present, RxJava Contributors."
commit: "b0e8737b956f05cebca961899193c80104c94941"
file: src/main/java/io/reactivex/rxjava4/internal/util/BackpressureHelper.java
lines: [67, 78]
function: "BackpressureHelper.add"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, 数値計算]
---

## ひとことで

`BackpressureHelper.add(requested, n)` は、購読者（データを受け取る側）が「あと n 個ほしい」と伝えた数を、`requested` に足すメソッドです。複数のスレッドから同時に呼ばれても、正しく足せるように作られています。

足した結果が `long` の範囲を超えそうなときは、`Long.MAX_VALUE` で止めます。`Long.MAX_VALUE` は「上限なし」の意味で使われるので、溢れて負の数になるのを防いでいます。

## コード

```java:line-numbers=67
    public static long add(@NonNull AtomicLong requested, long n) {
        for (;;) {
            long r = requested.get();
            if (r == Long.MAX_VALUE) {
                return Long.MAX_VALUE;
            }
            long u = addCap(r, n);
            if (requested.compareAndSet(r, u)) {
                return r;
            }
        }
    }
```

## 前提知識

- **バックプレッシャー**: データを流す側が、受け取る側の処理能力を超えないように、要求された数だけ送る仕組みです。受け取る側は、要求数を `request(n)` で伝えます。
- **`AtomicLong`**: 複数のスレッドから安全に読み書きできる `long` です。`get` で読み、`compareAndSet` で、読んだ値のまま書き換えられたときだけ更新します。
- **CAS（compare-and-set）**: 「今の値が `r` なら `u` に変える」という操作を、1 回の命令で行う仕組みです。失敗したら、やり直します。
- **`Long.MAX_VALUE`**: `long` の最大値です。Reactive Streams では、「上限なし」を表す値として使われます。
- **溢れ**: `long` の最大値を超えて足すと、負の数になってしまいます。

## 何をしているか

### 1. 現在の要求数を読み、上限なら何もしない

```java:line-numbers=68
        for (;;) {
            long r = requested.get();
            if (r == Long.MAX_VALUE) {
                return Long.MAX_VALUE;
            }
```

`requested.get()` で、今の要求数 `r` を読みます。`r` がすでに `Long.MAX_VALUE` なら、上限なしの状態なので、もう足さずにその値を返します。

### 2. 溢れないように足す

```java:line-numbers=73
            long u = addCap(r, n);
```

`addCap` は、`r + n` を計算し、結果が負になったら（溢れたら）`Long.MAX_VALUE` を返します。`addCap` は次のとおりです。

```java:line-numbers=36
    public static long addCap(long aValue, long bValue) {
        long u = aValue + bValue;
        if (u < 0L) {
            return Long.MAX_VALUE;
        }
        return u;
    }
```

### 3. CAS で書き込む

```java:line-numbers=74
            if (requested.compareAndSet(r, u)) {
                return r;
            }
```

`compareAndSet(r, u)` は、読んだときの値が `r` のままなら `u` に書き換えて `true` を返します。途中で他のスレッドが値を変えていたら、`false` を返すので、ループの先頭からやり直します。成功したら、足す前の値 `r` を返します。

## ここがすごい

- **ロックを使わない**: `synchronized` を使わず、CAS の失敗を再試行することで、複数のスレッドの足し算を正しく行います。
- **溢れを防ぐ**: `long` の範囲を超えたら `Long.MAX_VALUE` に止めるので、負の要求数という無効な状態にならないようにしています。
- **上限なしを 1 つの値で表す**: `Long.MAX_VALUE` を「上限なし」と決めることで、要求数の追加と判定を、同じ仕組みで扱えます。
- **戻り値で前の値を返す**: 呼び出し側は、足す前の要求数を知ることができます。これにより、「今まで 0 だったのか」といった判断を、同じ操作の中でできます。

## まとめ

- `add` は、要求数を CAS のループで足し、他のスレッドとの競合を、やり直しで解決する。
- `addCap` によって、溢れた場合は `Long.MAX_VALUE` で止める。
- `Long.MAX_VALUE` は「上限なし」を表し、その後の追加では何もしない。
