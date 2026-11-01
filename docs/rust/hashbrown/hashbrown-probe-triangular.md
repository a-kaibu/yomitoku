---
title: 三角数の間隔で飛びながら空きを探す
description: hashbrown のハッシュ表が、衝突したときに次に調べる場所を決める探索列。飛ぶ幅を 1 グループずつ増やし、2 のべき乗の表ではすべてのグループを 1 回ずつ訪ねる。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/raw.rs
lines: [82, 92]
function: ProbeSeq::move_next
difficulty: 3
format: 2
tags: [ハッシュ, アルゴリズム, データ構造]
---

## ひとことで

`ProbeSeq::move_next` は、ハッシュ表で **衝突したときに次に調べる場所** を決める関数です。ハッシュ値から選んだ最初の位置が埋まっていたら、この関数で次の位置へ進みます。
進む幅は、呼ぶたびに 1 グループずつ増えていきます。最初は 1 グループ、次は 2 グループ、次は 3 グループ、という具合です。

この飛び方は **三角数（1, 3, 6, 10, …）** の並びになるので、表の大きさが 2 のべき乗なら、すべてのグループをちょうど 1 回ずつ訪ねられます。

## コード

::: code-group

```rust:line-numbers=82 [日本語訳]
    #[inline]
    fn move_next(&mut self, bucket_mask: usize) {
        // ここまでに空いている bucket が見つかり、探索は終わっているはず。
        debug_assert!(
            self.stride <= bucket_mask,
            "Went past end of probe sequence"
        );

        self.stride = self.stride.wrapping_add(Group::WIDTH);
        self.pos = self.pos.wrapping_add(self.stride) & bucket_mask;
    }
```

```rust:line-numbers=82 [原文]
    #[inline]
    fn move_next(&mut self, bucket_mask: usize) {
        // We should have found an empty bucket by now and ended the probe.
        debug_assert!(
            self.stride <= bucket_mask,
            "Went past end of probe sequence"
        );

        self.stride = self.stride.wrapping_add(Group::WIDTH);
        self.pos = self.pos.wrapping_add(self.stride) & bucket_mask;
    }
```

:::

`Group::WIDTH` は、一度に調べる bucket の数です。SSE2 などの SIMD 命令では 16 になります。飛ぶ幅は、この数の倍数で増えていきます。

## 前提知識

- **ハッシュ表**: キーのハッシュ値から位置を決めて、値を置く表です。別の値が同じ位置を取ると衝突が起きます。
- **bucket と group**: bucket は値を置ける 1 つの場所です。group は、まとめて同時に調べる複数の bucket です。
- **`bucket_mask`**: 表の大きさから作るマスクです。表の大きさが 2^n なら `size - 1` で、`&` を取ると表の範囲に収まります。
- **`wrapping_add`**: 足し算が `usize` を超えても止まらない足し算です。
- **三角数**: 1, 1+2, 1+2+3, … の和で表される数です。1, 3, 6, 10 と増えていきます。

## 何をしているか

### 1. 飛ぶ幅を 1 グループ分増やす

```rust:line-numbers=90
        self.stride = self.stride.wrapping_add(Group::WIDTH);
```

`stride`（飛ぶ幅）に `Group::WIDTH` を足します。呼ぶたびに増えるので、飛ぶ距離は 1, 2, 3, … グループ分になります。

### 2. 新しい位置を計算して表の中に収める

```rust:line-numbers=91
        self.pos = self.pos.wrapping_add(self.stride) & bucket_mask;
```

`pos` に `stride` を足し、`bucket_mask` で割った余りを取ります。`&` で表の大きさに収めるので、表の端を越えたら最初の方へ戻ります。

### 3. 範囲を越えていないことを確かめる

```rust:line-numbers=85
        debug_assert!(
            self.stride <= bucket_mask,
            "Went past end of probe sequence"
        );
```

`debug_assert!` は、探索が表の大きさを超えて進みすぎていないかを確かめます。空の bucket は必ず見つかるはずなので、ここまで来たら設計の前提が崩れていることになります。

## ここがすごい

- **すべての位置を 1 回ずつ訪ねる**: 表の大きさが 2 のべき乗なら、三角数の間隔で飛ぶと、全部のグループをちょうど 1 回ずつ通ります。同じ場所を何度も調べる無駄がありません。
- **近い場所は連続して調べる**: 最初の飛び幅は 1 グループなので、最初の数回はメモリ上で隣り合う場所を読みます。キャッシュに乗りやすく、速く動きます。
- **割り算を使わない**: 位置の計算は、足し算と `&` だけです。表の大きさが 2 のべき乗であることを使うと、割り算より速い方法で範囲に収められます。
- **デバッグ時の安全装置**: `debug_assert!` で、探索が無限に続いていないかを検査します。リリースビルドでは消えるので、速さは落ちません。
- **衝突に強い**: 単純な線形探索だと、値がかたまって残りやすくなります。飛び幅を変えることで、かたまりを分散させます。

## まとめ

- 衝突したときの次の位置は、三角数の間隔で決める。
- 表の大きさが 2 のべき乗なら、すべてのグループを 1 回ずつ訪ねられる。
- 足し算と `&` だけで、表の範囲に収めた位置を求められる。
