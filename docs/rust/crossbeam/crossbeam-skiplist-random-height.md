---
title: 乱数の末尾の 0 の数で、ノードの高さを決める
description: crossbeam-skiplist の高さの決め方。xorshift で 32 ビットの乱数を作り、末尾の 0 の数から高さを決める。高い層ほど出にくい確率になる。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-skiplist/src/base.rs
lines: [713, 719]
function: SkipList::random_height
difficulty: 3
format: 2
tags: [乱数, ビット演算, 並行処理]
---

## ひとことで

`random_height` は、スキップリストに新しく追加するノードが **何段の高さを持つか** を決める関数です。高さは 1 から始まり、乱数の性質を使って、高い段ほど出にくい確率で決まります。

乱数は、`xorshift` という非常に軽い方法で作ります。乱数の状態は `seed` という原子的な変数に保存されていて、複数のスレッドから同時に呼ばれても安全です。

## コード

```rust:line-numbers=713
        let mut num = self.hot_data.seed.load(Ordering::Relaxed);
        num ^= num << 13;
        num ^= num >> 17;
        num ^= num << 5;
        self.hot_data.seed.store(num, Ordering::Relaxed);

        let mut height = cmp::min(MAX_HEIGHT, num.trailing_zeros() as usize + 1);
```

この関数の結果は、そのあとで `min(MAX_HEIGHT, …)` によって上限に抑えられます。ここで選んだ高さが、新しいノードの「段の数」になります。

## 前提知識

- **スキップリスト**: 値を並べたリストに、近道になる上の段を重ねたデータ構造です。上の段ほど要素が少なくなります。
- **xorshift**: 3 回のシフトと排他的論理和だけで乱数を作る方法です。とても軽く、乱数の質も十分です。
- **`trailing_zeros`**: 2 進数の末尾にある 0 の個数を返します。`0b1000` なら 3 になります。
- **`Ordering::Relaxed`**: 原子的な読み書きの順序の保証を最小にした指定です。乱数の種のように、他の変数と順序を合わせる必要がない場合に使います。
- **`cmp::min`**: 2 つの値のうち小さいほうを返します。上限を超えないように使われます。

## 何をしているか

### 1. 乱数の種を読み、xorshift で更新する

```rust:line-numbers=713
        let mut num = self.hot_data.seed.load(Ordering::Relaxed);
        num ^= num << 13;
        num ^= num >> 17;
        num ^= num << 5;
        self.hot_data.seed.store(num, Ordering::Relaxed);
```

`seed` から現在の値を読み、3 回の「シフトと排他的論理和」で次の値に変えます。変えた値を `store` で戻すので、次に呼ばれたときは別の乱数が出ます。

### 2. 末尾の 0 の数から高さを決める

```rust:line-numbers=719
        let mut height = cmp::min(MAX_HEIGHT, num.trailing_zeros() as usize + 1);
```

`num.trailing_zeros()` は、末尾に続く 0 の数を返します。それに 1 を足したものが高さになります。ただし、`MAX_HEIGHT` を超えないように `cmp::min` で抑えます。

## ここがすごい

- **確率が 2 分の 1 ずつ**: 末尾に 0 が 1 個以上ある確率は 2 分の 1、2 個以上は 4 分の 1 になります。高さが 1 段増えるごとに、確率がちょうど半分になります。
- **乱数生成器を持たない**: 外部の乱数ライブラリを使わず、1 つの整数だけで済ませています。スキップリストの挿入は頻繁に行われるので、この軽さが大切です。
- **並行処理に耐える**: 種の更新は原子的に行われます。複数のスレッドが同時に挿入しても、データ競合は起きません。

## まとめ

- ノードの高さは、乱数の末尾の 0 の個数で決める。
- 高さが 1 段増えるごとに、確率は半分になる。
- 乱数は原子的な変数に保存し、軽い xorshift で作る。
