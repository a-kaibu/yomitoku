---
title: "上位と下位を何度も混ぜる MurmurHash3 の仕上げ"
description: "Apache Commons Codec の MurmurHash3.fmix32。XOR・右シフト・掛け算を交互に 2 回ずつ行い、1 ビットの違いが全体に広がるようにする最終化処理（fmix）。"
language: java
project: Apache Commons Codec
repo: https://github.com/apache/commons-codec
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "7fa065c5b5f78c66322b9f33f5e396b2c2b62c27"
file: src/main/java/org/apache/commons/codec/digest/MurmurHash3.java
lines: [350, 357]
function: "MurmurHash3.fmix32"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 数値計算]
---

## ひとことで

`fmix32(hash)` は、MurmurHash3 の最後に 1 回だけ呼ばれる「仕上げ」の関数です。`int` の値を入力に、ビットを強く混ぜ直して返します。

ハッシュ値では、入力がほんの 1 ビット違うだけでも、出力が大きく変わることが望まれます。この関数は、その性質（アバランシェ効果）を作るための混ぜ方です。

## コード

```java:line-numbers=350
    private static int fmix32(int hash) {
        hash ^= hash >>> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;
        return hash;
    }
```

## 前提知識

- **ハッシュ関数**: データを短い整数に変える関数です。同じ入力からは同じ出力が出ます。
- **MurmurHash3**: Austin Appleby が作ったハッシュ関数です。データを 4 バイトずつ処理し、最後に fmix で仕上げます。
- **`>>>`（符号なし右シフト）**: 上位のビットを下へ移します。上の桁の変化を下の桁へ伝えるために使います。
- **`^=`（XOR の代入）**: 右側の値と XOR した結果を、同じ変数に入れ直します。
- **`*=`（掛け算の代入）**: 掛け算した結果で変数を置き換えます。`int` の範囲を超えると、上位が切り捨てられます。

## 何をしているか

### 1. 上位ビットを下へ混ぜる

```java:line-numbers=351
        hash ^= hash >>> 16;
```

`hash ^= hash >>> 16` で、上位 16 ビットを下位へ XOR します。上位で起きた違いが、下位にも伝わるようになります。

### 2. 掛け算で桁を広げる

```java:line-numbers=352
        hash *= 0x85ebca6b;
```

`hash *= 0x85ebca6b` は、定数を掛けて全体の桁を揺らします。掛け算では、下の桁の変化が上の桁へ伝わります。上の XOR と合わせることで、両方向に混ざります。

### 3. 同じ手順をもう一度

```java:line-numbers=353
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;
```

`>>> 13` で XOR、`*= 0xc2b2ae35` で掛け算、最後に `>>> 16` で XOR します。シフト量を 16、13、16 と変えることで、同じ操作を繰り返しても同じパターンにならず、偏りが残りにくくなります。

## ここがすごい

- **XOR と掛け算を交互に使う**: XOR はビットを独立に混ぜ、掛け算は桁を上へ伝えます。性質の違う 2 つの演算を組み合わせることで、少ない命令で強く混ざります。
- **アバランシェ効果**: 入力の 1 ビットが変わると、出力のおよそ半分のビットが変わるように設計されています。ハッシュ表で値が偏らずに散らばるのは、この性質のおかげです。
- **定数は乱数に近いもの**: `0x85ebca6b` や `0xc2b2ae35` は、ビットの偏りが少ない値として選ばれています。意味のある数というより、よく混ざる数を選んだものです。
- **可逆に近い**: 各ステップは全単射（1 対 1の変換）で、異なる入力が同じ出力になることがありません。ハッシュの途中で情報が失われないように作られています。

## まとめ

- fmix は XOR と掛け算を交互に 2 回ずつ行い、ビットを強く混ぜる。
- 入力の 1 ビットの違いが、出力の広い範囲に広がる。
- MurmurHash3 の最後の仕上げとして、ハッシュ値の偏りを減らす。
