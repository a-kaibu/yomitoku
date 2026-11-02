---
title: "Protobuf の可変長整数を、4 バイトまとめて一度に読む"
description: "Netty の ProtobufVarint32FrameDecoder.readRawVarint32。4 バイトを int として読み、各バイトの最上位ビットで終わりを探し、マスクと移動で 7 ビットずつの値を 1 つの整数に詰める。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2015 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-protobuf/src/main/java/io/netty/handler/codec/protobuf/ProtobufVarint32FrameDecoder.java
lines: [114, 139]
function: "ProtobufVarint32FrameDecoder.readRawVarint32"
difficulty: 3
format: 2
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Protobuf は、整数を「可変長整数（varint）」という形で書きます。1 バイトは 8 ビットで、そのうち最上位の 1 ビットは「まだ続きがある」というしるしです。下位の 7 ビットが、数の一部になります。小さい数は 1 バイトで済みます。

`readRawVarint32` は、この形の整数を読んで、`int` に戻すメソッドです。1 バイトずつ読むのではなく、4 バイトをまとめて 1 つの `int` として読み、ビットの計算だけで答えを作ります。

## コード

::: code-group

```java:line-numbers=114 [日本語訳]
    static int readRawVarint32(ByteBuf buffer) {
        if (buffer.readableBytes() < 4) {
            return readRawVarint24(buffer);
        }
        int wholeOrMore = buffer.getIntLE(buffer.readerIndex());
        int firstOneOnStop = ~wholeOrMore & 0x80808080;
        if (firstOneOnStop == 0) {
            return readRawVarint40(buffer, wholeOrMore);
        }
        int bitsToKeep = Integer.numberOfTrailingZeros(firstOneOnStop) + 1;
        buffer.skipBytes(bitsToKeep >> 3);
        int thisVarintMask = firstOneOnStop ^ (firstOneOnStop - 1);
        int wholeWithContinuations = wholeOrMore & thisVarintMask;
        // varint の仕様に従って並べ替えつつ、継続ビットを捨てる
        // `0x7F007F` は、1 つ目と 3 つ目のバイトの下位 7 ビットを取り出す（継続ビットは捨てる）
        // `0x7F007F00` は、2 つ目と 4 つ目のバイトの下位 7 ビットを取り出す（継続ビットは捨てる）
        // 2 つ目と 4 つ目のバイトは 1 ビット右へずらし、1 つ目と 3 つ目のバイトの隙間を埋める
        // 1 つ目と 2 つ目のバイトで、最初の 14 ビット（7 ビットずつ）を占める
        // 3 つ目と 4 つ目のバイトで、次の 14 ビット（7 ビットずつ）を占める。2 つのバイトの間には隙間がある
        // 4 つ目と 3 つ目のバイトの後には、さらに 2 バイト分の隙間がある
        wholeWithContinuations = (wholeWithContinuations & 0x7F007F) | ((wholeWithContinuations & 0x7F007F00) >> 1);
        // `0x3FFF` は最初の 14 ビット、つまり 1 つ目と 2 つ目のバイトを取り出す
        // `0x3FFF0000` は次の 14 ビット、つまり 3 つ目と 4 つ目のバイトを取り出す
        // 3 つ目と 4 つ目のバイトは 2 ビット右へずらし、1 つ目と 2 つ目のバイトの隙間を埋める
        return (wholeWithContinuations & 0x3FFF) | ((wholeWithContinuations & 0x3FFF0000) >> 2);
    }
```

```java:line-numbers=114 [原文]
    static int readRawVarint32(ByteBuf buffer) {
        if (buffer.readableBytes() < 4) {
            return readRawVarint24(buffer);
        }
        int wholeOrMore = buffer.getIntLE(buffer.readerIndex());
        int firstOneOnStop = ~wholeOrMore & 0x80808080;
        if (firstOneOnStop == 0) {
            return readRawVarint40(buffer, wholeOrMore);
        }
        int bitsToKeep = Integer.numberOfTrailingZeros(firstOneOnStop) + 1;
        buffer.skipBytes(bitsToKeep >> 3);
        int thisVarintMask = firstOneOnStop ^ (firstOneOnStop - 1);
        int wholeWithContinuations = wholeOrMore & thisVarintMask;
        // mix them up as per varint spec while dropping the continuation bits:
        // 0x7F007F isolate the first byte and the third byte dropping the continuation bits
        // 0x7F007F00 isolate the second byte and the fourth byte dropping the continuation bits
        // the second and fourth byte are shifted to the right by 1, filling the gaps left by the first and third byte
        // it means that the first and second bytes now occupy the first 14 bits (7 bits each)
        // and the third and fourth bytes occupy the next 14 bits (7 bits each), with a gap between the 2s of 2 bytes
        // and another gap of 2 bytes after the forth and third.
        wholeWithContinuations = (wholeWithContinuations & 0x7F007F) | ((wholeWithContinuations & 0x7F007F00) >> 1);
        // 0x3FFF isolate the first 14 bits i.e. the first and second bytes
        // 0x3FFF0000 isolate the next 14 bits i.e. the third and forth bytes
        // the third and forth bytes are shifted to the right by 2, filling the gaps left by the first and second bytes
        return (wholeWithContinuations & 0x3FFF) | ((wholeWithContinuations & 0x3FFF0000) >> 2);
    }
```

