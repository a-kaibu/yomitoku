---
title: "下位ビットがそろっている hashCode を、上の桁まで混ぜて散らす"
description: "JCTools の NonBlockingHashMap.hash。hashCode の上の桁を下へ、下の桁を上へ混ぜて、2 の累乗の表で衝突が減るように広げる。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/maps/NonBlockingHashMap.java
lines: [133, 140]
function: "NonBlockingHashMap.hash"
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, 並行処理]
---

## ひとことで

JCTools の `NonBlockingHashMap` は、ロックを使わずに複数のスレッドから読み書きできるハッシュマップです。値を入れる表の大きさは 2 の累乗で、添字は `hash` の値の下位ビットで決まります。

`hash` は、キーの `hashCode()` を受け取り、ビットを混ぜ直してから返します。`hashCode()` の下位ビットが偏っていても、添字が一か所に集まらないようにするためです。

## コード

::: code-group

```java:line-numbers=133 [日本語訳]
    private static final int hash(final Object key)
    {
        int h = key.hashCode();     //         int h = key.hashCode();     // 実際の hashCode の呼び出し
        h ^= (h >>> 20) ^ (h >>> 12);
        h ^= (h >>> 7) ^ (h >>> 4);
        h += h << 7; //         h += h << 7; // 下位のビットを上へ広げる（hashCode が 1 だけ違う値のため）
        return h;
    }
```

```java:line-numbers=133 [原文]
    private static final int hash(final Object key)
    {
        int h = key.hashCode();     // The real hashCode call
        h ^= (h >>> 20) ^ (h >>> 12);
        h ^= (h >>> 7) ^ (h >>> 4);
        h += h << 7; // smear low bits up high, for hashcodes that only differ by 1
        return h;
    }
```

:::

## 前提知識

- **`hashCode()`**: オブジェクトから作る整数の指紋です。Java の標準のクラスでも、値の作り方が単純なものがあります。
- **表の添字**: 2 の累乗の大きさの表では、添字は `hash & (大きさ - 1)` で決まります。つまり、ハッシュ値の下位の数ビットだけが使われます。
- **右シフトの符号なし版（`>>>`）**: 右へずらすとき、空いた上のビットを 0 で埋めます。上の桁を下の位置へ移すのに使います。
- **XOR（`^`）**: 同じビットなら 0、違えば 1 になる演算です。2 つの値を混ぜるのに使います。

## 何をしているか

### 1. 上の桁を下へ混ぜる

```java:line-numbers=135
        int h = key.hashCode();     //         int h = key.hashCode();     // 実際の hashCode の呼び出し
        h ^= (h >>> 20) ^ (h >>> 12);
        h ^= (h >>> 7) ^ (h >>> 4);
```

`h >>> 20` や `h >>> 12` は、上の桁を下の位置へ移します。それを XOR で `h` に混ぜるので、上の桁の変化が下の桁にも現れます。二段に分けて混ぜるのは、混ぜる範囲を広げるためです。

### 2. 下の桁を上へ広げる

```java:line-numbers=138
        h += h << 7; //         h += h << 7; // 下位のビットを上へ広げる（hashCode が 1 だけ違う値のため）
        return h;
```

`h += h << 7` は、`h` の下位のビットを 7 ビット左へずらして足します。`hashCode` が 1 だけ違うような値は、下位の数ビットしか違わないので、この操作で上の桁にも違いが出ます。

## ここがすごい

- **上と下の両方を混ぜる**: 右シフトで上から下へ、左シフトで下から上へ混ぜるので、どの桁の変化も添字に届きやすくなります。
- **同じ式で、キーの型に関係なく**: どのキーでも `hashCode()` の結果を同じ式で混ぜるので、表の添字の決め方が一つに決まります。
- **例外を投げる場所を一つに**: 先頭のコメントにあるとおり、`key.hashCode()` が `null` のキーで NPE を投げる場所も、ここです。`null` を受け付けないことを、早い段階で示します。
- **加算は乗算より軽い**: `h << 7` と `+` だけで、掛け算を使わずに上の桁を広げます。

## まとめ

- `hash` は、`hashCode()` の上の桁と下の桁を XOR で混ぜ、さらに `h += h << 7` で下の変化を上へ広げる。
- 2 の累乗の表では下位ビットで添字が決まるので、この混ぜ直しで衝突が減る。
- `null` のキーはここで NPE になり、早く検出できる。
