---
title: "期限までの長さで、階層の時計盤を選ぶ"
description: "Caffeine の TimerWheel.findBucket。期限までの時間に応じて、秒・分・時・日の階層のどの時計盤の、どのバケットに入れるかを、2 のべき乗の幅のシフトとマスクだけで決める。"
language: java
project: Caffeine
repo: https://github.com/ben-manes/caffeine
license: Apache-2.0
copyright: "Copyright 2017 Ben Manes. All Rights Reserved."
commit: "10646b00c14a7837fe16a16a2a7b1f82e5fa3155"
file: caffeine/src/main/java/com/github/benmanes/caffeine/cache/TimerWheel.java
lines: [249, 264]
function: "TimerWheel.findBucket"
difficulty: 3
format: 2
tags: [キャッシュ, データ構造, アルゴリズム]
---

## ひとことで

`TimerWheel.findBucket(time)` は、期限（時刻）を入れる「バケット」を決めます。Caffeine は、キャッシュの要素を期限切れにするために、タイマーの時計盤（タイミングホイール）を使います。この関数は、その時計盤の中から、期限に合う場所を探します。

期限が近ければ細かい時計盤へ、遠ければ粗い時計盤へ入れます。時計盤を階層にしておくと、遠い未来の期限を、一つの大きな盤で保持できます。

## コード

```java:line-numbers=249
  Node<K, V> findBucket(@Var long time) {
    long duration = Math.max(0L, time - nanos);
    if (duration == 0L) {
      time = nanos;
    }

    int length = wheel.length - 1;
    for (int i = 0; i < length; i++) {
      if (duration < SPANS[i + 1]) {
        long ticks = (time >>> SHIFT[i]);
        int index = (int) (ticks & (wheel[i].length - 1));
        return wheel[i][index];
      }
    }
    return wheel[length][0];
  }
```

## 前提知識

- **タイミングホイール**: 時刻を、円形に並んだバケットに振り分けておく仕組みです。時計の文字盤のように、時間が進むとバケットを順に回ります。
- **階層型**: 細かい時計盤（秒）、粗い時計盤（分・時・日）を重ねた構造です。遠い期限は、粗い盤に入ります。
- **`SPANS`**: 各階層の、おおよその時間の長さです。`SPANS[i + 1]` は、階層 `i` が扱える最大の長さの目安です。
- **`SHIFT`**: 時刻をその階層の「刻み（tick）」に変えるための、右シフト量です。2 のべき乗の幅で区切るので、シフトで計算できます。
- **`BUCKETS`**: 各階層のバケットの数です。`64, 64, 32, 4, 1` と決まっています。

## 何をしているか

### 1. 期限までの長さを求める

```java:line-numbers=250
    long duration = Math.max(0L, time - nanos);
    if (duration == 0L) {
      time = nanos;
    }
```

`duration` は、今からの期限までの時間です。過去の期限は 0 にそろえます。0 のときは、期限を今の時刻に置き換えて、現在のバケットに入れます。

### 2. 小さい階層から順に調べる

```java:line-numbers=255
    int length = wheel.length - 1;
    for (int i = 0; i < length; i++) {
      if (duration < SPANS[i + 1]) {
```

`duration` が `SPANS[i + 1]` より小さければ、階層 `i` に入れます。細かい階層から順に判定するので、一番細かく収まる盤が選ばれます。

### 3. 刻みとマスクでバケットを決める

```java:line-numbers=258
        long ticks = (time >>> SHIFT[i]);
        int index = (int) (ticks & (wheel[i].length - 1));
        return wheel[i][index];
```

`time >>> SHIFT[i]` で、その階層の刻みに変換します。`& (wheel[i].length - 1)` で、バケット数の範囲に収めます。バケット数が 2 のべき乗なので、割り算ではなくマスクで余りが得られます。

### 4. どの階層にも収まらなければ最上位

```java:line-numbers=263
    return wheel[length][0];
```

どの階層にも収まらないほど遠い期限は、最上位の階層の先頭のバケットに入ります。

## ここがすごい

- **階層で大きな範囲を少ない場所に**: 秒・分・時・日の 5 段の盤で、数日先までの期限を扱えます。すべての期限を一つの細かい盤に並べるより、メモリがずっと少なくて済みます。
- **シフトとマスクで計算する**: 刻みの計算に割り算を使わず、`SHIFT` と `& (長さ - 1)` だけで、バケットの番号が出ます。2 のべき乗の幅にそろえた設計の利点です。
- **SPANS は 2 のべき乗に丸める**: 各階層の長さを 2 のべき乗にそろえているので、どの階層の刻みもシフトで表せます。
- **期限切れの処理を速く**: バケットに期限がまとめて入るので、期限が来たときに、バケット単位でまとめて処理できます。

## まとめ

- 期限までの時間で、どの階層の盤に入れるかを、小さい階層から順に決める。
- 刻みはシフト、バケットの番号はマスクで求め、割り算を使わない。
- 階層化によって、遠い期限も少ないバケットで保持できる。
