---
title: "4 本のアキュムレータで、16 バイトずつ並列に混ぜる"
description: "Apache Commons Codec の XXHash32.process。16 バイトの塊を 4 つの 4 バイト整数に分け、それぞれを掛け算・回転・掛け算で独立に混ぜてから、最後にまとめる。"
language: java
project: Apache Commons Codec
repo: https://github.com/apache/commons-codec
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "7fa065c5b5f78c66322b9f33f5e396b2c2b62c27"
file: src/main/java/org/apache/commons/codec/digest/XXHash32.java
lines: [137, 140]
function: "XXHash32.process"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 並行処理]
---

## ひとことで

XXHash は、大量のバイト列から、速く指紋（ハッシュ値）を作るアルゴリズムです。Apache Commons Codec の `XXHash32` は、その 32 ビット版を実装しています。

入力を 16 バイトずつの塊に分け、塊の中の 4 つの 4 バイト整数を、4 つの独立した状態（アキュムレータ）で混ぜます。`process` は、その 1 塊の処理を行うメソッドです。

## コード

```java:line-numbers=137
        s0 = rotateLeft(s0 + getInt(b, offset) * PRIME2, ROTATE_BITS) * PRIME1;
        s1 = rotateLeft(s1 + getInt(b, offset + 4) * PRIME2, ROTATE_BITS) * PRIME1;
        s2 = rotateLeft(s2 + getInt(b, offset + 8) * PRIME2, ROTATE_BITS) * PRIME1;
        s3 = rotateLeft(s3 + getInt(b, offset + 12) * PRIME2, ROTATE_BITS) * PRIME1;
```

## 前提知識

- **アキュムレータ（状態）**: 途中までの計算結果を保つ変数です。ここでは `state[0]` から `state[3]` の 4 つがあり、それぞれ別の初期値から始まります。
- **`rotateLeft`（左回転）**: ビットを左へずらし、はみ出したビットを右の端に戻す操作です。`Integer.rotateLeft` で行います。
- **素数の定数**: `PRIME1` から `PRIME5` は、混ぜる際の掛け算に使う大きな値です。ビットを散らすために選ばれています。
- **オーバーフロー**: `int` の掛け算や足し算は、上の桁を捨てて計算されます。この性質を、そのまま混ぜる計算に使います。

## 何をしているか

### 1. 4 つの整数を、それぞれのアキュムレータに混ぜる

```java:line-numbers=137
        s0 = rotateLeft(s0 + getInt(b, offset) * PRIME2, ROTATE_BITS) * PRIME1;
        s1 = rotateLeft(s1 + getInt(b, offset + 4) * PRIME2, ROTATE_BITS) * PRIME1;
        s2 = rotateLeft(s2 + getInt(b, offset + 8) * PRIME2, ROTATE_BITS) * PRIME1;
        s3 = rotateLeft(s3 + getInt(b, offset + 12) * PRIME2, ROTATE_BITS) * PRIME1;
```

`getInt(b, offset + 4 * k)` で、16 バイトの塊から 4 バイトずつ整数を読みます。それを `PRIME2` と掛け、現在の状態 `s0`〜`s3` に足します。

そのあと `ROTATE_BITS`（13）ビット左へ回し、`PRIME1` を掛けます。この「足す・回す・掛ける」の 3 段で、1 つの整数が状態に混ざります。

### 2. 回転の幅と定数

```java:line-numbers=41
    private static final int ROTATE_BITS = 13;
```

`ROTATE_BITS` は 13 です。回転の幅が 13 ビットなので、掛け算で上へ広がったビットが、下の方のビットにも戻ってきます。

## ここがすごい

- **4 つの状態が独立している**: 4 つの整数は、互いに依存せずに混ぜられるので、CPU が同時に計算しやすくなります。
- **掛けて回す**: 掛け算は上の桁へ、回転は上の桁を下へ、それぞれ情報を運びます。2 つを組み合わせると、少ない計算で入力の変化が全体に広がります。
- **ローカル変数で読み書き**: コメントに「速さのための局所的な影」とあるように、配列の `state` ではなく、ローカルの `s0`〜`s3` で計算してから、最後に書き戻しています。
- **ハッシュ値の質**: 混ぜる段数が十分なので、入力が少し違うだけでも、出力のビットが大きく変わります。

## まとめ

- `process` は、16 バイトの塊を 4 つの整数に分け、それぞれを「足す・回す・掛ける」で状態に混ぜる。
- 4 つの状態は独立して混ぜられるので、速く計算できる。
- 回転の幅 13 と素数の定数で、ビットを上下へ広げて、ハッシュの質を保つ。
