---
title: "WebSocket のマスクを、8 バイトずつまとめて XOR で外す"
description: "Netty の WebSocket08FrameDecoder.unmask。4 バイトのマスクを 2 つ並べた long を作り、ペイロードを 8 バイトずつ XOR で戻す。残りの 4 バイト未満は 1 バイトずつ処理する。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2019 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-http/src/main/java/io/netty/handler/codec/http/websocketx/WebSocket08FrameDecoder.java
lines: [392, 424]
function: "WebSocket08FrameDecoder.unmask"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

WebSocket では、クライアントからサーバーへ送るデータを、4 バイトの「マスク」で XOR して送ります。受け取る側は、同じマスクでもう一度 XOR して、元のデータに戻します。

`unmask` は、この戻す処理を、ペイロード全体に行うメソッドです。1 バイトずつではなく、8 バイトずつ、続いて 4 バイトずつ、最後に残りの 1 バイトずつ処理します。

## コード

::: code-group

```java:line-numbers=392 [日本語訳]
    private void unmask(ByteBuf frame) {
        int i = frame.readerIndex();
        int end = frame.writerIndex();

        ByteOrder order = frame.order();

        int intMask = mask;
        if (intMask == 0) {
            // マスクが 0 なら、XOR しても値が変わらないので、そのまま戻る
            return;
        }
        // int を long に広げるとき、符号が広がるのを避ける
        long longMask = intMask & 0xFFFFFFFFL;
        longMask |= longMask << 32;

        for (int lim = end - 7; i < lim; i += 8) {
            frame.setLong(i, frame.getLong(i) ^ longMask);
        }

        if (i < end - 3) {
            frame.setInt(i, frame.getInt(i) ^ (int) longMask);
            i += 4;
        }

        if (order == ByteOrder.LITTLE_ENDIAN) {
            intMask = Integer.reverseBytes(intMask);
        }

        int maskOffset = 0;
        for (; i < end; i++) {
            frame.setByte(i, frame.getByte(i) ^ WebSocketUtil.byteAtIndex(intMask, maskOffset++ & 3));
        }
    }
```

```java:line-numbers=392 [原文]
    private void unmask(ByteBuf frame) {
        int i = frame.readerIndex();
        int end = frame.writerIndex();

        ByteOrder order = frame.order();

        int intMask = mask;
        if (intMask == 0) {
            // If the mask is 0 we can just return directly as the XOR operations will just produce the same value.
            return;
        }
        // Avoid sign extension on widening primitive conversion
        long longMask = intMask & 0xFFFFFFFFL;
        longMask |= longMask << 32;

        for (int lim = end - 7; i < lim; i += 8) {
            frame.setLong(i, frame.getLong(i) ^ longMask);
        }

        if (i < end - 3) {
            frame.setInt(i, frame.getInt(i) ^ (int) longMask);
            i += 4;
        }

        if (order == ByteOrder.LITTLE_ENDIAN) {
            intMask = Integer.reverseBytes(intMask);
        }

        int maskOffset = 0;
        for (; i < end; i++) {
            frame.setByte(i, frame.getByte(i) ^ WebSocketUtil.byteAtIndex(intMask, maskOffset++ & 3));
        }
    }
```

:::

## 前提知識

- **マスク**: WebSocket のフレームに含まれる、4 バイトの鍵です。`intMask` は、この 4 バイトを 1 つの `int` として持っています。
- **XOR の性質**: `a ^ m ^ m = a` なので、同じマスクで 2 回 XOR すると元に戻ります。
- **8 バイトの値へのマスクの並べ方**: 4 バイトのマスクを 2 つ並べると、8 バイトの繰り返しになります。その `long` を使えば、8 バイトを 1 回の XOR で処理できます。
- **`ByteOrder`**: バイトの並び（ビッグエンディアンかリトルエンディアン）です。`getLong` や `getInt` の結果は、この並びによって変わります。

## 何をしているか

### 1. マスクが 0 なら、何もしない

```java:line-numbers=398
        int intMask = mask;
        if (intMask == 0) {
            // マスクが 0 なら、XOR しても値が変わらないので、そのまま戻る
            return;
        }
```

マスクが 0 のときは、XOR で値が変わらないので、そのまま戻ります。

### 2. マスクを 8 バイトに広げる

```java:line-numbers=403
        // int を long に広げるとき、符号が広がるのを避ける
        long longMask = intMask & 0xFFFFFFFFL;
        longMask |= longMask << 32;
```

`intMask & 0xFFFFFFFFL` で、`int` を `long` に広げます。`0xFFFFFFFFL` で、符号が上の 32 ビットに広がるのを防ぎます。`longMask |= longMask << 32` で、同じ 4 バイトを上位にも並べます。結果として、8 バイトの繰り返しのマスクができます。

### 3. 8 バイトずつ XOR する

```java:line-numbers=407
        for (int lim = end - 7; i < lim; i += 8) {
            frame.setLong(i, frame.getLong(i) ^ longMask);
        }
```

`frame.getLong(i) ^ longMask` で、8 バイトを 1 回の計算で戻します。ループは、残りが 8 バイト以上ある間だけ続きます。

### 4. 残りのバイトを処理する

```java:line-numbers=411
        if (i < end - 3) {
            frame.setInt(i, frame.getInt(i) ^ (int) longMask);
            i += 4;
        }
```

残りが 4 バイト以上あれば、`int` 単位で 1 回 XOR します。

```java:line-numbers=416
        if (order == ByteOrder.LITTLE_ENDIAN) {
            intMask = Integer.reverseBytes(intMask);
        }

        int maskOffset = 0;
        for (; i < end; i++) {
            frame.setByte(i, frame.getByte(i) ^ WebSocketUtil.byteAtIndex(intMask, maskOffset++ & 3));
        }
```

最後の 1〜3 バイトは、1 バイトずつ処理します。`byteAtIndex` は、マスクの何番目のバイトを使うかを、`maskOffset & 3` で決めます。リトルエンディアンのバッファでは、先に `Integer.reverseBytes` で、マスクのバイトの並びを反転します。

## ここがすごい

- **8 バイトずつ処理する**: 1 バイトずつ XOR するより、読み書きと計算の回数が少なくなります。
- **マスクを前もって広げる**: 1 回だけ `longMask` を作り、ループの中では同じ値を使い回します。
- **符号の広がりを防ぐ**: `0xFFFFFFFFL` で、負の `int` が上位ビットを壊すのを防ぎます。
- **末尾だけ分ける**: 8 バイトの区切りに合わないぶんは、短い処理で片付けます。`maskOffset & 3` で、マスクの位置を 0 から 3 へ循環させます。

## まとめ

- `unmask` は、4 バイトのマスクを 8 バイトの `long` に広げ、ペイロードを 8 バイトずつ XOR で戻す。
- 残りのバイトは、4 バイトずつ、そして 1 バイトずつ処理する。
- 末尾の処理では、バッファのバイト順に合わせて、マスクの並びを反転する場合がある。
