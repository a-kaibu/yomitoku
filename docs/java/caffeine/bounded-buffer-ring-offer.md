---
title: "読み書きの番号を CAS で進め、ロックなしの円形バッファに入れる"
description: "Caffeine の BoundedBuffer.RingBuffer.offer。書き込みの番号を CAS で 1 増やして枠を確保し、番号を 16 のマスクで円形の添字にして要素を入れる。満杯や CAS の失敗を戻り値で返す。"
language: java
project: Caffeine
repo: https://github.com/ben-manes/caffeine
license: Apache-2.0
copyright: "Copyright 2015 Ben Manes. All Rights Reserved."
commit: "10646b00c14a7837fe16a16a2a7b1f82e5fa3155"
file: caffeine/src/main/java/com/github/benmanes/caffeine/cache/BoundedBuffer.java
lines: [78, 91]
function: "BoundedBuffer.RingBuffer.offer"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

Caffeine は、キャッシュの読み出しの記録を、一時的なバッファにためてから、まとめて処理します。このバッファは、ロックを使わない、固定長の円形バッファです。

`RingBuffer.offer` は、要素を 1 つ入れるメソッドです。入れる前に、満杯かどうかを確かめ、CAS で書き込みの番号を 1 増やして、枠を確保します。

## コード

```java:line-numbers=78
    public int offer(E e) {
      long head = readCounter;
      long tail = writeCounterOpaque();
      long size = (tail - head);
      if (size >= BUFFER_SIZE) {
        return Buffer.FULL;
      }
      if (casWriteCounter(tail, tail + 1)) {
        int index = (int) (tail & MASK);
        BUFFER.setRelease(buffer, index, e);
        return ((size + 1) >= BUFFER_SIZE) ? Buffer.FULL : Buffer.SUCCESS;
      }
      return Buffer.FAILED;
    }
```

## 前提知識

- **読み書きの番号（カウンタ）**: `readCounter` と `writeCounter` は、どちらも増えていく `long` の値です。書き込まれた数と、読まれた数を表します。
- **円形の添字**: 番号を `BUFFER_SIZE - 1` のマスクで取ると、配列の中の位置になります。`BUFFER_SIZE` が 2 の累乗なので、割り算なしで求められます。ここでは `BUFFER_SIZE = 16` です。
- **CAS（compareAndSet）**: 書き込みの番号が、読んだ値のままであれば 1 増やす、1 回の操作です。ほかのスレッドが先に進めていれば失敗します。
- **`Buffer.FULL` / `FAILED` / `SUCCESS`**: 戻り値の意味です。`FULL` は満杯、`FAILED` は CAS が負けたこと、`SUCCESS` は入ったことを表します。

## 何をしているか

### 1. 満杯かを確かめる

```java:line-numbers=79
      long head = readCounter;
      long tail = writeCounterOpaque();
      long size = (tail - head);
      if (size >= BUFFER_SIZE) {
        return Buffer.FULL;
      }
```

`size = tail - head` は、今たまっている要素の数です。16 以上なら、もう入りません。そのとき `Buffer.FULL` を返します。

### 2. CAS で枠を確保して、要素を入れる

```java:line-numbers=85
      if (casWriteCounter(tail, tail + 1)) {
        int index = (int) (tail & MASK);
        BUFFER.setRelease(buffer, index, e);
        return ((size + 1) >= BUFFER_SIZE) ? Buffer.FULL : Buffer.SUCCESS;
      }
      return Buffer.FAILED;
```

`casWriteCounter(tail, tail + 1)` が成功したら、この書き込みが番号 `tail` の枠を取ったことになります。`tail & MASK` の位置に、`setRelease` で要素を書きます。

書いたあとで、入れた数が満杯の直前まで来ていれば `FULL` を返します。呼び出し側は、この合図で、たまった要素の読み出しを促せます。CAS が負けたときは `FAILED` を返します。

## ここがすごい

- **ロックがない**: 枠の確保は、書き込みの番号への CAS だけで行います。待ち行列やロックで止まりません。
- **差の計算が桁あふれに強い**: `tail - head` は、`long` の補数の計算なので、番号が非常に大きくなって溢れても、差は正しく求まります。
- **マスクで円形にする**: 番号は増え続けますが、`& MASK` で配列の中の位置に戻ります。2 の累乗の長さなので、割り算がいりません。
- **満杯の合図を返す**: 書き込みの後に満杯になったことを `FULL` で知らせるので、呼び出し側は、読み出しの処理を早めに始められます。

## まとめ

- `offer` は、満杯なら `FULL` を返し、そうでなければ書き込みの番号を CAS で 1 増やして枠を取る。
- 取った枠（`tail & MASK`）に要素を書き、満杯の直前なら `FULL`、成功なら `SUCCESS` を返す。
- 番号の差と 2 の累乗のマスクで、ロックなしの円形バッファを実現している。
