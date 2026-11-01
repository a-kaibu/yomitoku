---
title: 分岐を使わずに、4 要素を安定に並べ替える
description: 標準ライブラリの並べ替えで使う 4 要素の安定ソート。比較の結果で分岐せず、選択（select）で位置を決めるので、予測が外れにくい。比較は 5 回で済む。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/sort/shared/smallsort.rs
lines: [606, 651]
function: sort4_stable
difficulty: 3
format: 2
tags: [アルゴリズム, 最適化, ビット演算]
---

## ひとことで

`sort4_stable` は、**4 つの要素を安定に（同じ値の順序を保って）並べ替える** 関数です。並べ替えの大きな処理の中で、小さな塊を速く並べるために使われます。

普通の並べ替えは、比較の結果によって `if` で分岐します。分岐は、予測が外れると CPU の処理が止まるので、遅くなりがちです。この関数は、分岐の代わりに **選択（select）** で位置を決めます。比較は 5 回で済み、各要素はちょうど 1 回だけコピーされます。

## コード

::: code-group

```rust:line-numbers=606 [日本語訳]
pub unsafe fn sort4_stable<T, F: FnMut(&T, &T) -> bool>(
    v_base: *const T,
    dst: *mut T,
    is_less: &mut F,
) {
    // select でポインタだけを選ぶことで、T の大きさによらず良い cmov のコードになります。
    // さらに、安定な転置の 4 要素ネットワークの 6 回ではなく、5 回の比較で済みます。
    // 比較の回数は、安定な転置による 4 要素のソーティングネットワークより少なくなります。
    // そして、各要素はちょうど 1 回だけコピーされます。

    // SAFETY: すべてのポインタは v_base と dst から高々 3 の位置にあり、
    // 前提条件により、範囲内に収まります。
    unsafe {
        // 2 組の a <= b と c <= d を、安定に作ります。
        let c1 = is_less(&*v_base.add(1), &*v_base);
        let c2 = is_less(&*v_base.add(3), &*v_base.add(2));
        let a = v_base.add(c1 as usize);
        let b = v_base.add(!c1 as usize);
        let c = v_base.add(2 + c2 as usize);
        let d = v_base.add(2 + (!c2 as usize));

        // (a, c) と (b, d) を比べて、最小と最大を決めます。残るのは 2 つの不明な要素です。
        // ただし安定なソートなので、どちらが左側で、どちらが右側かを知る必要があります。
        // どちらが左端で、どちらが右端かを確かめます。
        // c3, c4 | 最小 最大 不明な左 不明な右
        //  0,  0 |  a   d    b         c
        //  0,  1 |  a   b    c         d
        //  1,  0 |  c   d    a         b
        //  1,  1 |  c   b    a         d
        let c3 = is_less(&*c, &*a);
        let c4 = is_less(&*d, &*b);
        let min = hint::select_unpredictable(c3, c, a);
        let max = hint::select_unpredictable(c4, b, d);
        let unknown_left = hint::select_unpredictable(c3, a, hint::select_unpredictable(c4, c, b));
        let unknown_right = hint::select_unpredictable(c4, d, hint::select_unpredictable(c3, b, c));

        // 残りの 2 つの不明な要素を並べ替えます。
        let c5 = is_less(&*unknown_right, &*unknown_left);
        let lo = hint::select_unpredictable(c5, unknown_right, unknown_left);
        let hi = hint::select_unpredictable(c5, unknown_left, unknown_right);

        ptr::copy_nonoverlapping(min, dst, 1);
        ptr::copy_nonoverlapping(lo, dst.add(1), 1);
        ptr::copy_nonoverlapping(hi, dst.add(2), 1);
        ptr::copy_nonoverlapping(max, dst.add(3), 1);
    }
```

