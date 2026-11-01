---
title: OS に譲らず、待ち時間の上限だけを決めて回す
description: parking_lot の SpinWait::spin_no_yield。OS に譲らず、CPU を回す時間を 2 のべき乗で増やし、10 段階で頭打ちにする。競争が激しい compare_exchange のループ向け。
language: rust
project: parking_lot
repo: https://github.com/Amanieu/parking_lot
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 The Rust Project Developers
commit: "85827ffa2ffb0b60d416e2e2a091f36b0e8e5a91"
file: core/src/spinwait.rs
lines: [60, 66]
function: SpinWait::spin_no_yield
difficulty: 3
format: 2
tags: [並行処理, アルゴリズム, ロック不要]
---

## ひとことで

`spin_no_yield` は、`spin` と同じく **待ち時間を 2 倍ずつ増やしながら待つ** 関数です。ただし、OS にスレッドを譲らず、上限を超えたら待ち時間を固定します。眠らせる判断もしないので、呼び出し側は、ずっと回り続けることになります。

主な用途は、`compare_exchange` を何度も試すループです。ほかのスレッドと激しく競っているとき、少し待てばすぐに成功するので、眠るほどの待ちではありません。

## コード

```rust:line-numbers=60
    pub fn spin_no_yield(&mut self) {
        self.counter += 1;
        if self.counter > 10 {
            self.counter = 10;
        }
        cpu_relax(1 << (self.counter - 1));
    }
```

この関数は、`SpinWait` の 2 つ目の待ち方です。`spin` とは違い、戻り値がありません。呼び出すたびに、待つ量が増えていくか、上限で止まるだけです。

## 前提知識

- **`compare_exchange`**: 値が期待どおりなら書き換える原子的な操作です。失敗したら、もう一度読み直して試します。
- **競争（コンテンション）**: 複数のスレッドが同じ場所を同時に書き換えようとして、失敗が続く状態です。
- **`cpu_relax`**: 指定した回数だけ `spin_loop` を呼ぶ関数です。CPU に「今は待っている」と伝えながら回します。
- **`1 << (n - 1)`**: 2 のべき乗を作る書き方です。`counter` が 1 なら 1 回、2 なら 2 回、というように増えます。
- **上限**: ここでは `counter` が 10 を超えないようにしています。待ち時間が無限に延びることを防ぎます。

## 何をしているか

### 1. 待つ段階を 1 つ進める

```rust:line-numbers=61
        self.counter += 1;
```

`counter` を 1 増やします。失敗が続くほど、この数は大きくなります。

### 2. 上限で頭打ちにする

```rust:line-numbers=62
        if self.counter > 10 {
            self.counter = 10;
        }
```

`counter` が 10 を超えたら、10 に戻します。これで、待ち時間は `2^9` 回ぶんの `spin_loop` で止まります。これ以上長く回しても効果が減るので、上限を決めています。

### 3. 段階に応じて CPU を回す

```rust:line-numbers=65
        cpu_relax(1 << (self.counter - 1));
```

`cpu_relax` で、`1 << (counter - 1)` 回ぶん `spin_loop` を回します。段階が上がるほど、待ち時間は倍になります。

## ここがすごい

- **OS に譲らない速さ**: `thread_yield` を使わないので、切り替えの費用がかかりません。すぐ成功する見込みのある競争では、この速さが効きます。
- **上限で暴走を防ぐ**: 待ち時間を 10 段階に抑えるので、激しい競争でも、一度の待ちが長くなり過ぎません。
- **呼び出し側の自由**: 眠るか回るかの判断を関数の外に任せています。ループの作り方に合わせて、使い分けられます。

## まとめ

- OS に譲らず、待ち時間を 2 倍ずつ増やして上限で止める。
- 激しい `compare_exchange` の競争で、すぐに再挑戦できるようにする。
- 眠るかどうかは呼び出し側が決める。
