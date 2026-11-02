---
title: "溢れを先に見張りながら、負の方向へ数を積む"
description: "Guava の Longs.tryParse。文字列を long に変換するとき、例外を使わずに失敗を null で返す。負の値で累積し、掛ける前に溢れを確かめて、Long.MIN_VALUE も正しく扱う。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2008 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/primitives/Longs.java
lines: [403, 443]
function: "Longs.tryParse"
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, 防御的プログラミング]
---

## ひとことで

`Longs.tryParse(string, radix)` は、文字列を `long` の数に変換します。変換できないとき（数字以外の文字がある、空である、範囲を超える）は、例外を投げずに `null` を返します。

`Long.parseLong` は失敗すると例外を投げるので、入力が正しいか分からない場面では、例外を使わずに判定できるこの関数が便利です。

## コード

```java:line-numbers=403
  public static @Nullable Long tryParse(String string, int radix) {
    if (checkNotNull(string).isEmpty()) {
      return null;
    }
    if (radix < Character.MIN_RADIX || radix > Character.MAX_RADIX) {
      throw new IllegalArgumentException(
          "radix must be between MIN_RADIX and MAX_RADIX but was " + radix);
    }
    boolean negative = string.charAt(0) == '-';
    int index = negative ? 1 : 0;
    if (index == string.length()) {
      return null;
    }
    int digit = AsciiDigits.digit(string.charAt(index++));
    if (digit < 0 || digit >= radix) {
      return null;
    }
    long accum = -digit;

    long cap = Long.MIN_VALUE / radix;

    while (index < string.length()) {
      digit = AsciiDigits.digit(string.charAt(index++));
      if (digit < 0 || digit >= radix || accum < cap) {
        return null;
      }
      accum *= radix;
      if (accum < Long.MIN_VALUE + digit) {
        return null;
      }
      accum -= digit;
    }

    if (negative) {
      return accum;
    } else if (accum == Long.MIN_VALUE) {
      return null;
    } else {
      return -accum;
    }
  }
```

## 前提知識

- **基数（radix）**: 数の位取りの単位です。10 進数なら 10、16 進数なら 16 です。
- **`long` の範囲**: 約 −9.2 × 10^18 から約 9.2 × 10^18 までです。`Long.MIN_VALUE` は負の方の端で、その絶対値は `Long.MAX_VALUE` より 1 大きいため、正の数で作れません。
- **溢れ（オーバーフロー）**: 計算結果が `long` の範囲を超えて、値が壊れることです。Java は例外を投げず、黙って値を折り返します。
- **`AsciiDigits.digit`**: 文字を、その文字が表す数字に変えます。数字でない文字には負の値を返します。
- **`null` を返す設計**: 「失敗した」という情報を、例外の代わりに戻り値で表します。

## 何をしているか

### 1. 形式を確かめる

```java:line-numbers=404
    if (checkNotNull(string).isEmpty()) {
      return null;
    }
    if (radix < Character.MIN_RADIX || radix > Character.MAX_RADIX) {
      throw new IllegalArgumentException(
          "radix must be between MIN_RADIX and MAX_RADIX but was " + radix);
    }
    boolean negative = string.charAt(0) == '-';
    int index = negative ? 1 : 0;
    if (index == string.length()) {
      return null;
    }
    int digit = AsciiDigits.digit(string.charAt(index++));
    if (digit < 0 || digit >= radix) {
      return null;
    }
```

空の文字列を弾き、基数の範囲を確かめます。先頭が `-` なら負の数として扱い、位置を 1 つずらします。最初の桁が数字でなければ、すぐに `null` を返します。

### 2. 最初の桁は負の値で持つ

```java:line-numbers=420
    long accum = -digit;

    long cap = Long.MIN_VALUE / radix;
```

累積する変数 `accum` を、最初の桁の符号を反転した値で始めます。正の方向へ積むと `Long.MIN_VALUE` を表せないので、負の方向へ積んでいきます。`cap` は、これ以上掛けると溢れてしまう境界です。

### 3. 次の桁を掛けて足す前に確かめる

```java:line-numbers=424
    while (index < string.length()) {
      digit = AsciiDigits.digit(string.charAt(index++));
      if (digit < 0 || digit >= radix || accum < cap) {
        return null;
      }
      accum *= radix;
      if (accum < Long.MIN_VALUE + digit) {
        return null;
      }
      accum -= digit;
    }
```

各桁で、まず数字として正しいかと、`accum < cap` を確かめます。掛けた後にさらに引いても `Long.MIN_VALUE` を超えないかも確かめます。どれかに当たれば、溢れるので `null` を返します。ここでは、溢れてから気づくのではなく、溢れる前に判定しています。

### 4. 符号を戻す

```java:line-numbers=436
    if (negative) {
      return accum;
    } else if (accum == Long.MIN_VALUE) {
      return null;
    } else {
      return -accum;
    }
```

負の数なら、累積した値そのものを返します。正の数の場合は、`accum` が `Long.MIN_VALUE` のときだけ、符号を反転すると溢れるので `null` を返し、それ以外は符号を反転して返します。

## ここがすごい

- **負の方向で積む**: 最小値の絶対値は正の `long` に収まりません。負の方向に積めば、`Long.MIN_VALUE` まで無理なく表せます。
- **溢れを先に見張る**: `cap` という境界を先に計算しておけば、掛ける前に溢れるかどうか判定できます。溢れた後の値を見て判断する必要がありません。
- **例外を使わない**: 失敗を `null` で返すので、入力の検査を、例外処理の中ではなく普通の条件分岐で書けます。
- **符号の最後の特別扱い**: 正の数で `Long.MIN_VALUE` になる入力だけを、丁寧に `null` にしています。境界の値を忘れず扱う、慎重な書き方です。

## まとめ

- 失敗を例外ではなく `null` で返すので、入力の確認がしやすい。
- 数を負の方向に積めば、`Long.MIN_VALUE` も溢れずに表せる。
- 掛ける前に境界 `cap` と比べて、溢れを先に防ぐ。
