---
title: "0x20 との XOR で英大文字を小文字にする"
description: "Guava の Ascii.toLowerCase。英大文字と小文字の差である 0x20 のビットを XOR で反転させ、大文字がなければ元の文字列をそのまま返す、速くて地域に依存しない変換。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2010 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/base/Ascii.java
lines: [407, 422]
function: "Ascii.toLowerCase"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 最適化]
---

## ひとことで

`Ascii.toLowerCase(string)` は、文字列の中の **英大文字（A〜Z）だけ** を小文字（a〜z）に変えます。`"Hello, World!"` は `"hello, world!"` になります。

`String.toLowerCase()` と違い、この関数は **ASCII の英字だけ** を対象にします。日本語やアクセント付きの文字は変えず、どの言語環境でも結果が同じになるのが特徴です。

## コード

```java:line-numbers=407
  public static String toLowerCase(String string) {
    int length = string.length();
    for (int i = 0; i < length; i++) {
      if (isUpperCase(string.charAt(i))) {
        char[] chars = string.toCharArray();
        for (; i < length; i++) {
          char c = chars[i];
          if (isUpperCase(c)) {
            chars[i] = (char) (c ^ CASE_MASK);
          }
        }
        return String.valueOf(chars);
      }
    }
    return string;
  }
```

このコードが使う定数と判定関数は、同じファイルで次のように定義されています。

```java:line-numbers=400
  private static final char CASE_MASK = 0x20;
```

```java:line-numbers=514
  public static boolean isUpperCase(char c) {
    return (c >= 'A') && (c <= 'Z');
  }
```

## 前提知識

- **ASCII**: 英字・数字・記号などを 0〜127 の数に割り当てた規格です。`'A'` は 65、`'a'` は 97 です。
- **`char`**: Java の 16 ビットの文字型です。`c >= 'A'` のように、文字同士を数として比べられます。
- **`^`（XOR）**: 桁ごとに「違えば 1、同じなら 0」です。ある桁だけを反転させたいときに使います。
- **`0x20`**: 2 進数で `0010 0000` で、ASCII では 32 にあたります。
- **`String.valueOf(chars)`**: `char` の配列から文字列を作ります。
- **`CharSequence`**: 文字列のように文字を並べたものを表すインタフェースです。`String` も `StringBuilder` もこれを実装しています。

## 何をしているか

### 1. 大文字がなければそのまま返す

最初の `for` で、大文字が 1 文字でもあるかを探します。`"hello"` のように大文字がなければ、ループを抜けて元の `string` をそのまま返します。新しい文字列を作らないので、無駄なメモリを使いません。

### 2. 大文字の位置から変換を始める

最初の大文字が見つかったら、`toCharArray()` で文字の配列にコピーし、そこから末尾まで処理します。

### 3. 大文字だけ XOR で反転させる

```java:line-numbers=412
        for (; i < length; i++) {
          char c = chars[i];
          if (isUpperCase(c)) {
            chars[i] = (char) (c ^ CASE_MASK);
          }
        }
```

`'A'` は `0100 0001`、`'a'` は `0110 0001` です。違うのは 0x20 のビット（下から 6 番目）だけです。大文字の位置は `isUpperCase` で判定し、その文字だけ `c ^ CASE_MASK` で 0x20 のビットを反転させます。

- `'H'`（72）→ `72 ^ 32 = 104`（`'h'`）
- `'e'`（101）は大文字でないので、そのまま
- `'!'`（33）も大文字でないので、そのまま

## ここがすごい

- **1 ビットの差を利用**: 英字の大文字と小文字は、ASCII の並びでちょうど 0x20 だけ離れています。その 1 ビットを XOR で反転させれば、加算や減算で範囲を確かめる必要がありません。
- **変換が必要なときだけ作る**: 大文字がなければ、元の文字列をそのまま返します。多くの文字列はすでに小文字なので、この最適化で文字列のコピーがほとんど起きません。
- **地域に依存しない**: `String.toLowerCase()` は、実行している環境のロケール（言語設定）によって結果が変わることがあります。たとえばトルコ語では `'I'` の小文字が違います。この関数は ASCII の範囲だけを扱うので、どの環境でも同じ結果になります。
- **判定と変換を分けない**: `isUpperCase` で判定して、同じ条件の中で変換しています。二重に文字を調べずに済みます。

## まとめ

- ASCII の大文字と小文字は、0x20 のビットだけが違う。
- XOR で 1 ビットを反転させると、大文字と小文字を素早く入れ替えられる。
- 変換が必要ないときは元のものをそのまま返すと、無駄なコピーを避けられる。
