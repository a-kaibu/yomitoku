---
title: 読み取りロックを、書き手や待ちの読み手を優先して判定する
description: 標準ライブラリの futex 版 RwLock が、読み取りロックを取ってよいかを判定する関数。状態の 1 つの整数の下位ビットと上位の印を見て、書き手と待ちの読み手を優先する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/rwlock/futex.rs
lines: [46, 55]
function: is_read_lockable
difficulty: 3
format: 2
tags: [並行処理, ビット演算, 最適化]
---

## ひとことで

`is_read_lockable` は、読み取りロック（共有ロック）を **今この瞬間に取ってよいか** を判定する関数です。ロックの状態は 1 つの整数に詰められていて、その中の数と印を見て答えを出します。
読み手が何人いてもよい状態でも、**書き手が待っていたり、読み手が待っていたりするときは、取らせません**。順番を守るための判定です。

## コード

::: code-group

```rust:line-numbers=46 [日本語訳]
#[inline]
fn is_read_lockable(state: Primitive) -> bool {
    // 読み取りロックを取ると読み手の数が溢れるおそれがあるときも false を返す。
    //
    // 読み手が待っているときは、ロックが空いていても読み取りロックを許さない。
    // 書き手が待っていない場合も同じ。これが起きるのは、解放の直後だけである。
    // 解放したスレッドが、読み手より優先される書き手を起こしている可能性があるため。
    // 解放したスレッドは、必要なら読み手待ちの印を消して、読み手を起こす。
    state & MASK < MAX_READERS && !has_readers_waiting(state) && !has_writers_waiting(state)
}
```

```rust:line-numbers=46 [原文]
#[inline]
fn is_read_lockable(state: Primitive) -> bool {
    // This also returns false if the counter could overflow if we tried to read lock it.
    //
    // We don't allow read-locking if there's readers waiting, even if the lock is unlocked
    // and there's no writers waiting. The only situation when this happens is after unlocking,
    // at which point the unlocking thread might be waking up writers, which have priority over readers.
    // The unlocking thread will clear the readers waiting bit and wake up readers, if necessary.
    state & MASK < MAX_READERS && !has_readers_waiting(state) && !has_writers_waiting(state)
}
```

:::

判定は、3 つの条件を `&&` でつないでいます。1 つでも満たさなければ、読み取りロックは取れません。

## 前提知識

- **読み取りロック（共有ロック）と書き込みロック（排他ロック）**: 読み取りは何人が同時に持ってもよく、書き込みは 1 人だけが持てます。書き込み中は読み取りもできません。
- **状態を 1 つの整数に詰める**: この RwLock では、下位 30 ビットで「読み手の数」か「書き込み中」を表し、上の 2 ビットを「読み手が待っている」「書き手が待っている」の印にしています。
- **`MASK`**: 下位 30 ビットを取り出すマスクです。`state & MASK` で、読み手の数や書き込み中の印だけを取り出せます。
- **`MAX_READERS`**: 同時に読み手として数えられる上限です。これを超えると、数えるビットが溢れてしまいます。
- **`&&`**: 両方が真のときだけ真になる論理演算子です。左から順に評価され、途中で偽になれば残りは調べません。

## 何をしているか

### 1. 読み手の数が上限より小さいか

```rust:line-numbers=54
    state & MASK < MAX_READERS && !has_readers_waiting(state) && !has_writers_waiting(state)
```

`state & MASK < MAX_READERS` は、読み手の数が上限に達していないかを見ます。ここで偽になると、読み手を 1 人増やすと数のビットが溢れてしまうので、ロックを取れません。

### 2. 読み手が待っていないか

`!has_readers_waiting(state)` は、「読み手待ち」の印が立っていないかを確かめます。書き手が解放して読み手を起こそうとしている間は、新しい読み手に割り込ませません。

### 3. 書き手が待っていないか

`!has_writers_waiting(state)` は、「書き手待ち」の印を確かめます。書き手が待っているときは、書き手を先に通すために、読み手の割り込みを許しません。

## ここがすごい

- **書き手を飢えさせない**: 読み手ばかりが次々に入ると、書き手は永遠に入れないおそれがあります。書き手待ちの印があるときは読み手を止めることで、書き手の順番を守っています。
- **1 つの整数で判定を一度に表す**: 読み手の数、書き込み中の印、待ちの印が、同じ整数の中にあります。ロックの状態を 1 回の読み込みで取得し、そこから判定できます。
- **短絡評価で無駄を省く**: `&&` の左から順に調べて、偽になった時点で残りを調べません。判定が軽くなります。
- **溢れの防止が判定に入っている**: 上限を確かめる条件が、そのまま判定の一部です。読み手を増やす前に、必ず溢れを防いでいます。
- **コメントに仕様の理由がある**: 解放の直後に読み手が優先されない理由が、コメントで説明されています。読み手がこの関数を読むとき、なぜ書き手が先なのかを追えます。

## まとめ

- 読み取りロックは、読み手の数の上限、読み手待ち、書き手待ちの 3 つを確かめてから取る。
- 状態を 1 つの整数に詰めておくと、判定を 1 回の読み込みで行える。
- 書き手を飢えさせないために、待ちの印があれば読み手を通さない。
