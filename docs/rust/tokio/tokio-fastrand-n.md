---
title: 割り算をせずに 0 以上 n 未満の乱数を作る
description: tokio の FastRand が、乱数 1 個と n から範囲内の値を作る関数。乱数に n を掛けて上位 32 ビットを取る。モジュロの代わりに掛け算を使う。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/util/rand.rs
lines: [70, 76]
function: FastRand::fastrand_n
difficulty: 3
format: 2
tags: [乱数, 数値計算, 最適化]
---

## ひとことで

`fastrand_n` は、0 以上 `n` 未満の乱数を作る関数です。たとえば `n` が 10 なら、0 から 9 までのどれかを返します。
普通なら、乱数を `n` で割った余りを使います。この関数は、その代わりに **乱数に `n` を掛けて、上位の 32 ビットを取る** という方法を使います。割り算がないので速く、コメントにあるように、剰余より速いのが目的です。

tokio では、タスクのスケジューリングや、待ち時間のずらしなどで、軽い乱数が必要になります。暗号には使えないけれど速い、という用途向けです。

## コード

::: code-group

```rust:line-numbers=70 [日本語訳]
    #[cfg(any(feature = "macros", feature = "sync", feature = "rt"))]
    pub(crate) fn fastrand_n(&mut self, n: u32) -> u32 {
        // fastrand() % n と似ているが、より速い方法
        // 参照: https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/
        let mul = (self.fastrand() as u64).wrapping_mul(n as u64);
        (mul >> 32) as u32
    }
```

```rust:line-numbers=70 [原文]
    #[cfg(any(feature = "macros", feature = "sync", feature = "rt"))]
    pub(crate) fn fastrand_n(&mut self, n: u32) -> u32 {
        // This is similar to fastrand() % n, but faster.
        // See https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/
        let mul = (self.fastrand() as u64).wrapping_mul(n as u64);
        (mul >> 32) as u32
    }
```

:::

`fastrand` は、このファイルの中で状態を進める乱数生成器です。`fastrand_n` は、その出力を範囲に変換するだけの関数です。

## 前提知識

- **剰余（%）**: 割った余りです。`x % n` は 0 以上 n 未満の値になりますが、割り算が必要です。
- **`u64` への変換**: `as u64` で 32 ビットの値を 64 ビットに広げます。掛け算の結果を溢れさせないための準備です。
- **`wrapping_mul`**: 掛け算の結果が 64 ビットを超えても止まらず、余りを返す掛け算です。ここでは、32 ビット × 32 ビットが 64 ビットに収まるので、溢れは起きません。
- **上位ビット**: 64 ビットの積の上の 32 ビットです。`>> 32` で取り出します。
- **乱数の範囲**: `fastrand` は 0 から 2^32 − 1 までの `u32` を返します。その範囲を、0 以上 n 未満に写す必要があります。

## 何をしているか

### 1. 乱数に n を掛ける

```rust:line-numbers=74
        let mul = (self.fastrand() as u64).wrapping_mul(n as u64);
```

`fastrand()` で得た 32 ビットの乱数を、64 ビットに広げて `n` を掛けます。32 ビット × 32 ビットの積は、64 ビットに必ず収まります。

### 2. 上位 32 ビットを答えにする

```rust:line-numbers=75
        (mul >> 32) as u32
```

積を 32 ビット右にずらすと、上位 32 ビットが残ります。乱数が 0 から 2^32 − 1 まで一様に散らばっていれば、この結果は 0 から n − 1 までの値になります。

## ここがすごい

- **割り算がない**: 余りを求める割り算は、掛け算より時間がかかります。この関数は掛け算とずらしだけで範囲に写せます。
- **範囲の変換が公平に近い**: 範囲の端に近い値が、ほかの値より多く出るというモジュロの偏りを、大きく減らせます。
- **コメントに参照がある**: 参照先の記事は、Daniel Lemire が書いた剰余の代わりの方法です。この考え方は、rand クレートの範囲サンプリングにも見られます。
- **ただし厳密ではない**: 拒否して取り直す処理を入れていないので、わずかな偏りが残ります。乱数の厳密さより速さを選んだ、軽い用途向けの関数です。
- **状態を変えるのは `fastrand` だけ**: この関数は `self` を変えず、`fastrand` の結果を使うだけです。役割を分けることで、読みやすくなっています。

## まとめ

- 0 以上 n 未満の乱数は、乱数に n を掛けて上位 32 ビットを取ると割り算なしで作れる。
- 厳密な一様ではないが、速さを重視する用途に向いている。
- 乱数の生成と範囲への変換を分けて書くことで、役割が明確になる。