:::

## 前提知識

- **varint**: 7 ビットずつ数を分けて、各バイトの最上位ビット（`0x80`）で続きの有無を示す形式です。下位のバイトが先に来ます（リトルエンディアン）。
- **継続ビット**: `0x80` のビットです。1 なら次のバイトがあり、0 なら、そのバイトが最後です。
- **`getIntLE`**: バッファから、リトルエンディアンで 4 バイトを `int` として読みます。1 つ目のバイトが下位のビットになります。
- **`numberOfTrailingZeros`**: 最も下の 1 のビットの位置を返します。終わりのバイトを探すのに使います。
- **`x ^ (x - 1)`**: 最も下の 1 のビットと、それより下のビットを全部 1 にする計算です。

## 何をしているか

### 1. 4 バイトをまとめて読み、終わりのバイトを探す

```java:line-numbers=118
        int wholeOrMore = buffer.getIntLE(buffer.readerIndex());
        int firstOneOnStop = ~wholeOrMore & 0x80808080;
        if (firstOneOnStop == 0) {
            return readRawVarint40(buffer, wholeOrMore);
        }
```

`~wholeOrMore & 0x80808080` は、各バイトの最上位ビットを反転して、0x80 のビットだけを取り出します。1 になったビットは、その位置のバイトが最後だと示しています。4 つとも続きがあるなら、5 バイト以上の整数なので、`readRawVarint40` に任せます。

### 2. 整数の長さを決め、そのバイトだけを読み進める

```java:line-numbers=123
        int bitsToKeep = Integer.numberOfTrailingZeros(firstOneOnStop) + 1;
        buffer.skipBytes(bitsToKeep >> 3);
        int thisVarintMask = firstOneOnStop ^ (firstOneOnStop - 1);
        int wholeWithContinuations = wholeOrMore & thisVarintMask;
```

`numberOfTrailingZeros(firstOneOnStop) + 1` は、終わりのバイトまでのビットの数です。`>> 3` で 8 で割ると、バイトの数になります。`thisVarintMask` は、終わりのバイトまでのビットを 1 にしたマスクで、`wholeOrMore & thisVarintMask` で、この整数に属するバイトだけを残します。

### 3. 7 ビットずつの値を、ビットの移動で詰める

```java:line-numbers=127
        // varint の仕様に従って並べ替えつつ、継続ビットを捨てる
        // `0x7F007F` は、1 つ目と 3 つ目のバイトの下位 7 ビットを取り出す（継続ビットは捨てる）
        // `0x7F007F00` は、2 つ目と 4 つ目のバイトの下位 7 ビットを取り出す（継続ビットは捨てる）
        // 2 つ目と 4 つ目のバイトは 1 ビット右へずらし、1 つ目と 3 つ目のバイトの隙間を埋める
        // 1 つ目と 2 つ目のバイトで、最初の 14 ビット（7 ビットずつ）を占める
        // 3 つ目と 4 つ目のバイトで、次の 14 ビット（7 ビットずつ）を占める。2 つのバイトの間には隙間がある
        // 4 つ目と 3 つ目のバイトの後には、さらに 2 バイト分の隙間がある
        wholeWithContinuations = (wholeWithContinuations & 0x7F007F) | ((wholeWithContinuations & 0x7F007F00) >> 1);
        // `0x3FFF` は最初の 14 ビット、つまり 1 つ目と 2 つ目のバイトを取り出す
        // `0x3FFF0000` は次の 14 ビット、つまり 3 つ目と 4 つ目のバイトを取り出す
        // 3 つ目と 4 つ目のバイトは 2 ビット右へずらし、1 つ目と 2 つ目のバイトの隙間を埋める
        return (wholeWithContinuations & 0x3FFF) | ((wholeWithContinuations & 0x3FFF0000) >> 2);
```

最初の `& 0x7F007F` と `& 0x7F007F00` で、継続ビットを捨てて、7 ビットずつの値を取り出します。2 つ目の値は右へずらして、隙間を埋めます。これで、最初の 14 ビットと、次の 14 ビットに分かれます。

最後の行で、2 つ目の 14 ビットをさらに 2 ビット右へずらして、1 つ目の 14 ビットの続きに並べます。結果として、7 ビット × 4 の値が、途中の隙間なく 28 ビットに詰まります。

## ここがすごい

- **1 バイトずつ読まない**: 4 バイトを 1 回の読み取りで取り、終わりのバイトもビット演算で一度に決めます。ループや分岐を重ねる必要がありません。
- **継続ビットを、マスクで一度に捨てる**: 0x80 のビットを、マスクの形で取り除きます。バイトごとに判定しません。
- **分岐は少ない**: 4 バイト以内で終わる整数は、この関数の中で完結します。5 バイト以上だけ、別のメソッドに任せます。
- **バッファの読み取り位置を、必要な分だけ進める**: `skipBytes(bitsToKeep >> 3)` で、この整数に使ったバイトだけを読み進めます。

## まとめ

- `readRawVarint32` は、4 バイトを `int` として読み、各バイトの最上位ビットで終わりを探す。
- 終わりまでのバイトだけを残し、マスクと移動で 7 ビットずつの値を 1 つの整数に詰める。
- 5 バイト以上の整数は、`readRawVarint40` に任せる。
