---
title: "EnumSet の範囲を、1 つの long のビットの並びで表す"
description: "Java 標準の RegularEnumSet.addRange。列挙子の順番（序数）を long のビット番号にし、-1L を右へずらした値を左へずらして、連続した範囲のビットを一度に立てる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2003, 2022, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/RegularEnumSet.java
lines: [49, 51]
function: "RegularEnumSet.addRange"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 数値計算]
---

## ひとことで

`EnumSet` は、列挙型（`enum`）の値の集合を表すクラスです。要素が 64 個以下の列挙型では、`RegularEnumSet` が 1 つの `long` の各ビットを、各要素に割り当てて集合を持ちます。

`addRange` は、`from` から `to` までの範囲をまとめて集合に入れるメソッドです。ループで 1 つずつ入れるのではなく、範囲の分のビットを 1 回の計算で作ります。

## コード

```java:line-numbers=49
    void addRange(E from, E to) {
        elements = (-1L >>>  (from.ordinal() - to.ordinal() - 1)) << from.ordinal();
    }
```

## 前提知識

- **序数（ordinal）**: 列挙子が宣言された順番で、0 から始まる整数です。`ordinal()` で得られます。`RegularEnumSet` は、この序数を `long` のビット番号として使います。
- **符号つきの `-1L`**: 全部のビットが 1 の値です。`-1L >>> n` は、下位 `64 - n` ビットだけが 1 の値になります。
- **符号なしの右シフト `>>>`**: 左から 0 を入れて、ビットを右へずらします。
- **シフト量は 64 で割った余り**: Java の `long` のシフトは、シフト量の下位 6 ビットだけを使います。負の数を入れると、64 を足した値（64 で割った余り）として働きます。
- **`elements`**: この集合の中身を表す `long` のフィールドです。ビット `i` が 1 なら、序数 `i` の列挙子が入っています。

## 何をしているか

### 1. 範囲の長さの分だけ 1 を作る

```java:line-numbers=50
        elements = (-1L >>>  (from.ordinal() - to.ordinal() - 1)) << from.ordinal();
```

`from.ordinal() - to.ordinal() - 1` は、`from` から `to` までの要素数を、負の数にしたものです。たとえば序数 1 から 3 までなら、`1 - 3 - 1 = -3` になります。

`-1L >>> -3` は、シフト量が `-3` の下位 6 ビット、つまり `61` として働き、下位 3 ビットだけが 1 の値になります。この 3 ビットが、範囲の要素の数だけ立ったビットです。

### 2. 開始の位置まで左へずらす

同じ式の `<< from.ordinal()` で、作った 1 の並びを、開始の序数の位置まで左へずらします。序数 1 から 3 の例では、ビット 1、2、3 が立ちます。

### 3. 全部のビットを立てる、反転する

```java:line-numbers=53
    void addAll() {
        if (universe.length != 0)
            elements = -1L >>> -universe.length;
    }
```

`addAll` は、全部のビットを立てます。`-1L >>> -universe.length` で、列挙子の数の分だけ下位のビットを 1 にします。

```java:line-numbers=58
    void complement() {
        if (universe.length != 0) {
            elements = ~elements;
            elements &= -1L >>> -universe.length;  // Mask unused bits
        }
    }
```

`complement` は、今の集合を反転します。反転したあと、列挙子の数より上のビットをマスクで 0 に戻します。この 2 つの式が同じ形のマスクを使っていることに注目してください。

## ここがすごい

- **ループを使わない**: 範囲が長くても、シフトを 2 回するだけで範囲のビットが決まります。
- **負の数をシフト量に使う**: `from.ordinal() - to.ordinal() - 1` の負の値を、そのままシフト量にしています。64 で割った余りとして働く性質を使い、要素の数を別の変数に保存せずに済みます。
- **マスクを 1 つの式で作る**: 列挙子の数が 64 未満のとき、`-1L >>> -universe.length` は、使うビットだけが 1 の値を作ります。`addAll` と `complement` で同じ考え方を使えます。

## まとめ

- `addRange` は、序数の差から要素の数を求め、`-1L >>> -n` で `n` 個の 1 を作る。
- その 1 の並びを、開始の序数の位置まで左へずらして、範囲のビットを一度に立てる。
- 負のシフト量が 64 で割った余りとして働く性質で、分岐なしに範囲の長さを扱う。
