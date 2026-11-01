---
title: 掛け算の上位ビットで範囲内の乱数を作る方法
description: rand クレートが、範囲内の整数を偏りなく選ぶときに使う Lemire の方法。割り算を使わず、乱数と範囲の掛け算の上位ビットを答えにする。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/distr/uniform_int.rs
lines: [149, 165]
function: UniformInt::sample
difficulty: 2
format: 2
tags: [乱数, 数値計算, ビット演算, 最適化]
---

## ひとことで

`UniformInt::sample` は、ある範囲の整数を、偏りなく一様に選ぶ関数です。たとえば 0 以上 6 未満なら、0 から 5 までが同じ確率で出ます。
この関数は「乱数に範囲の大きさを掛けて、結果の上位ビットを答えにする」という方法を使います。割り算をほとんど使わないので速く、しかも数字ごとの出やすさに偏りが出ません。

この方法は Daniel Lemire が考えたもので、コメントにある「Lemire's method, unbiased」の版です。

## コード

::: code-group

```rust:line-numbers=149 [日本語訳]
            /// 分布からのサンプル。Lemire の方法で、偏りのない版
            #[inline]
            fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> Self::X {
                let range = self.range as $uty as $sample_ty;
                if range == 0 {
                    return rng.random();
                }

                let thresh = self.thresh as $uty as $sample_ty;
                let hi = loop {
                    let (hi, lo) = rng.random::<$sample_ty>().wmul(range);
                    if lo >= thresh {
                        break hi;
                    }
                };
                self.low.wrapping_add(hi as $ty)
            }
```

```rust:line-numbers=149 [原文]
            /// Sample from distribution, Lemire's method, unbiased
            #[inline]
            fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> Self::X {
                let range = self.range as $uty as $sample_ty;
                if range == 0 {
                    return rng.random();
                }

                let thresh = self.thresh as $uty as $sample_ty;
                let hi = loop {
                    let (hi, lo) = rng.random::<$sample_ty>().wmul(range);
                    if lo >= thresh {
                        break hi;
                    }
                };
                self.low.wrapping_add(hi as $ty)
            }
```

:::

この関数で使う閾値（`thresh`）は、関数の中では作られず、範囲を決めるときに 1 回だけ計算されて `self` に保存されています。

```rust:line-numbers=134
                let range = high.wrapping_sub(low).wrapping_add(1) as $uty;
                let thresh = if range > 0 {
                    let range = $sample_ty::from(range);
                    (range.wrapping_neg() % range)
```

## 前提知識

- **範囲の表し方**: `self.low` は最小値、`self.range` は取りうる値の個数です。`low` から `low + range - 1` までの整数を返すのが目的です。
- **`wmul`**: 2 つの整数を掛けて、結果を上位の半分（`hi`）と下位の半分（`lo`）に分けて返す操作です。たとえば 32 ビットどうしの掛け算は 64 ビットの結果になり、その上位 32 ビットと下位 32 ビットに分かれます。rand クレートでは `distr/utils.rs` にあるトレイトとして実装されています。
- **`rng.random::<$sample_ty>()`**: 乱数生成器から、ある整数型の全範囲の値を 1 つ取り出します。`$sample_ty` は、マクロの中で決まる整数型の名前です。
- **`loop` と `break 値`**: Rust の `loop` は、`break` に値を付けると、その値をループ全体の結果にできます。ここでは `break hi;` で `hi` を返しています。
- **`wrapping_neg` と剰余**: `wrapping_neg` は符号を反転した値を、溢れても止まらずに計算します。`range.wrapping_neg() % range` は、範囲の大きさを使って偏りの量を求める式です。

## 何をしているか

### 1. 範囲が全ビットのときは乱数をそのまま返す

```rust:line-numbers=152
                let range = self.range as $uty as $sample_ty;
                if range == 0 {
                    return rng.random();
                }
```

`range` が 0 になるのは、範囲の大きさがちょうど型の全ビットの値（たとえば `u32` 全体）のときです。この場合は範囲による切り捨てが必要ないので、乱数をそのまま返します。

### 2. 乱数を範囲の大きさで掛ける

```rust:line-numbers=158
                let hi = loop {
                    let (hi, lo) = rng.random::<$sample_ty>().wmul(range);
```

乱数 `x` を取り出し、`x × range` の上位ビット `hi` を答えの候補にします。`x` が型の全範囲に一様に散らばっていれば、`hi` の値は 0 から `range - 1` まで、ほぼ均等に現れます。

### 3. 下位ビットが閾値より小さいときだけ取り直す

```rust:line-numbers=160
                    if lo >= thresh {
                        break hi;
                    }
```

`lo` は積の下位の部分です。`lo` が閾値 `thresh` より小さいときは、`hi` の分布がわずかに偏ってしまうので、乱数を取り直します。`lo >= thresh` のときだけ `break hi` で結果を返します。

### 4. 下端の値を足して返す

```rust:line-numbers=164
                self.low.wrapping_add(hi as $ty)
```

`hi` は 0 から `range - 1` までの値です。最後に `self.low` を足して、目的の範囲の値に移します。`wrapping_add` を使うのは、符号付きの足し算で溢れても、ビットの上では正しい値になるようにするためです。

## ここがすごい

- **割り算を通常の経路で使わない**: 愚直に `x % range` で割る方法は、毎回割り算が必要です。割り算は掛け算よりずっと遅いので、この方法では掛け算 1 回で答えの候補が出ます。
- **偏りを取り除ける**: 単に `x % range` を返すと、範囲が 2 の冪でないとき小さい値が出やすくなります。Lemire の方法は、`lo` を見て偏りの出る部分だけを捨てるので、どの値も同じ確率になります。
- **重い計算を事前に済ませる**: 閾値を求めるには割り算が必要ですが、範囲ごとに 1 回だけ計算して保存します。サンプリングのたびに割り算をするのは避けられています。
- **再試行はごく稀**: 取り直すのは `lo` が閾値より小さいときだけです。その確率は小さく、普通の使い方ではほぼ 1 回で終わります。
- **マクロで型ごとに量産している**: `$uty` や `$sample_ty` のようなマクロ変数を使い、同じロジックを複数の整数型に展開しています。型ごとに同じ処理を書く手間を省いています。

## まとめ

- 乱数に範囲の大きさを掛けて上位ビットを答えにすると、割り算なしで範囲内の整数が作れる。
- 下位ビットが閾値より小さいときだけ取り直すと、偏りをなくせる。
- 閾値のような重い計算は、範囲ごとに 1 回だけ行い、保存しておく。
