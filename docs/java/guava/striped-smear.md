---
title: "ロックの番号を決める前に、ハッシュ値の上のビットを下へ混ぜる"
description: "Guava の Striped.smear。key の hashCode の上の方のビットを、シフトと XOR で下のビットへ混ぜ、ロックを分ける番号が偏らないようにする。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/util/concurrent/Striped.java
lines: [524, 527]
function: "Striped.smear"
difficulty: 1
format: 2
tags: [ハッシュ, ビット演算, 並行処理]
---

## ひとことで

Guava の `Striped` は、1 つのロックを何十個かのロックに分けて、キーごとに 1 つを選ぶ仕組みです。同じロックを奪い合う回数が減るので、並列に動く処理が速くなります。

キーのロックを選ぶには、キーの `hashCode()` から番号を作ります。`smear` は、その前に、ハッシュ値のビットを混ぜ直す小さなメソッドです。上の方のビットの違いを、下のビットにも届かせます。

## コード

```java:line-numbers=524
  private static int smear(int hashCode) {
    hashCode ^= (hashCode >>> 20) ^ (hashCode >>> 12);
    return hashCode ^ (hashCode >>> 7) ^ (hashCode >>> 4);
  }
```

## 前提知識

- **`hashCode()`**: オブジェクトから作られる整数です。作り方によっては、下の数ビットだけが似た値になることがあります。
- **ロックの番号**: ロックの配列の添字です。番号が偏ると、一部のロックにだけ待ちが集まります。
- **XOR（`^`）**: 2 つのビットが違うときだけ 1 になる演算です。
- **符号なしの右シフト `>>>`**: 左から 0 を入れて、ビットを右へずらします。上のビットを下へ移すのに使います。

## 何をしているか

### 1. 上の方のビットを、下のビットへ混ぜる

```java:line-numbers=525
    hashCode ^= (hashCode >>> 20) ^ (hashCode >>> 12);
```

`hashCode >>> 20` と `hashCode >>> 12` で、上の方のビットを下へ移します。2 つを XOR してから、元の値へ XOR します。上の 20 ビット目以上と、12 ビット目以上の変化が、下のビットに届きます。

### 2. もう一度、下のビットへ混ぜ直す

```java:line-numbers=526
    return hashCode ^ (hashCode >>> 7) ^ (hashCode >>> 4);
```

同じ考え方で、`>>> 7` と `>>> 4` の 2 つを使って、もう一度混ぜます。1 回目で届いた変化を、さらに下の位置へ広げます。

## ここがすごい

- **掛け算なし**: 乗算は使わず、シフトと XOR だけで混ぜています。とても短く、速く動きます。
- **ロックの番号を決めるのに使う**: `indexFor` は、`key.hashCode()` の値を、まず `smear` に通します。そのあと `hash & mask` で、ロックの番号を決めます。
- **短い関数に絞る**: 4 つのシフトと XOR だけで済むので、`hashCode` の偏りを直すのに、大きな仕組みは要りません。
- **呼び出し元は 1 か所**: コードの中で、`smear` を呼んでいるのは `indexFor` だけです。

## まとめ

- `smear` は、`hashCode` の上の方のビットを、シフトと XOR で下のビットへ 2 段階で混ぜる。
- `indexFor` は、混ぜたあとの値からロックの番号を決める。
- 掛け算を使わず、短い計算でビットを散らす。
