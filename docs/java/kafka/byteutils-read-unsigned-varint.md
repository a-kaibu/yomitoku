---
title: "1 バイトの最上位ビットを「続きあり」の印にする可変長整数"
description: "Kafka が整数を短く保存するために使う可変長整数（varint）の読み込み。各バイトの下位 7 ビットを値に使い、最上位ビットで続きの有無を示す。小さい値ほど少ないバイトで済む。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/internals/ByteUtils.java
lines: [223, 250]
function: "ByteUtils.readUnsignedVarint"
difficulty: 2
format: 2
tags: [ビット演算, パース, 入出力]
---

## ひとことで

`ByteUtils.readUnsignedVarint(buffer)` は、バイトの並びから **可変長の整数** を読み出します。小さい値ほど少ないバイトで表せるのが特徴です。たとえば `5` は 1 バイト、`300` は 2 バイトで済みます。

Kafka は、メッセージの長さや件数などを大量に保存・送信するので、小さい数を短く書くことで、データ量を減らしています。

## コード

```java:line-numbers=223
    public static int readUnsignedVarint(ByteBuffer buffer) {
        byte tmp = buffer.get();
        if (tmp >= 0) {
            return tmp;
        } else {
            int result = tmp & 127;
            if ((tmp = buffer.get()) >= 0) {
                result |= tmp << 7;
            } else {
                result |= (tmp & 127) << 7;
                if ((tmp = buffer.get()) >= 0) {
                    result |= tmp << 14;
                } else {
                    result |= (tmp & 127) << 14;
                    if ((tmp = buffer.get()) >= 0) {
                        result |= tmp << 21;
                    } else {
                        result |= (tmp & 127) << 21;
                        result |= (tmp = buffer.get()) << 28;
                        if (tmp < 0) {
                            throw illegalVarintException(result);
                        }
                    }
                }
            }
            return result;
        }
    }
```

## 前提知識

- **バイト**: 8 ビットの数です。Java の `byte` は −128〜127 の範囲で、最上位ビットが 1 なら負の数になります。
- **可変長整数（varint）**: 値の大きさに応じて、1 バイトから数バイトで表す方法です。
- **継続ビット**: 各バイトの最上位ビットを、「まだ続きがある」という印に使う方法です。
- **`& 127`**: 下位 7 ビットを取り出すマスクです。`127` は `0111 1111` です。
- **`buffer.get()`**: バッファから 1 バイト読み、次の位置へ進みます。

## 何をしているか

### 1. 1 バイトで済む場合

```java:line-numbers=224
        byte tmp = buffer.get();
        if (tmp >= 0) {
            return tmp;
```

最初のバイトが `0` 以上なら、最上位ビットは 0 で、続きはありません。その値をそのまま答えにします。`5` は `0000 0101` なので、そのまま `5` です。

### 2. 続きがある場合

```java:line-numbers=228
            int result = tmp & 127;
            if ((tmp = buffer.get()) >= 0) {
                result |= tmp << 7;
```

最上位ビットが 1 のときは、下位 7 ビットだけが値です。`& 127` で、その 7 ビットを取り出します。次のバイトが続きの 7 ビットです。`<< 7` で、その分を上の位置へずらして OR で足します。

### 3. 具体的な値で追う

`300` を読みます。2 進数で `1 0010 1100` です。

- 1 バイト目は、下位 7 ビット `010 1100`（44）に継続ビットを立てた `1010 1100`（`0xAC`）。
- 2 バイト目は、残りの `000 0010`（2）。継続ビットは 0。

読み出すときは、1 バイト目から `44` を取り出します。最上位は 1 なので続きがあります。2 バイト目の `2` を `<< 7` すると `256`。`44 + 256 = 300` です。

### 4. 最大でも 5 バイト

コードは、`if` が 4 段ネストしていて、5 バイト目で続きがあれば例外を投げます。`int` は 32 ビットなので、7 ビットずつ 5 回で十分です。それ以上続くなら、値が `int` に収まらない不正なデータです。

## ここがすごい

- **小さい値が小さく**: 多くの数は小さい値です。1 バイトで済めば、固定の 4 バイトより 4 分の 1 になります。大量のデータを扱う Kafka では、この差が大きな効果になります。
- **分岐で打ち切る**: ループではなく、段ごとに「続きがあるか」を判定して、必要な分だけ読みます。最後のバイトの扱いは、ネストした `if` で明示されているので、どこで終わるかが読み手に分かりやすくなっています。
- **書き込みと対になる**: 同じファイルの `writeUnsignedVarint` は、同じ 7 ビットずつの分け方で書き込みます。読みと書きが対になるように作られているので、データの形式が揃います。
- **不正なデータの検出**: 5 バイト目に続きがあるとき、例外を投げます。データが壊れていたとき、間違った値を黙って返すより、早めに気づける設計です。

## まとめ

- 最上位ビットを継続の印にすると、可変長の整数を表せる。
- 小さい値を短く保存すると、データ全体の大きさを減らせる。
- 読み込みは、書き込みと対になる形で作ると、データの形式が正しく保たれる。
