---
title: 配列を 1 回ずつ入れ替えて、ランダムに並べ替える
description: crossbeam-channel の shuffle。スレッドごとの小さな乱数生成器（Xorshift）と、掛け算で範囲に収める方法を使い、Fisher–Yates の入れ替えを行う。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-channel/src/utils.rs
lines: [7, 40]
function: shuffle
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 最適化]
---

## ひとことで

`shuffle` は、スライスの要素を **ランダムな順番に並べ替える** 関数です。各位置 `i` について、先頭から `i` までの中から 1 つを同じ確率で選び、入れ替えていきます。この方法は **Fisher–Yates のシャッフル** と呼ばれる、偏りのない並べ替えです。
乱数は、スレッドごとに持つ小さな生成器（Xorshift という仕組み）から取り出します。そのため、外部の乱数ライブラリに頼らず、並べ替えを軽く行えます。

crossbeam-channel の `select` では、待っている複数の操作を試す順番を公平にするために、この関数が使われています。

## コード

::: code-group

```rust:line-numbers=7 [日本語訳]
pub(crate) fn shuffle<T>(v: &mut [T]) {
    let len = v.len();
    if len <= 1 {
        return;
    }

    std::thread_local! {
        static RNG: Cell<Wrapping<u32>> = const { Cell::new(Wrapping(1_406_868_647)) };
    }

    let _ = RNG.try_with(|rng| {
        for i in 1..len {
            // 32 ビット版の Xorshift です。
            //
            // 出典: https://en.wikipedia.org/wiki/Xorshift
            let mut x = rng.get();
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            rng.set(x);

            let x = x.0;
            let n = i + 1;

            // `let j = x % n` の代わりに使える、速い方法です。
            //
            // 作者: Daniel Lemire
            // 出典: https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/
            let j = ((x as u64).wrapping_mul(n as u64) >> 32) as u32 as usize;

            v.swap(i, j);
        }
    });
}
```

```rust:line-numbers=7 [原文]
pub(crate) fn shuffle<T>(v: &mut [T]) {
    let len = v.len();
    if len <= 1 {
        return;
    }

    std::thread_local! {
        static RNG: Cell<Wrapping<u32>> = const { Cell::new(Wrapping(1_406_868_647)) };
    }

    let _ = RNG.try_with(|rng| {
        for i in 1..len {
            // This is the 32-bit variant of Xorshift.
            //
            // Source: https://en.wikipedia.org/wiki/Xorshift
            let mut x = rng.get();
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            rng.set(x);

            let x = x.0;
            let n = i + 1;

            // This is a fast alternative to `let j = x % n`.
            //
            // Author: Daniel Lemire
            // Source: https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/
            let j = ((x as u64).wrapping_mul(n as u64) >> 32) as u32 as usize;

            v.swap(i, j);
        }
    });
}
```

:::

`RNG` は、`thread_local!` で作られた乱数の状態です。スレッドごとに別々の値を持つので、同時に呼んでも互いに邪魔しません。

## 前提知識

- **Fisher–Yates のシャッフル**: 配列の各位置に、その位置までの範囲から要素をランダムに選んで入れ替える方法です。すべての並び方が、同じ確率で出ることが保証されます。
- **`thread_local!`**: スレッドごとに別々の値を持つ変数を作るマクロです。`Cell` と組み合わせると、変更可能な値をスレッドの中で持てます。
- **Xorshift**: ビットのずらしと排他的論理和だけで、次の乱数を作る方法です。小さく速いので、単純な乱数に向いています。
- **`Wrapping<u32>`**: 溢れても止まらず、2^32 で割った余りになる整数の型です。
- **`swap`**: スライスの 2 つの位置の要素を入れ替えます。

## 何をしているか

### 1. 乱数の状態を進める

```rust:line-numbers=22
            let mut x = rng.get();
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            rng.set(x);
```

`RNG` の状態を、Xorshift の 3 段階（13 ビット左、17 ビット右、5 ビット左）で進めます。結果の `x` は、この段階の後の値です。

### 2. 範囲内の位置を選ぶ

```rust:line-numbers=28
            let x = x.0;
            let n = i + 1;

            // This is a fast alternative to `let j = x % n`.
            //
            // Author: Daniel Lemire
            // Source: https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/
            let j = ((x as u64).wrapping_mul(n as u64) >> 32) as u32 as usize;
```

`n` は、まだ決まっていない範囲の大きさ（`i + 1`）です。乱数 `x` に `n` を掛けて、上位 32 ビットを取ると、0 から `i` までの位置 `j` が得られます。割り算を使わないので、剰余より速く求められます。

### 3. 位置 i と j を入れ替える

```rust:line-numbers=37
            v.swap(i, j);
        }
```

`v.swap(i, j)` で、今の位置 `i` と選ばれた位置 `j` の要素を入れ替えます。`j` が `i` と同じ場合は、何も変わりません。これを `i` が 1 から `len - 1` まで繰り返します。

## ここがすごい

- **偏りのない並べ替え**: 各位置で、先頭から `i` までの要素を同じ確率で選ぶので、すべての並び方が同じ確率になります。単純に毎回ランダムな位置を 2 つ入れ替える方法は、偏りが出やすいと知られています。
- **乱数の状態がスレッドごとに分かれる**: `thread_local!` と `Cell` で、ロックを使わずに状態を更新できます。複数のスレッドが同時に並べ替えても、競合が起きません。
- **`try_with` で終了処理に強い**: スレッドが終わる途中で、`thread_local!` の値にアクセスできないことがあります。`try_with` を使うと、そのときにパニックせず、並べ替えを諦められます。
- **乱数の範囲変換に掛け算を使う**: `j = (x * n) >> 32` は、剰余の代わりに使える速い方法です。出典として Lemire の記事が挙げられています。
- **短い配列では何もしない**: 要素が 1 つ以下のときは、すぐに返します。無駄な処理を省いています。

## まとめ

- Fisher–Yates の方法で、各位置で先頭からの範囲の要素を選んで入れ替えると、偏りなく並べ替えられる。
- 乱数は、スレッドごとの Xorshift の状態から取り出す。
- 範囲の変換に掛け算とずらしを使い、剰余より速くしている。
