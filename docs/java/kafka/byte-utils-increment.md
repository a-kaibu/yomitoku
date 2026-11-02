---
title: "バイト列を 1 増やして、次の値を作る"
description: "Apache Kafka の ByteUtils.increment(Bytes)。バイト配列を末尾から見て、0xFF の繰り上がりを処理しながら 1 を足す。範囲の終わりを表す次のキーを作るのに使う。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/internals/ByteUtils.java
lines: [50, 67]
function: "ByteUtils.increment"
difficulty: 2
format: 2
tags: [アルゴリズム, 低レイヤ, ビット演算]
---

## ひとことで

`increment(input)` は、バイト配列を、数として 1 増やしたものを、新しい配列として返します。たとえば `{0x01, 0xFF}` は `{0x02, 0x00}` になります。配列の全部が `0xFF` のときは、これ以上増やせないので、例外を投げます。

キーの範囲の終わりを表すときなど、「この値より少し大きい、次の値」が必要になる場面があります。Kafka の `Bytes.increment` は、このメソッドに処理を任せています。

## コード

```java:line-numbers=50
    public static Bytes increment(Bytes input) throws IndexOutOfBoundsException {
        byte[] inputArr = input.get();
        byte[] ret = new byte[inputArr.length];
        int carry = 1;
        for (int i = inputArr.length - 1; i >= 0; i--) {
            if (inputArr[i] == (byte) 0xFF && carry == 1) {
                ret[i] = (byte) 0x00;
            } else {
                ret[i] = (byte) (inputArr[i] + carry);
                carry = 0;
            }
        }
        if (carry == 0) {
            return Bytes.wrap(ret);
        } else {
            throw new IndexOutOfBoundsException();
        }
    }
```

## 前提知識

- **繰り上がり（carry）**: 1 桁が 9 を超えたとき、次の上の桁へ 1 を渡すことです。2 進数では、`1` を超えたときに起きます。ここでは、1 バイトの `0xFF` を超えたときに起きます。
- **末尾から見る**: 数の最も低い桁は配列の末尾にあるので、`for` は `length - 1` から 0 へ向かって進みます。
- **`(byte) 0xFF`**: Java の `byte` は符号付きなので、`0xFF` は `-1` として比べる必要があります。`(byte) 0xFF` と書くと、同じ比較ができます。
- **辞書順の次の値**: 2 つのバイト列を辞書順に並べたとき、その直後にくる値です。範囲の終わりを表すキーとして使えます。

## 何をしているか

### 1. 末尾から、繰り上がりを伝えながら進める

```java:line-numbers=54
        for (int i = inputArr.length - 1; i >= 0; i--) {
            if (inputArr[i] == (byte) 0xFF && carry == 1) {
                ret[i] = (byte) 0x00;
            } else {
                ret[i] = (byte) (inputArr[i] + carry);
                carry = 0;
            }
        }
```

繰り上がりを表す `carry` は、最初は 1 です。末尾から順に見て、そのバイトが `0xFF` で `carry` が 1 なら、そのバイトを `0x00` にして、繰り上がりを次へ伝えます。そうでなければ、そのバイトに `carry` を足し、`carry` を 0 にします。以降のバイトは、そのまま写されます。

### 2. 最後まで繰り上がったら、例外にする

```java:line-numbers=62
        if (carry == 0) {
            return Bytes.wrap(ret);
        } else {
            throw new IndexOutOfBoundsException();
        }
```

ループが終わったあとも `carry` が 1 のままなら、最上位まで繰り上がったことになります。配列の全部が `0xFF` だったので、これ以上増やせません。この場合は `IndexOutOfBoundsException` を投げます。そうでなければ、新しい配列を `Bytes` として返します。

## ここがすごい

- **元の配列を書き換えない**: 結果は新しい配列 `ret` に書きます。入力のキーは変わらないので、他の場所で同じキーを使っても影響がありません。
- **変わるのは末尾の連続した `0xFF` と、その次の 1 バイト**: 繰り上がりが止まった後は、残りをそのままコピーするだけで済みます。
- **溢れを例外で知らせる**: 増やせない値（全部が `0xFF`）を、黙って 0 に戻すことはしません。呼び出し側が、範囲の終わりを扱えない状況を、早く知ることができます。
- **比較の型を明示**: `(byte) 0xFF` で比べるので、符号付きの `byte` でも、正しく `0xFF` を判定できます。

## まとめ

- `increment` は、バイト配列の末尾から、`0xFF` の繰り上がりを処理しながら 1 を足す。
- 繰り上がりが最上位まで届いたら、全部が `0xFF` だったということなので、例外にする。
- 次の辞書順の値を作る道具として、キーの範囲の終わりを表すために使われる。
