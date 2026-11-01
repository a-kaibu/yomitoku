---
title: 弱参照カウントを一瞬「ロック」して唯一の所有者か確かめる
description: その Arc が中身を指す唯一のポインタかを判定する。弱参照カウントを特別な値 usize::MAX に書き換えて一時的にロックし、その間に強参照カウントを読む。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/rcs/arc.rs
lines: [2929, 2951]
function: Arc::is_unique
difficulty: 3
tags: [並行処理, ロック不要, 標準ライブラリ]
---

## ひとことで

`Arc::is_unique` は、ある `Arc` が **中身を指している唯一のポインタかどうか** を調べる関数です。ほかに `Arc`（強参照）も `Weak`（弱参照）もなければ `true` を返します。
唯一の所有者なら、中身を安全に書き換えられます（`get_mut` などの前提になります）。

「強参照カウントが 1 で、弱参照カウントも 1 か」を見ればよさそうですが、2 つのカウントを別々に読む間に他のスレッドが割り込むと、判定が狂います。そこでこの関数は、**弱参照カウントを一瞬だけロックとして使う** という技を使っています。

## コード

```rust:line-numbers=2929
    pub fn is_unique(this: &Self) -> bool {
        // lock the weak pointer count if we appear to be the sole weak pointer
        // holder.
        //
        // The acquire label here ensures a happens-before relationship with any
        // writes to `strong` (in particular in `Weak::upgrade`) prior to decrements
        // of the `weak` count (via `Weak::drop`, which uses release). If the upgraded
        // weak ref was never dropped, the CAS here will fail so we do not care to synchronize.
        if this.inner().weak.compare_exchange(1, usize::MAX, Acquire, Relaxed).is_ok() {
            // This needs to be an `Acquire` to synchronize with the decrement of the `strong`
            // counter in `drop` -- the only access that happens when any but the last reference
            // is being dropped.
            let unique = this.inner().strong.load(Acquire) == 1;

            // The release write here synchronizes with a read in `downgrade`,
            // effectively preventing the above read of `strong` from happening
            // after the write.
            this.inner().weak.store(1, Release); // release the lock
            unique
        } else {
            false
        }
    }
```

## 前提知識

- **強参照と弱参照**: `Arc` は中身を生かし続ける「強い」参照、`Weak` は中身を生かし続けない「弱い」参照です。`Weak` は `upgrade()` で `Arc` に戻せることがあります。
- **2 つのカウント**: `Arc` の内部には `strong`（強参照の数）と `weak`（弱参照の数 + 1）があります。「+ 1」は、すべての強参照がまとめて 1 つの弱参照を持っているとみなすためです。弱参照がなければ `weak` は 1 です。
- **`compare_exchange(期待値, 新しい値, 成功時の順序, 失敗時の順序)`**: 「今の値が期待値なら新しい値に書き換える」をアトミックに行います。成功すれば `Ok`、失敗すれば `Err` を返します。
- **`Acquire` / `Release`**: 他スレッドとの間でメモリ操作の順序を保証する指定です。`Release` で書いたものを `Acquire` で読むと、書いた側のそれ以前の操作が見えるようになります。
- **`this: &Self`**: `Arc::is_unique(&a)` のように呼ぶ関数です。`a.is_unique()` という書き方にしないのは、中身の型のメソッドと名前がぶつからないようにするためです。

## 何をしているか

### 1. 弱参照カウントをロックする（2937 行目）

`weak` が 1（弱参照が 1 つもない）なら、それを `usize::MAX` に書き換えます。`usize::MAX` は「ロック中」を表す特別な値です。
同じファイルの `downgrade`（`Arc` から `Weak` を作る関数）は、`weak` が `usize::MAX` の間は待つように作られています。つまりロック中は **新しい弱参照が作られません**。

書き換えに失敗した（`weak` が 1 でない）なら、弱参照が存在するので `false` を返します（2948〜2950 行目）。

### 2. 強参照カウントを読む（2941 行目）

ロックしている間に `strong` を読み、1 かどうかを確かめます。弱参照がない以上、`Weak::upgrade` によって `strong` が増えることもありません。

### 3. ロックを外す（2946 行目）

`weak` を 1 に戻し、結果を返します。

## ここがすごい

- **既存のカウンタをロックに転用**: 専用のロック変数を追加せず、`weak` カウントに「ありえない値」`usize::MAX` を書き込んでロックの印にしています。`Arc` の内部に余分なメモリを足さずに済みます。
- **2 つの値を矛盾なく読む**: 「弱参照がない」ことを確定させたうえで「強参照が 1 つ」を確認するので、その間に `Weak` が作られて `Arc` に戻されるといった割り込みを防げます。
- **順序の指定が細かい**: 2933〜2945 行目のコメントで、各操作がどの関数のどの操作と同期するのかを説明しています。たとえば `strong` の読み出しを `Acquire` にするのは、ほかのスレッドの `drop` による減算と同期し、そのスレッドの中身へのアクセスが終わっていることを保証するためです。
- **ロックはほんの一瞬**: ロックを持つのは数命令の間だけです。ドキュメントにある通り、同時に `downgrade` を呼ぶスレッドが少しの間ループで待つことがある、というだけの影響に収まっています。

## まとめ

- 2 つのカウンタを別々に読むと、その間の割り込みで判定が狂うことがある。
- カウンタにありえない値を書き込めば、ロックの代わりに使える。
- 「新しい参照を作れない状態」にしてから数を確認すると、判定が確定する。
- アトミック操作の順序指定には、何と同期するのかを必ずコメントで残す。