```rust:line-numbers=606 [原文]
pub unsafe fn sort4_stable<T, F: FnMut(&T, &T) -> bool>(
    v_base: *const T,
    dst: *mut T,
    is_less: &mut F,
) {
    // By limiting select to picking pointers, we are guaranteed good cmov code-gen
    // regardless of type T's size. Further this only does 5 instead of 6
    // comparisons compared to a stable transposition 4 element sorting-network,
    // and always copies each element exactly once.

    // SAFETY: all pointers have offset at most 3 from v_base and dst, and are
    // thus in-bounds by the precondition.
    unsafe {
        // Stably create two pairs a <= b and c <= d.
        let c1 = is_less(&*v_base.add(1), &*v_base);
        let c2 = is_less(&*v_base.add(3), &*v_base.add(2));
        let a = v_base.add(c1 as usize);
        let b = v_base.add(!c1 as usize);
        let c = v_base.add(2 + c2 as usize);
        let d = v_base.add(2 + (!c2 as usize));

        // Compare (a, c) and (b, d) to identify max/min. We're left with two
        // unknown elements, but because we are a stable sort we must know which
        // one is leftmost and which one is rightmost.
        // c3, c4 | min max unknown_left unknown_right
        //  0,  0 |  a   d    b         c
        //  0,  1 |  a   b    c         d
        //  1,  0 |  c   d    a         b
        //  1,  1 |  c   b    a         d
        let c3 = is_less(&*c, &*a);
        let c4 = is_less(&*d, &*b);
        let min = hint::select_unpredictable(c3, c, a);
        let max = hint::select_unpredictable(c4, b, d);
        let unknown_left = hint::select_unpredictable(c3, a, hint::select_unpredictable(c4, c, b));
        let unknown_right = hint::select_unpredictable(c4, d, hint::select_unpredictable(c3, b, c));

        // Sort the last two unknown elements.
        let c5 = is_less(&*unknown_right, &*unknown_left);
        let lo = hint::select_unpredictable(c5, unknown_right, unknown_left);
        let hi = hint::select_unpredictable(c5, unknown_left, unknown_right);

        ptr::copy_nonoverlapping(min, dst, 1);
        ptr::copy_nonoverlapping(lo, dst.add(1), 1);
        ptr::copy_nonoverlapping(hi, dst.add(2), 1);
        ptr::copy_nonoverlapping(max, dst.add(3), 1);
    }
```

:::

この関数は、`v_base` から 4 つの要素を読み、結果を `dst` に 4 つ書きます。どちらも、関数の前提として、範囲内に収まっていることが求められます。

## 前提知識

- **安定なソート**: 同じ値の要素の、もとの順序を保つ並べ替えです。
- **分岐予測**: CPU は `if` の結果を先に予測して処理を進めます。予測が外れると、やり直しで時間がかかります。
- **`select_unpredictable`**: 条件によって 2 つの値のどちらかを選ぶ関数です。分岐を使わずに、条件付きの代入ができます。
- **ソーティングネットワーク**: 比較の順序を固定した並べ替えの手順です。データによらず、同じ比較を同じ順に行います。
- **`copy_nonoverlapping`**: 重ならない領域の間で、要素を 1 つコピーします。

## 何をしているか

### 1. 2 組の対を作る

```rust:line-numbers=620
        let c1 = is_less(&*v_base.add(1), &*v_base);
        let c2 = is_less(&*v_base.add(3), &*v_base.add(2));
        let a = v_base.add(c1 as usize);
        let b = v_base.add(!c1 as usize);
        let c = v_base.add(2 + c2 as usize);
        let d = v_base.add(2 + (!c2 as usize));
```

最初に、`v[0]` と `v[1]`、`v[2]` と `v[3]` を比べて、それぞれ小さいほうと大きいほうの対を作ります。`a <= b` と `c <= d` の 2 組です。比較は `<` だけを使うので、等しい要素は元の順序のまま残ります。

### 2. 最小と最大を決める

```rust:line-numbers=635
        let c3 = is_less(&*c, &*a);
        let c4 = is_less(&*d, &*b);
        let min = hint::select_unpredictable(c3, c, a);
        let max = hint::select_unpredictable(c4, b, d);
```

`a` と `c`、`b` と `d` を比べて、全体の最小 `min` と最大 `max` を決めます。残りの 2 つの要素は、`unknown_left` と `unknown_right` として、どちらが左かを表にもとづいて決めます。

### 3. 残りの 2 つを並べる

```rust:line-numbers=643
        let c5 = is_less(&*unknown_right, &*unknown_left);
        let lo = hint::select_unpredictable(c5, unknown_right, unknown_left);
        let hi = hint::select_unpredictable(c5, unknown_left, unknown_right);
```

残りの 2 つを比べて、`lo` と `hi` を決めます。ここでも、比較の結果を選択で使うだけなので、分岐はありません。

### 4. 結果を書き出す

```rust:line-numbers=647
        ptr::copy_nonoverlapping(min, dst, 1);
        ptr::copy_nonoverlapping(lo, dst.add(1), 1);
        ptr::copy_nonoverlapping(hi, dst.add(2), 1);
        ptr::copy_nonoverlapping(max, dst.add(3), 1);
```

最小、`lo`、`hi`、最大の順に、`dst` へ 1 つずつコピーします。これで、4 つの要素が安定に並んだ結果が得られます。

## ここがすごい

- **分岐が少ない**: 比較の結果は、選択の条件として使われます。CPU の予測に左右されず、一定の速さで動きます。
- **比較とコピーの回数が少ない**: 比較は 5 回、コピーは各要素 1 回です。一般的な安定な並べ替えネットワークより、比較が 1 回少なくなります。
- **安定性を表で保証**: どの組み合わせでも、左右の順序が決まるように、表を使って確かめています。

## まとめ

- 4 要素の並べ替えは、対を作り、最小と最大を選んで、残りを並べる。
- 分岐の代わりに選択を使うと、予測の外れによる遅れを避けられる。
- 安定性は、比較に `<` だけを使い、左右の順序を表で決めることで保つ。
