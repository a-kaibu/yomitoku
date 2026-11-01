---
title: "範囲外の値を端で止める「飽和キャスト」"
description: "long を int に変換するとき、範囲を超えたら例外にせず最大値か最小値に丸める Ints.saturatedCast。回り込みで壊れた値を作らない、安全な変換。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2008 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/primitives/Ints.java
lines: [110, 118]
function: "Ints.saturatedCast"
difficulty: 1
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

Java で `long` を `int` に変換すると、範囲を超えた値は **下位 32 ビットだけが残り、黙って別の数になります**。たとえば `(int) 4294967297L` は `1` です。

`Ints.saturatedCast(value)` は、範囲内なら普通に変換し、範囲を超えていたら **`int` の最大値か最小値に丸めて** 返します。`saturated` は「飽和した」という意味で、音量の上限のように、限界で止まる動きを表します。

## コード

```java:line-numbers=110
  public static int saturatedCast(long value) {
    if (value > Integer.MAX_VALUE) {
      return Integer.MAX_VALUE;
    }
    if (value < Integer.MIN_VALUE) {
      return Integer.MIN_VALUE;
    }
    return (int) value;
  }
```

## 前提知識

- **`int` の範囲**: `Integer.MIN_VALUE`（約 −21 億）から `Integer.MAX_VALUE`（約 21 億）までです。
- **`long` の範囲**: `int` よりずっと広い、64 ビットの整数です。
- **キャスト `(int) x`**: 型を変換する書き方です。範囲外のときは、下位 32 ビットだけを残し、例外は出ません。
- **`if` の連続**: 上限と下限を順番に確かめて、該当するときにだけ `return` します。
- **`Integer.MAX_VALUE` / `Integer.MIN_VALUE`**: `int` で表せる最大と最小の値です。

## 何をしているか

### 1. 上限を超えたら最大値を返す

```java:line-numbers=111
    if (value > Integer.MAX_VALUE) {
      return Integer.MAX_VALUE;
    }
```

`value = 3000000000L`（約 30 億）は `int` の最大値（約 21 億）を超えています。そこで `Integer.MAX_VALUE`、つまり `2147483647` を返します。

### 2. 下限を下回ったら最小値を返す

```java:line-numbers=114
    if (value < Integer.MIN_VALUE) {
      return Integer.MIN_VALUE;
    }
```

`value = -3000000000L` は下限を下回るので、`Integer.MIN_VALUE` を返します。

### 3. 範囲内ならそのまま変換する

```java:line-numbers=117
    return (int) value;
```

`value = 42L` のような範囲内の値は、そのまま `(int)` で変換します。このとき下位 32 ビットがすべて使われ、値は変わりません。

### 比較: 通常のキャストとの違い

| 入力 | `(int) value` | `Ints.saturatedCast(value)` |
| --- | --- | --- |
| `42L` | `42` | `42` |
| `3000000000L` | `-1294967296`（回り込み） | `2147483647` |
| `-3000000000L` | `1294967296`（回り込み） | `-2147483648` |

通常のキャストは、範囲外で **まったく違う値** を返します。これは気づきにくいバグの原因になります。

## ここがすごい

- **回り込みより限界で止まる**: 制限された値（たとえば画面の幅や、バッファの大きさ）では、遠い値が近い値に化けるより、上限で止まる方が自然なことがあります。そうした場面に向いた変換です。
- **例外にしない選択**: `Math.toIntExact` は範囲外で例外を投げます。この関数は例外を投げずに、限界値で答えを作ります。どちらを使うかは「止めるべきか、限界で受け止めるべきか」で決まります。
- **単純な比較だけ**: 2 回の比較と、通常のキャストだけで実装されています。難しい計算を使わず、読めば意味がすぐにわかる書き方です。
- **Guava の命名**: `saturated` という言葉を使い、「通常の変換とは違う」ことを名前で伝えています。

## まとめ

- `long` から `int` への通常のキャストは、範囲外で黙って別の値になる。
- 範囲外を限界値に丸める変換は、回り込みによるバグを防ぐ。
- どちらの変換が正しいかは、「例外で止めるか、限界で受け止めるか」の設計で決まる。
