---
title: "整数を 7 ビットずつに分け、続きがあるかを最上位ビットで示す"
description: "Apache Kafka の ByteUtils.writeUnsignedVarint。int を 7 ビットずつの塊にして書き出し、続くかどうかを各バイトの最上位ビットで示す。値の大きさに応じて、書く回数を決める。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/internals/ByteUtils.java
lines: [408, 430]
function: "ByteUtils.writeUnsignedVarint"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

Kafka は、メッセージの中の長さや番号を、大きさに応じた長さのバイト列で書きます。小さい値は 1 バイト、大きい値は複数バイトで済むので、データ全体が小さくなります。この形式を、可変長整数（varint）と呼びます。

`writeUnsignedVarint` は、`int` を、この形式で `ByteBuffer` に書き出します。読み出しの側は、前の記事 `readUnsignedVarint` の逆の手順をたどります。

## コード

```java:line-numbers=408
    public static void writeUnsignedVarint(int value, ByteBuffer buffer) {
        if ((value & (0xFFFFFFFF << 7)) == 0) {
            buffer.put((byte) value);
        } else {
            buffer.put((byte) (value & 0x7F | 0x80));
            if ((value & (0xFFFFFFFF << 14)) == 0) {
                buffer.put((byte) ((value >>> 7) & 0xFF));
            } else {
                buffer.put((byte) ((value >>> 7) & 0x7F | 0x80));
                if ((value & (0xFFFFFFFF << 21)) == 0) {
                    buffer.put((byte) ((value >>> 14) & 0xFF));
                } else {
                    buffer.put((byte) ((value >>> 14) & 0x7F | 0x80));
                    if ((value & (0xFFFFFFFF << 28)) == 0) {
                        buffer.put((byte) ((value >>> 21) & 0xFF));
                    } else {
                        buffer.put((byte) ((value >>> 21) & 0x7F | 0x80));
                        buffer.put((byte) ((value >>> 28) & 0xFF));
                    }
                }
            }
        }
    }
```

## 前提知識

- **可変長整数（varint）**: 値を 7 ビットずつの塊に分け、塊ごとに 1 バイトで書く形式です。小さい値ほど、少ないバイトで済みます。
- **継続ビット（最上位ビット）**: 各バイトの最上位ビット（`0x80`）が 1 なら「まだ続きがある」、0 なら「ここで終わり」を表します。
- **`0xFFFFFFFF << 7`**: 上位のビット（7 ビット目以降）を表すマスクです。`value & (0xFFFFFFFF << 7)` が 0 なら、値は 7 ビットに収まります。
- **Protocol Buffers の形式**: Kafka の文書は、この形式を Google の Protocol Buffers の符号なし可変長整数と説明しています。

## 何をしているか

### 1. 7 ビットに収まれば、1 バイトで書く

```java:line-numbers=409
        if ((value & (0xFFFFFFFF << 7)) == 0) {
            buffer.put((byte) value);
```

`value` の 7 ビットより上が 0 なら、そのまま 1 バイトで書きます。`(byte) value` で、下位 8 ビットを書きますが、この場合は 7 ビットしか使っていないので、上の 1 ビットは 0 です。

### 2. 続く場合は、継続ビットを立てて、次の 7 ビットを書く

```java:line-numbers=411
        } else {
            buffer.put((byte) (value & 0x7F | 0x80));
            if ((value & (0xFFFFFFFF << 14)) == 0) {
                buffer.put((byte) ((value >>> 7) & 0xFF));
            } else {
                buffer.put((byte) ((value >>> 7) & 0x7F | 0x80));
```

7 ビットに収まらないときは、下位の 7 ビットに `0x80` を OR して書きます。これで、続きがあることを示せます。次の 7 ビットが、残りの値に収まれば、そのまま 1 バイトで書いて終わります。

### 3. 値の大きさに応じて、同じ形を繰り返す

```java:line-numbers=417
                if ((value & (0xFFFFFFFF << 21)) == 0) {
                    buffer.put((byte) ((value >>> 14) & 0xFF));
                } else {
                    buffer.put((byte) ((value >>> 14) & 0x7F | 0x80));
                    if ((value & (0xFFFFFFFF << 28)) == 0) {
                        buffer.put((byte) ((value >>> 21) & 0xFF));
                    } else {
                        buffer.put((byte) ((value >>> 21) & 0x7F | 0x80));
                        buffer.put((byte) ((value >>> 28) & 0xFF));
                    }
                }
            }
        }
    }
```

ほかの分岐は、同じ形を 7 ビットずつ、上へ繰り返しています。`int` は最大 32 ビットなので、書くバイトは最大で 5 個です。最後の 5 個目は、上位の 4 ビットを書いて終わります。

例として、`300`（`0x12C`）は、まず下位の 7 ビット `0x2C` に `0x80` を足して `0xAC` を書きます。残りの `2` を 1 バイトで書いて、合計 `AC 02` の 2 バイトになります。

## ここがすごい

- **小さい値が短い**: 多くの場合、値は小さいので、1 バイトか 2 バイトで書けます。固定の 4 バイトで書くより、データが小さくなります。
- **比較で大きさを判定する**: 7 ビットごとに、上位のビットが 0 かを調べて、書くバイト数を決めます。割り算や繰り返しの `while` を使わずに、分岐で決められます。
- **続きを 1 ビットで示す**: 読み出しの側は、最上位ビットを見るだけで、値が続くかを判断できます。長さを先に書く必要がありません。
- **同じ型を並べる**: 各分岐は同じ形なので、書き間違いを見つけやすい構成です。

## まとめ

- `writeUnsignedVarint` は、値を 7 ビットずつに分け、続きのあるバイトには `0x80` を立てる。
- 上位のビットが 0 になった段で、そのバイトを最後として書いて終わる。
- 値は最大 5 バイトで書け、小さい値ほど短く済む。
