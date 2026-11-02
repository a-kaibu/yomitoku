---
title: "1 行で 2 のべき乗に切り上げる"
description: "LMAX Disruptor の Util.ceilingNextPowerOfTwo。値より大きいか等しい最小の 2 のべき乗を、先頭の 0 の個数から 1 回のシフトで求める。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2011 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/util/Util.java
lines: [36, 39]
function: "Util.ceilingNextPowerOfTwo"
difficulty: 1
format: 2
tags: [ビット演算, 数値計算, 最適化]
---

## ひとことで

`Util.ceilingNextPowerOfTwo(x)` は、`x` 以上で最小の 2 のべき乗を返します。たとえば 5 なら 8、8 なら 8 を返します。LMAX Disruptor では、リングバッファのサイズを 2 のべき乗にするために使われています。

ループを使わずに、ビットの数え方だけで答えを出すのが特徴です。

## コード

```java:line-numbers=36
    public static int ceilingNextPowerOfTwo(final int x)
    {
        return 1 << (Integer.SIZE - Integer.numberOfLeadingZeros(x - 1));
    }
```

## 前提知識

- **2 のべき乗**: 1, 2, 4, 8, 16 のように、2 を何回か掛けた数です。2 進数では 1 つのビットだけが立っています。
- **リングバッファ**: 配列を端から端まで円のようにつなげて使うキューです。添字が配列のサイズを超えないように、2 のべき乗のサイズを使うと、割り算の代わりにビットの AND で位置を求められます。
- **`Integer.numberOfLeadingZeros(x)`**: `x` の先頭にある 0 の個数です。
- **`1 << n`**: 1 を `n` 桁左へずらした値で、2 の `n` 乗になります。
- **`final` 引数**: 関数の中で引数を書き換えないことを示すキーワードです。

## 何をしているか

### 1. 1 を引いてから桁を数える

```java:line-numbers=38
        return 1 << (Integer.SIZE - Integer.numberOfLeadingZeros(x - 1));
```

`x - 1` の先頭の 1 の位置を `numberOfLeadingZeros` で求めます。`x` そのものを使うと、ちょうど 2 のべき乗の値（8 など）が次の段に送られてしまうので、1 を引いて調整しています。

### 2. 桁数の分だけ 1 を左へずらす

同じ式で、`Integer.SIZE`（32）から先頭の 0 の個数を引いた値は、`x - 1` を表すのに必要なビット数です。その桁数だけ 1 を左へずらすと、`x` 以上の最小の 2 のべき乗になります。

- `x = 5`: `x - 1 = 4`（`100`、3 桁）なので、`1 << 3 = 8`。
- `x = 8`: `x - 1 = 7`（`111`、3 桁）なので、`1 << 3 = 8`。

## ここがすごい

- **1 行で終わる**: 2 のべき乗を探すループや、対数の計算がありません。CPU が 1 回の命令で桁数を数えられるので、とても速く動きます。
- **1 を引く小さな工夫**: `x - 1` を使うことで、2 のべき乗の境界の値を正しく扱えます。この 1 行の工夫がないと、8 が 16 に丸められてしまいます。
- **用途に合った値**: リングバッファでは、添字を 2 のべき乗のマスクで求めるので、サイズをこの関数で揃えます。ビット演算のための前処理として、とても相性がよい書き方です。
- **注意すべき上限**: `x` が 2^30 を超えると、結果の `1 << 31` が負の数になってしまいます。実際の利用では、この範囲の値は入らないように設計されています。

## まとめ

- `x - 1` の桁数から 1 を左へずらすと、`x` 以上の最小の 2 のべき乗が得られる。
- 1 を引くことで、ちょうど 2 のべき乗の値をそのまま返せる。
- 2 のべき乗のサイズは、リングバッファの添字計算をビット演算に変える。
