---
title: "2 の累乗の基数では、下位ビットを右へずらしながら文字にする"
description: "Java 標準の Integer.formatUnsignedInt。2 進・8 進・16 進のように基数が 2 の累乗のとき、マスクとシフトだけで桁を取り出し、後ろから文字を書き込む。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Integer.java
lines: [393, 401]
function: "Integer.formatUnsignedInt"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`formatUnsignedInt(val, shift, buf, len)` は、符号なしの整数を、2 の累乗の基数の文字列に変えて、バッファに書き込みます。`shift` が 1 なら 2 進数、3 なら 8 進数、4 なら 16 進数になります。

`Integer.toBinaryString` や `toHexString` は、内部でこの関数を使っています。割り算を使わずに、ビットの並びそのままから文字を作れるのが特徴です。

## コード

```java:line-numbers=393
    private static void formatUnsignedInt(int val, int shift, byte[] buf, int len) {
        int charPos = len;
        int radix = 1 << shift;
        int mask = radix - 1;
        do {
            buf[--charPos] = Integer.digits[val & mask];
            val >>>= shift;
        } while (charPos > 0);
    }
```

## 前提知識

- **基数（radix）**: 数を表すときの位取りの単位です。2 進数は基数 2、16 進数は基数 16 です。
- **2 の累乗の基数**: 基数が 2、4、8、16 などの 2 の累乗のとき、1 桁は決まった本数のビットに対応します。16 進数の 1 桁は、4 ビットです。
- **`shift`**: 1 桁あたりのビット数です。基数 `1 << shift` と同じ意味になります。
- **`Integer.digits`**: `0` から `f` までの文字を並べた配列です。桁の値を添字にして文字を引きます。
- **符号なしの扱い**: `>>>` で右へずらすと、左端に 0 が入るので、負の数でも桁が正しく取り出せます。

## 何をしているか

### 1. 基数とマスクを決める

```java:line-numbers=394
        int charPos = len;
        int radix = 1 << shift;
        int mask = radix - 1;
```

`radix = 1 << shift` は、基数を表します。`mask = radix - 1` は、1 桁ぶんのビットを表すマスクです。たとえば `shift` が 4 なら、`radix` は 16、`mask` は `0xf` です。

### 2. 下位の桁から書き込む

```java:line-numbers=397
        do {
            buf[--charPos] = Integer.digits[val & mask];
            val >>>= shift;
```

`val & mask` で一番下の桁を取り出し、`digits` の表から文字を引きます。文字は後ろから書き込み、`val >>>= shift` で次の桁へ進みます。

### 3. 値がなくなるまで繰り返す

```java:line-numbers=400
        } while (charPos > 0);
```

`do ... while` なので、値が 0 のときも 1 回は書き込まれ、`0` という文字が入ります。`charPos` が 0 に達したら止まります。

## ここがすごい

- **割り算を使わない**: 10 進数の変換では割り算が必要ですが、2 の累乗の基数では、マスクとシフトで桁が取れます。どちらも単純で速い演算です。
- **後ろから書く**: 下位の桁から取り出すので、文字は後ろから書き込むのが自然です。バッファを逆にする手間がありません。
- **符号を気にしない**: `>>>` を使うので、負の数も、ビットの並びどおりに 2 進数や 16 進数として表されます。
- **一つの関数で複数の基数**: `shift` を変えるだけで、2 進数、8 進数、16 進数を同じ関数で扱えます。

## まとめ

- 基数が 2 の累乗なら、マスクとシフトだけで桁が取り出せる。
- 下位の桁から、後ろへ向かって文字を書き込む。
- `shift` の値を変えるだけで、2 進数・8 進数・16 進数を同じ仕組みで作れる。
