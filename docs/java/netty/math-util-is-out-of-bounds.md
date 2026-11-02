---
title: "負の数を 1 回の OR で見つけて、範囲外を判定する"
description: "Netty の MathUtil.isOutOfBounds。index・length・capacity と index + length の 4 つを OR でまとめ、符号ビットが立つかで負の値と加算の溢れを見つけ、範囲外かを判定する。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2015 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/MathUtil.java
lines: [63, 65]
function: "MathUtil.isOutOfBounds"
difficulty: 2
format: 2
tags: [ビット演算, 防御的プログラミング, 数値計算]
---

## ひとことで

`isOutOfBounds(index, length, capacity)` は、`index` から `length` 個の要素を読み書きすると、容量 `capacity` の外に出てしまうかを判定するメソッドです。外に出るなら `true` を返します。

Netty は、バッファの読み書きの前に、この判定で範囲を確かめます。範囲外のアクセスは、データの破壊や脆弱性につながるので、この確認は多くの場所で使われます。

## コード

```java:line-numbers=63
    public static boolean isOutOfBounds(int index, int length, int capacity) {
        return (index | length | capacity | index + length) < 0 || index + length > capacity;
    }
```

## 前提知識

- **範囲外（out of bounds）**: 配列やバッファで、許された位置の外を読んだり書いたりすることです。
- **符号ビット**: `int` の最上位ビットです。これが 1 なら、その値は負の数になります。
- **OR（`|`）**: 2 つの値のビットを 1 つでも 1 があれば 1 にする演算です。複数の値を OR すると、どれか 1 つでも符号ビットが立っていれば、結果の符号ビットも立ちます。
- **整数の溢れ**: `index + length` が `int` の最大値を超えると、負の数に折り返します。この場合も、符号ビットが立ちます。

## 何をしているか

### 1. 負の値と溢れを、OR で一度にまとめて調べる

```java:line-numbers=64
        return (index | length | capacity | index + length) < 0 || index + length > capacity;
```

`index | length | capacity | index + length` は、4 つの値を OR でまとめた値です。どれか 1 つでも負の数なら、その符号ビットが立ち、結果は負になります。`index + length` が溢れた場合も、負の数に折り返すので、同じように検出されます。`< 0` の 1 回の比較で、この 4 つの検査をまとめて済ませています。

### 2. 容量を超えていないかを、比較で確かめる

```java:line-numbers=64
        return (index | length | capacity | index + length) < 0 || index + length > capacity;
```

OR の判定を通ったあとで、`index + length > capacity` を比べます。これで、末尾が容量を超えるかどうかが分かります。

## ここがすごい

- **分岐が 1 つで済む**: 4 つの値の負の数チェックを、`if` を 4 回書く代わりに、OR と 1 回の比較で行います。
- **溢れも同時に検出する**: `index + length` の溢れは、それ自体が負の値として現れるので、特別な処理がいりません。
- **負の値が入る不正な呼び出しも防げる**: 引数の 1 つでも負なら、その時点で範囲外とみなされます。不正な値が通り抜けるのを防ぎます。
- **条件の順序が読みやすい**: 前半で「値が壊れていないか」を、後半で「容量を超えていないか」を確かめる、という 2 段階の形になっています。

## まとめ

- `isOutOfBounds` は、4 つの値を OR でまとめて符号ビットを見れば、負の値と溢れを 1 回で検出できる。
- そのあとで、末尾が容量を超えるかを比べる。
- 分岐を減らしながら、不正な引数と溢れの両方を防ぐ、防御的な書き方になっている。
