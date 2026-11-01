---
title: 乱数のビットを節約して 1/d の確率を作る
description: rand が、1/d の確率で true を返す関数。2 のべき乗の確率とコイン投げを組み合わせ、割り算や多くの乱数を使わずに判定する。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/seq/coin_flipper.rs
lines: [26, 44]
function: CoinFlipper::random_ratio_one_over
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, ビット演算]
---

## ひとことで

`random_ratio_one_over` は、**1 / d の確率で true を返す** 関数です。たとえば `d` が 6 なら、だいたい 6 回に 1 回だけ true になります。
一番素直な方法は、乱数を作って `% d` の結果を比べることです。この関数は、その代わりに **コイン投げを組み合わせて、必要な乱数のビット数を少なく抑える** 方法を使います。

rand クレートでは、配列からランダムに 1 つの要素を選ぶ処理などで使われています。乱数のビットを節約することは、長い配列を何度も扱うときに効いてきます。

## コード

::: code-group

```rust:line-numbers=26 [日本語訳]
    #[inline]
    /// 1 / d の確率で true を返す
    /// 期待値として 2 ビットの乱数を使う
    /// d == 0 のときはパニックする
    pub fn random_ratio_one_over(&mut self, d: usize) -> bool {
        debug_assert_ne!(d, 0);
        // `random_ratio` と同じ考え方だが、分子が 1 の場合に最適化している
        // 最初の分子は 1 である（`Sequence::Choose()` では必ずそう）

        // この場合（`random_ratio` ではなく）、c の求め方は常に正確である
        let c = (usize::BITS - 1 - d.leading_zeros()).min(32);

        if self.flip_c_heads(c) {
            let numerator = 1 << c;
            self.random_ratio(numerator, d)
        } else {
            false
        }
    }
```

```rust:line-numbers=26 [原文]
    #[inline]
    /// Returns true with a probability of 1 / d
    /// Uses an expected two bits of randomness
    /// Panics if d == 0
    pub fn random_ratio_one_over(&mut self, d: usize) -> bool {
        debug_assert_ne!(d, 0);
        // This uses the same logic as `random_ratio` but is optimized for the case that
        // the starting numerator is one (which it always is for `Sequence::Choose()`)

        // In this case (but not `random_ratio`), this way of calculating c is always accurate
        let c = (usize::BITS - 1 - d.leading_zeros()).min(32);

        if self.flip_c_heads(c) {
            let numerator = 1 << c;
            self.random_ratio(numerator, d)
        } else {
            false
        }
    }
```

:::

この関数の中で使われる `flip_c_heads` は、乱数のビットを少しずつ取り出して、表（ヘッド）が続くかを確かめる補助関数です。

## 前提知識

- **確率 1 / d**: 0 から d−1 までの乱数を作って、ちょうど 0 が出る確率と同じです。
- **コイン投げ**: 1 回のコインは、表か裏かの 1 ビットの情報を持ちます。ここでは「表が c 回続いたか」を 1 回の判定にまとめます。
- **`leading_zeros`**: 整数の上の位から、連続する 0 の数を数えます。`d` の最上位の 1 の位置が分かるので、2 のべき乗の近似に使えます。
- **`usize::BITS`**: `usize` のビット数です。環境によって 32 や 64 になります。
- **`min`**: 2 つの値のうち小さいほうを返します。ここでは c を 32 以下に抑えるために使っています。

## 何をしているか

### 1. 2 のべき乗で近い確率を決める

```rust:line-numbers=36
        let c = (usize::BITS - 1 - d.leading_zeros()).min(32);
```

`d` の最上位のビットの位置から、`c = floor(log2 d)` を求めます。このとき `2^c ≤ d < 2^(c+1)` なので、`1 / 2^c` は `1 / d` より大きく、その差は 2 倍未満です。32 で止めるのは、一度に確認するコインを 32 枚以下に抑えるためです。

### 2. c 回続けて表なら、残りを判定する

```rust:line-numbers=38
        if self.flip_c_heads(c) {
            let numerator = 1 << c;
            self.random_ratio(numerator, d)
        } else {
            false
        }
```

`flip_c_heads(c)` は、`c` 回のコインがすべて表になったかを返します。すべて表なら、確率 `1 / 2^c` を通過したことになります。そのとき `numerator = 1 << c` と `d` で `random_ratio` を呼び、残りの確率 `2^c / d` を判定します。両方を掛けると `1 / 2^c × 2^c / d = 1 / d` になります。
途中で 1 回でも裏が出たら、ここで false を返します。

## ここがすごい

- **乱数のビットを節約する**: 1 / d の判定を、毎回 `% d` の結果で作ると、必要な乱数の量が大きくなります。この方法では、期待値として 2 ビット程度しか使いません。
- **割り算を使わない**: 判定は `leading_zeros`、比較、シフトだけで済みます。`d` で割る操作を毎回行う必要がありません。
- **確率の掛け算を式で追える**: 2 段階に分けると、それぞれの確率が `1 / 2^c` と `2^c / d` になり、掛けると `1 / d` になります。関数の名前と計算が一致しています。
- **桁あふれを防ぐ上限**: `c` を 32 以下に抑えているので、`numerator` が `usize` に収まり、シフトの値も安全な範囲に入ります。
- **コメントで理屈を残している**: 近い関数 `random_ratio` の中に、公平である理由が丁寧に書かれています。この関数は、その特別な場合として読むと分かりやすくなります。

## まとめ

- `1 / d` の確率は、2 のべき乗の確率と残りの確率に分けて判定できる。
- 期待値で 2 ビット程度の乱数で済むので、乱数の使い方が節約される。
- 割り算を使わず、先頭の 0 の数とシフトで効率よく判定する。
