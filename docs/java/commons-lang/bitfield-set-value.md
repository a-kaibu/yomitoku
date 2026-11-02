---
title: "他のビットを守ったまま、一部だけ書き換える"
description: "Apache Commons Lang の BitField.setValue。int の決まった範囲のビットだけを書き換え、ほかのビットは元の値のまま残す。マスクとシフトの定番の組み合わせ。"
language: java
project: Apache Commons Lang
repo: https://github.com/apache/commons-lang
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "0a6e19f9c828d6a9087d55826367f537cef85854"
file: src/main/java/org/apache/commons/lang3/BitField.java
lines: [438, 441]
function: "BitField.setValue"
difficulty: 2
format: 2
tags: [ビット演算, 低レイヤ, 防御的プログラミング]
---

## ひとことで

`BitField.setValue(holder, value)` は、整数 `holder` の中の決まった範囲のビットだけを、`value` で書き換えます。範囲の外にあるビットは、そのまま残ります。

たとえば、1 つの `int` に複数の設定値をまとめて入れておくとき、ある項目だけを変えたいときに使います。`BitField` は、その範囲（ビットの位置と幅）を決めて持っておく部品です。

## コード

```java:line-numbers=438
    public int setValue(final int holder, final int value) {
        final long intMask = intMask();
        return (int) (holder & ~intMask | value << shiftCount & intMask);
    }
```

このメソッドは、同じクラスの `intMask` を使って、対象のビットを表すマスクを求めます。`intMask` は、`int` の範囲に収まらないマスクを使おうとしたときに例外を投げます。

```java:line-numbers=248
    private long intMask() {
        if (mask >>> Integer.SIZE != 0) {
            throw new IllegalStateException("BitField mask 0x" + Long.toHexString(mask) + " exceeds 32 bits; use the long accessors for this field.");
        }
        return mask;
    }
```

## 前提知識

- **マスク**: 特定のビットだけを 1 にした値です。`&` で取り出したり、`~` と組み合わせて外側を残したりします。
- **`~`（ビット反転）**: すべてのビットを反転させます。マスクの外側を表すのに使います。
- **`&`（AND）**: 同じ桁がどちらも 1 のときだけ 1 になります。マスクで範囲を絞るのに使います。
- **`|`（OR）**: どちらかが 1 なら 1 になります。書き換えた部分と残った部分を合わせます。
- **`<<`（左シフト）**: ビットを左へずらします。`value` を書き込む位置に合わせます。

## 何をしているか

### 1. 書き込む範囲をマスクで絞る

```java:line-numbers=439
        final long intMask = intMask();
        return (int) (holder & ~intMask | value << shiftCount & intMask);
```

`intMask()` で、この項目が使うビットの範囲を表す値を得ます。`value << shiftCount` で、書き込む値を目的の位置へずらし、`& intMask` で範囲の外に漏れないように切り取ります。

### 2. 元の値の範囲外を残す

`holder & ~intMask` は、範囲の外側のビットだけを残します。範囲の中は 0 になるので、そこに書き込む値を後で足せます。

### 3. 2 つを OR で合わせる

最後に、残したビットと新しい値を `|` で合わせて返します。範囲の中は新しい値、外側は元の値になります。

## ここがすごい

- **書き換えの定番形**: 「外側を残す」「中へ新しい値を入れる」という 2 段階を、マスク・シフト・OR の 1 行で書いています。ビットフィールドの更新は、ほとんどこの形です。
- **入力を範囲で守る**: `value << shiftCount & intMask` で、大きすぎる値が範囲の外へ漏れません。不正な値を入れても、ほかの項目を壊さない作りです。
- **不変の値として扱える**: 元の `holder` を変えず、新しい値を返します。呼び出し側は、結果を受け取って保存し直すだけです。
- **範囲の大きさを検査する**: `intMask()` は、マスクが 32 ビットを超えるときは例外を投げます。`int` 版を誤って使うと、すぐに分かるようになっています。

## まとめ

- `holder & ~mask | value << shift & mask` で、一部のビットだけを書き換える。
- 範囲の外のビットは、元の値のまま残る。
- マスクで範囲を絞るので、大きな値を入れてもほかの項目を壊さない。
