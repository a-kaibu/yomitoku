---
title: 書き込みロックを外して、待っている人がいれば起こす
description: 標準ライブラリの futex 版 RwLock の write_unlock。書き込みの状態を引いて空に戻し、書き手か読み手が待っていれば起こす。待ちがなければ何もしない。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/rwlock/futex.rs
lines: [181, 190]
function: RwLock::write_unlock
difficulty: 2
format: 2
tags: [並行処理, 防御的プログラミング, 低レイヤ]
---

## ひとことで

`write_unlock` は、**書き込みロック（排他ロック）を解放する** 関数です。状態から書き込み中の印を取り除き、そのあと、待っている書き手か読み手がいれば起こします。
待ちがなければ、起こす処理は行われません。解放の速さを保つための作りです。

## コード

```rust:line-numbers=181
    #[inline]
    pub unsafe fn write_unlock(&self) {
        let state = self.state.fetch_sub(WRITE_LOCKED, Release) - WRITE_LOCKED;

        debug_assert!(is_unlocked(state));

        if has_writers_waiting(state) || has_readers_waiting(state) {
            self.wake_writer_or_readers(state);
        }
    }
```

`write_unlock` は、`unsafe` 関数です。書き込みロックを実際に持っているスレッドだけが呼ぶことが、呼び出し側の約束になっています。

## 前提知識

- **書き込みロックの状態**: 書き込み中は、状態の下位 30 ビットが `WRITE_LOCKED`（全部 1）になります。その他の印は、上の 2 ビットに別々に立ちます。
- **`fetch_sub(WRITE_LOCKED, Release)`**: 状態から `WRITE_LOCKED` を引き、以前の値を返す原子的な操作です。`Release` は、解放までに書いた内容を、次にロックを取る人に見えるようにする指定です。
- **`debug_assert!`**: デバッグビルドでだけ条件を確かめます。ここでは、解放のあとの状態が完全な空きになっていることを確かめています。
- **`has_writers_waiting` と `has_readers_waiting`**: 待ちの印が立っているかを調べる関数です。
- **`wake_writer_or_readers`**: 待っているスレッドを起こす処理です。書き手と読み手のどちらを起こすかを、中で決めます。

## 何をしているか

### 1. 書き込みの印を引く

```rust:line-numbers=183
        let state = self.state.fetch_sub(WRITE_LOCKED, Release) - WRITE_LOCKED;
```

`fetch_sub` で、書き込み中を表す値を状態から引きます。引いたあとの `state` は、待ちの印だけが残った値になります。

### 2. 空きを確かめる

```rust:line-numbers=185
        debug_assert!(is_unlocked(state));
```

書き込みロックを外したので、残るのは待ちの印だけで、ロックそのものは空いているはずです。デバッグビルドでは、この前提を確かめます。

### 3. 待ちがあれば起こす

```rust:line-numbers=187
        if has_writers_waiting(state) || has_readers_waiting(state) {
            self.wake_writer_or_readers(state);
        }
```

書き手か読み手が待っていれば、`wake_writer_or_readers` を呼びます。待ちがなければ、何もせずに戻ります。

## ここがすごい

- **待ちがなければ何もしない**: 多くの解放は、待ちがないまま終わります。その場合は、起こすための処理を一切通らないので、解放が速くなります。
- **書き込みの印を引き算で消す**: 状態の中の書き込みの印を、値の引き算だけで消せます。判定と書き換えを 1 回ずつにまとめています。
- **`Release` の順序**: 解放の書き込みに `Release` を付けることで、書き込んだデータが、次に読む人からも見えます。
- **前提を型と `unsafe` で表す**: 書き込みロックを持つ人だけが呼べる、という約束を `unsafe` で明示しています。
- **起こす役割を分ける**: 誰を起こすかは `wake_writer_or_readers` の中で決まります。この関数は、解放と、起こすかどうかの判断だけを行います。

## まとめ

- 書き込みロックの解放は、書き込みの印を引いて、待ちがあれば起こす。
- 待ちがなければ、起こす処理は行わない。
- 解放の順序は `Release` で保ち、次の人に書いた内容を見せる。
