---
title: "公開された枠だけを順に読み、読んだ位置を最後にまとめて知らせる"
description: "Caffeine の BoundedBuffer.RingBuffer.drainTo。読み手は head から tail まで枠を読み、null の枠で止まる。読んだ枠は null に戻し、読み終えた位置だけを最後に書き戻す。"
language: java
project: Caffeine
repo: https://github.com/ben-manes/caffeine
license: Apache-2.0
copyright: "Copyright 2015 Ben Manes. All Rights Reserved."
commit: "10646b00c14a7837fe16a16a2a7b1f82e5fa3155"
file: caffeine/src/main/java/com/github/benmanes/caffeine/cache/BoundedBuffer.java
lines: [95, 115]
function: "BoundedBuffer.RingBuffer.drainTo"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

`drainTo` は、`RingBuffer` にたまった要素を、消費者の処理へ順に渡すメソッドです。書き手が `offer` で入れた要素を、読み手がまとめて取り出します。

前の記事の `offer` と組になっています。書き手は枠を取ってから要素を入れ、読み手は入った要素だけを、順番どおりに読みます。

## コード

::: code-group

```java:line-numbers=95 [日本語訳]
    public void drainTo(Consumer<E> consumer) {
      @Var long head = readCounter;
      long tail = writeCounterOpaque();
      long size = (tail - head);
      if (size == 0) {
        return;
      }
      do {
        int index = (int) (head & MASK);
        @SuppressWarnings("unchecked")
        var e = (E) BUFFER.getAcquire(buffer, index);
        if (e == null) {
          //           // まだ公開されていない（書き手が要素を入れ終えていない）
          break;
        }
        BUFFER.setRelease(buffer, index, null);
        consumer.accept(e);
        head++;
      } while (head != tail);
      setReadCounterRelease(head);
    }
```

```java:line-numbers=95 [原文]
    public void drainTo(Consumer<E> consumer) {
      @Var long head = readCounter;
      long tail = writeCounterOpaque();
      long size = (tail - head);
      if (size == 0) {
        return;
      }
      do {
        int index = (int) (head & MASK);
        @SuppressWarnings("unchecked")
        var e = (E) BUFFER.getAcquire(buffer, index);
        if (e == null) {
          // not published yet
          break;
        }
        BUFFER.setRelease(buffer, index, null);
        consumer.accept(e);
        head++;
      } while (head != tail);
      setReadCounterRelease(head);
    }
```

:::

## 前提知識

- **読み手の位置（head）と書き手の位置（tail）**: どちらも増えていく番号です。`tail - head` が、今たまっている要素の数です。
- **公開（publish）**: 書き手が枠に要素を書き終え、読み手から見えるようになることです。ここでは、`null` でない値が、公開された印になります。
- **`getAcquire` と `setRelease`**: 読み書きの順序を保つための、弱めのメモリ操作です。書き手が書いた要素を、読み手が正しい値として見られるようにします。
- **`null` で空きを表す**: 読んだ枠を `null` に戻すと、次に同じ位置へ書く書き手が、その枠を使えます。

## 何をしているか

### 1. 読み手は、head から順に枠を見る

```java:line-numbers=96
      @Var long head = readCounter;
      long tail = writeCounterOpaque();
      long size = (tail - head);
      if (size == 0) {
        return;
      }
```

`tail` を読んで、たまった数（`size`）が 0 なら、何もせずに戻ります。そうでなければ、`head & MASK` の枠から読みます。

### 2. 公開されていれば取り出し、空け直す

```java:line-numbers=102
      do {
        int index = (int) (head & MASK);
        @SuppressWarnings("unchecked")
        var e = (E) BUFFER.getAcquire(buffer, index);
        if (e == null) {
          //           // まだ公開されていない（書き手が要素を入れ終えていない）
          break;
        }
        BUFFER.setRelease(buffer, index, null);
        consumer.accept(e);
        head++;
      } while (head != tail);
```

`getAcquire` で枠の値を読み、`null` なら「まだ公開されていない」として `break` します。値があれば、枠を `null` に戻してから、消費者へ渡し、`head` を 1 進めます。

`head != tail` の間は同じ処理を続けます。ただし、途中で `null` の枠に当たったら、そこで止まります。

### 3. 読んだ位置を最後にまとめて知らせる

```java:line-numbers=114
      setReadCounterRelease(head);
```

読んだ分の `head` は、ループの後で `setReadCounterRelease` によって 1 回だけ書き戻します。書き手は、この `readCounter` を見て、空きを知ります。

## ここがすごい

- **公開されていない枠で止まる**: 書き手が枠を確保したあとで、まだ書いていない枠に当たると、読み手はそこで止まります。途中の枠を飛ばさないので、順序が保たれます。
- **読み取りの位置を 1 回だけ書く**: `readCounter` は、ループの最後に 1 回だけ書きます。ループ中の共有の書き込みを減らし、書き手との衝突を抑えます。
- **空け直しと公開の印を兼ねる**: `null` に戻すことで、その枠が空いたことと、次の書き手が使えることが同時に示されます。
- **まとめて取り出す**: 一度に複数の要素を読めるので、呼び出しの回数や、共有の値へのアクセスを減らせます。

## まとめ

- `drainTo` は、`head` から `tail` まで枠を順に読み、`null` の枠に当たるまで消費者へ渡す。
- 読んだ枠は `null` に戻し、次の書き手が使えるようにする。
- 読み終えた位置を最後に 1 回だけ書き戻し、書き手に空きを知らせる。
