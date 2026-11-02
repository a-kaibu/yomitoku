---
title: "参照の数を 2 倍して、最後の 1 ビットで解放済みを示す"
description: "Netty の ReferenceCountUpdater.release0。参照の数を 2 倍した int に保ち、偶数なら生きていて、0 になると奇数の 1 にする。CAS の繰り返しで、解放のたびに数を減らす。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2019 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/ReferenceCountUpdater.java
lines: [121, 135]
function: "ReferenceCountUpdater.release0"
difficulty: 3
format: 2
tags: [並行処理, ビット演算, データ構造]
---

## ひとことで

Netty の `ByteBuf` は、参照の数（リファレンスカウント）を持ちます。数が 0 になると、メモリを返せます。複数のスレッドから同時に解放されても、数が正しく減るように、CAS（比較と交換）で更新します。

`ReferenceCountUpdater` は、その数を 1 つの `int` に詰めて持ちます。偶数なら生きていて、奇数なら解放済みです。`release0` は、解放の処理を行うメソッドです。

このクラスは `@Deprecated` で、代わりに `RefCnt` を使う形へ移行する予定です。仕組みそのものは参考になります。

## コード

```java:line-numbers=121
    private boolean release0(final T instance, final int decrement) {
        int curr, next;
        do {
            curr = getRawRefCnt(instance);
            if (curr == decrement) {
                next = 1;
            } else {
                if (curr < decrement || (curr & 1) == 1) {
                    throwIllegalRefCountOnRelease(decrement, curr);
                }
                next = curr - decrement;
            }
        } while (!casRawRefCnt(instance, curr, next));
        return (next & 1) == 1;
    }
```

## 前提知識

- **リファレンスカウント**: オブジェクトを使っている参照の数です。増えるたびに `retain`、減るたびに `release` を呼びます。
- **CAS（compareAndSet）**: 「今の値が期待どおりなら、新しい値に変える」という 1 回の操作です。失敗したら、読み直して繰り返します。
- **ビットへの詰め込み**: 1 つの `int` の上の 31 ビットで数を表し、最下位のビットを「生死」の印として使う方法です。
- **`>>>` と `<<`**: 数を 2 倍して保存し、読むときは 1 ビット右へずらして戻します。

## 何をしているか

### 1. 解放の数を 2 倍して、CAS で減らす

```java:line-numbers=124
            curr = getRawRefCnt(instance);
            if (curr == decrement) {
                next = 1;
            } else {
                if (curr < decrement || (curr & 1) == 1) {
                    throwIllegalRefCountOnRelease(decrement, curr);
                }
                next = curr - decrement;
            }
        } while (!casRawRefCnt(instance, curr, next));
        return (next & 1) == 1;
```

`release(instance)` は、`release0(instance, 2)` を呼びます。2 は、実際の 1 参照を、2 倍の内部の値で表したものです。

`curr` が `decrement` と等しいとき、つまり最後の 1 参照を解放するときは、`next = 1` にします。`1` は奇数なので、解放済みを表します。そうでなければ、`curr - decrement` で減らします。

`casRawRefCnt` が失敗したら、ほかのスレッドが先に変えているので、もう一度読み直します。

### 2. 偶数か奇数かで、生死を判定する

```java:line-numbers=74
        return (rawCnt & 1) == 0;
```

`isLiveNonVolatile` は、値が偶数なら生きていると判定します。これは `(rawCnt & 1) == 0` の 1 ビットの判定です。

### 3. 内部の値から、実際の数を取り出す

```java:line-numbers=61
    private static int realRefCnt(int rawCnt) {
        return rawCnt >>> 1;
    }
```

`realRefCnt` は、内部の値を 1 ビット右へずらします。内部の値は実際の数の 2 倍なので、ずらすと実際の数に戻ります。

## ここがすごい

- **生死を 1 ビットで表す**: 数の変更と生死の変更が、同じ `int` への 1 回の CAS で行われるので、2 つの情報がずれることがありません。
- **0 になったら奇数へ**: 数が 0 になるとき、値を 1 にします。奇数なので、その後の `retain` や `release` は、解放済みとして判定できます。
- **戻り値で合図する**: `release0` は、最後に `(next & 1) == 1` を返します。これで、呼び出し側は「もう誰も使っていない」と分かります。
- **減らしすぎを防ぐ**: 残りより多く解放しようとすると、`IllegalReferenceCountException` で止めます。

## まとめ

- `release0` は、数を 2 倍した `int` を、CAS の繰り返しで減らす。
- 数が 0 になると値を 1（奇数）にして、解放済みを示す。戻り値で、呼び出し側に「誰も使っていない」を伝える。
- 数と生死を 1 つの `int` にまとめるので、同時に更新しても情報がずれない。
