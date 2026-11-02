---
title: "足し算・回転・XOR を交互に重ねて、4 つの状態を混ぜる"
description: "Netty の QUIC 向け SipHash の sipround。4 つの 64 ビット値に対して、加算、ビット回転、排他的論理和を組み合わせ、入力の小さな違いを全体に広げる。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2025 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-classes-quic/src/main/java/io/netty/handler/codec/quic/SipHash.java
lines: [131, 149]
function: "SipHash.sipround"
difficulty: 3
format: 2
tags: [ハッシュ, セキュリティ, ビット演算]
---

## ひとことで

`sipround` は、SipHash という鍵付きのハッシュ関数の中で、4 つの 64 ビットの値（`v0` から `v3`）を混ぜる 1 回分の処理です。SipHash は、この処理を何回か繰り返して、入力のわずかな違いが出力の全ビットに広がるようにします。

このファイルは、Netty の QUIC 関連のコードにある SipHash の実装です。SipHash は鍵を使うハッシュなので、ハッシュ表への攻撃に強い性質を持ちます。この実装では、コンストラクタの引数で、混ぜる回数を指定します。

## コード

```java:line-numbers=131
    private void sipround() {
        v0 += v1;
        v2 += v3;
        v1 = Long.rotateLeft(v1, 13);
        v3 = Long.rotateLeft(v3, 16);
        v1 ^= v0;
        v3 ^= v2;

        v0 = Long.rotateLeft(v0, 32);

        v2 += v1;
        v0 += v3;
        v1 = Long.rotateLeft(v1, 17);
        v3 = Long.rotateLeft(v3, 21);
        v1 ^= v2;
        v3 ^= v0;

        v2 = Long.rotateLeft(v2, 32);
    }
```

## 前提知識

- **SipHash**: 鍵を使うハッシュ関数です。鍵を知らない相手には、出力の規則性が見えにくくなります。そのため、ハッシュ表に大量の衝突を起こす攻撃を防げます。
- **ARX（Add, Rotate, XOR）**: 足し算（Add）、ビットの回転（Rotate）、排他的論理和（XOR）だけで作った混ぜ方です。分岐がなく、高速に動きます。
- **`Long.rotateLeft(x, n)`**: `x` のビットを左へ `n` 個回転させます。左へ出たビットは、右から入ってきます。ビットが失われないのが、通常のシフトとの違いです。
- **状態 `v0` から `v3`**: 4 つの 64 ビットの値で、ハッシュの途中の状態を保持します。`sipround` は、この 4 つを直接書き換えます。

## 何をしているか

### 1. 前半の 4 つの変数を混ぜる

```java:line-numbers=131
    private void sipround() {
        v0 += v1;
        v2 += v3;
        v1 = Long.rotateLeft(v1, 13);
        v3 = Long.rotateLeft(v3, 16);
        v1 ^= v0;
        v3 ^= v2;
```

`v0 += v1` と `v2 += v3` で、それぞれの組を足します。次に `v1` と `v3` を回転し、その後 `v1 ^= v0` と `v3 ^= v2` で、足した結果と XOR を取ります。足し算と回転で、ビットの位置が移動し、XOR で互いの値が混ざります。

### 2. `v0` を 32 ビット回転する

```java:line-numbers=139
        v0 = Long.rotateLeft(v0, 32);
```

`v0` を 32 ビット回転させると、上位 32 ビットと下位 32 ビットが入れ替わります。これにより、次の加算で、前の段階の上位と下位が組み合わされます。

### 3. 後半で、もう一度混ぜる

```java:line-numbers=141
        v2 += v1;
        v0 += v3;
        v1 = Long.rotateLeft(v1, 17);
        v3 = Long.rotateLeft(v3, 21);
        v1 ^= v2;
        v3 ^= v0;

```

後半は、前半と似た形ですが、組み合わせと回転の量が違います。`v2 += v1`、`v0 += v3` で足し、`v1` と `v3` を別の量で回転させます。その後の XOR で、混ざり方が変わります。

### 4. `v2` も 32 ビット回転する

```java:line-numbers=148
        v2 = Long.rotateLeft(v2, 32);
```

最後に `v2` を 32 ビット回転させ、この 1 回分の処理を終えます。

## ここがすごい

- **分岐がない**: `if` や `switch` がなく、命令の流れが一定です。処理時間が入力の中身によって変わりにくくなります。
- **ビットを失わない**: 回転を使うので、シフトと違って、上位のビットが消えません。混ぜ方の情報が保たれます。
- **少ない命令で広く混ぜる**: 数個の命令を 1 回分として、それを繰り返すだけで、全部のビットが互いに影響するようになります。
- **鍵付きで攻撃に強い**: 中の計算は公開されていても、鍵を知らなければ、出力を予測しにくくなります。

## まとめ

- `sipround` は、4 つの 64 ビットの値を、足し算、回転、XOR の組み合わせで 1 回混ぜる。
- 回転を使うので、ビットが失われず、全部のビットが互いに影響する。
- 分岐がなく、鍵付きのハッシュとして、入力の偏りの攻撃に強い。
