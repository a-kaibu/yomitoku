---
title: 待ちの間は、回数を増やしながら段階的に譲る
description: parking_lot の SpinWait::spin。ロックが空くのを待つとき、最初は CPU を短く回し、途中から OS にスレッドを譲る。回数が上限に達したら、眠らせる合図になる。
language: rust
project: parking_lot
repo: https://github.com/Amanieu/parking_lot
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 The Rust Project Developers
commit: "85827ffa2ffb0b60d416e2e2a091f36b0e8e5a91"
file: core/src/spinwait.rs
lines: [41, 52]
function: SpinWait::spin
difficulty: 3
format: 2
tags: [並行処理, アルゴリズム, ロック不要]
---

## ひとことで

`spin` は、ロックが空くのを待つスレッドが、**どのくらい待つかを段階的に決める** 関数です。最初の数回は CPU を少しだけ回して待ち、そのあとは OS にほかのスレッドを実行させます。上限に達したら `false` を返し、呼び出し側は眠る（パーク）ほうがよい、と判断できます。

ロックの取り合いが一瞬で終わるなら、眠るより短く待ち続けるほうが速いです。一方で、長く待つときに回し続けると、CPU を無駄にします。`spin` は、その両方の中間をとる仕組みです。

## コード

```rust:line-numbers=41
    pub fn spin(&mut self) -> bool {
        if self.counter >= 10 {
            return false;
        }
        self.counter += 1;
        if self.counter <= 3 {
            cpu_relax(1 << (self.counter - 1));
        } else {
            thread_parker::thread_yield();
        }
        true
    }
```

この関数は、`SpinWait` という小さな構造体のメソッドです。構造体は `counter` だけを持ち、呼ぶたびに増えていきます。ロックを取るループの中で、失敗するたびに `spin` を呼ぶ、という使い方になります。

## 前提知識

- **スピンロック（スピン待ち）**: 空くまで同じ確認を繰り返す待ち方です。眠らないので、切り替えの費用がかかりません。
- **パーク**: スレッドを眠らせ、別の人が起こすまで動かないようにすることです。`parking_lot` の名前の由来でもあります。
- **`counter`**: 何回待ったかを数える値です。段階を決めるのに使われます。
- **`1 << (n - 1)`**: 1 をビットでずらす書き方です。`n` が増えると、2 倍ずつ大きくなる回数を表します。
- **`thread_yield`**: 現在のスレッドが、ほかの実行可能なスレッドに CPU を譲る呼び出しです。

## 何をしているか

### 1. 上限に達したら、待つのをやめる

```rust:line-numbers=42
        if self.counter >= 10 {
            return false;
        }
```

`counter` が 10 以上なら、これ以上スピンしても効果が小さいと判断します。`false` を返し、呼び出し側にパークさせます。

### 2. 待つ回数を増やす

```rust:line-numbers=45
        self.counter += 1;
```

呼ばれるたびに `counter` を 1 増やします。これが、待ちの段階を表します。

### 3. 最初の 3 回は CPU を回して待つ

```rust:line-numbers=46
        if self.counter <= 3 {
            cpu_relax(1 << (self.counter - 1));
```

`counter` が 3 以下なら、`cpu_relax` で `1, 2, 4` 回ぶんの `spin_loop` を回します。待つ時間は、呼ぶたびに 2 倍になります。ヒントを CPU に伝えるので、他のコアを邪魔せず待てます。

### 4. その後は OS に譲る

```rust:line-numbers=48
        } else {
            thread_parker::thread_yield();
        }
```

4 回目以降は、`thread_yield` で CPU をほかのスレッドに渡します。ロックの持ち主がそのスレッドで動けるので、待ちが解消しやすくなります。

## ここがすごい

- **待ち時間が指数的に増える**: 最初は短く、徐々に長くなります。少しの競争なら素早く終わり、激しい競争でも CPU を使い過ぎません。
- **上限で眠りに移る**: 10 回で `false` を返すので、長く待つ場合は眠る判断に自然に移れます。待つ方法の切り替えが、1 つの関数の結果で決まります。
- **状態が 1 つの整数**: 必要な情報は `counter` だけです。構造体が小さく、ロックの中に埋め込んでも負担になりません。

## まとめ

- 待ち方は、短い CPU 待ちから、OS への譲りへと段階的に移る。
- 待つ回数に応じて、待ち時間は 2 倍ずつ増える。
- 上限に達したら `false` を返し、眠る判断を呼び出し側に任せる。
