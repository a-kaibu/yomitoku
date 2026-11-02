---
title: "IPv4 の区切りを、数に直さずに 0 から 255 か判定する"
description: "Netty の NetUtil.isValidIpV4Word。IPv4 アドレスの 1 区切りを、整数に変換せずに、文字の比較だけで 0 から 255 の範囲か判定する。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/NetUtil.java
lines: [574, 587]
function: "NetUtil.isValidIpV4Word"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 数値計算]
---

## ひとことで

IPv4 のアドレスは、`192.168.0.1` のように、0 から 255 までの数 4 つを `.` で区切った形です。Netty は、文字列がこの形かを確かめるために、`NetUtil` で判定を行います。

`isValidIpV4Word` は、その 1 区切りの部分（たとえば `168`）が、0 から 255 の範囲に入るかを判定します。文字列を `int` に変換せず、文字を 1 つずつ比べて答えを出します。

## コード

```java:line-numbers=574
    private static boolean isValidIpV4Word(CharSequence word, int from, int toExclusive) {
        int len = toExclusive - from;
        char c0, c1, c2;
        if (len < 1 || len > 3 || (c0 = word.charAt(from)) < '0') {
            return false;
        }
        if (len == 3) {
            return (c1 = word.charAt(from + 1)) >= '0' &&
                   (c2 = word.charAt(from + 2)) >= '0' &&
                   (c0 <= '1' && c1 <= '9' && c2 <= '9' ||
                    c0 == '2' && c1 <= '5' && (c2 <= '5' || c1 < '5' && c2 <= '9'));
        }
        return c0 <= '9' && (len == 1 || isValidNumericChar(word.charAt(from + 1)));
    }
```

## 前提知識

- **IPv4 の区切り（オクテット）**: 4 つの区切りのそれぞれが、0 から 255 の 1 バイトの値です。
- **文字の比較**: `char` は、`'0'` から `'9'` までが連続した番号になっています。`c >= '0'` や `c <= '9'` で、数字かどうかと大小を調べられます。
- **`len`**: 区切りの文字数です。ここでは 1 から 3 のときだけ、正しい可能性があります。

## 何をしているか

### 1. 長さと先頭の文字を確かめる

```java:line-numbers=577
        if (len < 1 || len > 3 || (c0 = word.charAt(from)) < '0') {
            return false;
        }
```

長さが 1 から 3 の範囲にあり、先頭の文字が `'0'` 以上であることを確かめます。どちらか外れていれば、すぐに `false` を返します。

### 2. 3 文字の区切りは、百の位で場合分けする

```java:line-numbers=580
        if (len == 3) {
            return (c1 = word.charAt(from + 1)) >= '0' &&
                   (c2 = word.charAt(from + 2)) >= '0' &&
                   (c0 <= '1' && c1 <= '9' && c2 <= '9' ||
                    c0 == '2' && c1 <= '5' && (c2 <= '5' || c1 < '5' && c2 <= '9'));
        }
```

3 文字のときは、2 文字目と 3 文字目も数字であることを確かめます。そのうえで、百の位（先頭）が 0 か 1 なら残りは `'9'` 以下で範囲に入ります。百の位が 2 なら、十の位が 5 以下で、その次が 5 以下（25 まで）か、十の位が 4 以下（24 まで）なら、残りは 9 以下で入ります。

### 3. 1 文字と 2 文字は、そのまま確かめる

```java:line-numbers=586
        return c0 <= '9' && (len == 1 || isValidNumericChar(word.charAt(from + 1)));
```

先頭が 9 以下で、2 文字目があるなら数字かを確かめます。これで 0 から 99 が範囲に入ります。

## ここがすごい

- **変換の手間がない**: 文字列を `Integer.parseInt` で数に変えてから範囲を比べる方法と違い、途中の数を作りません。
- **比較の順番で範囲が決まる**: 百の位、十の位、一の位の比較を組み合わせるだけで、0 から 255 の境界が正しく表せます。
- **前の区切りとの結びつき**: 上位の判定は `from` と `toExcluded` の範囲で行うので、文字列を切り出さずに、元の文字列の中の区切りだけを判定できます。
- **先頭の 0 を許す**: `010` のような 3 文字の形は、値として 10 を表すので、ここでは有効として通ります。

## まとめ

- `isValidIpV4Word` は、区切りの文字を 1 つずつ比べ、0 から 255 かを判定する。
- 3 文字なら、百の位で 0 から 199 と 200 から 255 に分けて確かめる。
- 数に変換せず、文字の比較だけで答えを出すので、途中の値を作らない。
