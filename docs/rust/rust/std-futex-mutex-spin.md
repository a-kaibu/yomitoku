---
title: ロックが空くのを、眠る前に短く見張る
description: 標準ライブラリの futex 版 Mutex の spin。ロックが空くか、待っている印が付くまで、最大 100 回だけ読み込みを繰り返す。読み込みだけを使ってキャッシュへの負担を減らす。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/sync/mutex/futex.rs
lines: [68, 84]
function: Mutex::spin
difficulty: 2
format: 2
tags: [並行処理, 最適化]
---

## ひとことで

`spin` は、ロックが空くのを **眠らずに短い間だけ見張る** 関数です。最大で 100 回まで、ロックの状態を読み込みながら待ちます。
ロックが `UNLOCKED`（空き）になるか、`CONTENDED`（他にも待っている人がいる）になったら、待ちをやめて状態を返します。眠る準備をするかどうかは、この返り値で決まります。

## コード

::: code-group

```rust:line-numbers=68 [日本語訳]
    fn spin(&self) -> State {
        let mut spin = 100;
        loop {
            // spin 中は `load` だけを使う（`swap` や `compare_exchange` は使わない）
            // キャッシュへの負担を減らすため。
            let state = self.futex.load(Relaxed);

            // UNLOCKED になったら spin をやめる、
            // CONTENDED になったときもやめる。
            if state != LOCKED || spin == 0 {
                return state;
            }

            crate::hint::spin_loop();
            spin -= 1;
        }
    }
```

```rust:line-numbers=68 [原文]
    fn spin(&self) -> State {
        let mut spin = 100;
        loop {
            // We only use `load` (and not `swap` or `compare_exchange`)
            // while spinning, to be easier on the caches.
            let state = self.futex.load(Relaxed);

            // We stop spinning when the mutex is UNLOCKED,
            // but also when it's CONTENDED.
            if state != LOCKED || spin == 0 {
                return state;
            }

            crate::hint::spin_loop();
            spin -= 1;
        }
    }
```

:::

`spin` は、`lock_contended` の最初で呼ばれ、起きた後にも呼ばれます。どちらの場合も、短い間だけ待つ役割です。

## 前提知識

- **spin（スピン）**: 条件が変わるまで、CPU を使って何度も確かめ続けることです。眠る手間がない代わりに、CPU の時間を使います。
- **`load`**: 原子的な変数の値を読み出す操作です。書き込みを伴わないので、他のスレッドのキャッシュを乱しません。
- **`Relaxed` 順序**: 原子的な操作の順序の保証が一番弱い指定です。ここでは、状態を読むだけで、他のデータとの順序は要らないので使われています。
- **`hint::spin_loop`**: CPU に「今は待っている」と伝える命令を出します。省電力や、ハイパースレッドの性能の向上に役立ちます。
- **`LOCKED` と `CONTENDED`**: `LOCKED` はロック済みで待ちなし、`CONTENDED` はロック済みで待ちあり、という状態です。

## 何をしているか

### 1. 読み込みで状態を見る

```rust:line-numbers=73
            let state = self.futex.load(Relaxed);
```

`load` で状態を読みます。ここでは書き換えず、読むだけです。

### 2. 空いたか、待ちが出たら返す

```rust:line-numbers=77
            if state != LOCKED || spin == 0 {
                return state;
            }
```

状態が `LOCKED` 以外（つまり `UNLOCKED` か `CONTENDED`）になったら、その状態を返します。`spin` の残り回数が 0 になったときも、`LOCKED` のまま返します。どちらの場合も、呼び出し側が次の判断をします。

### 3. 1 回待ち、回数を減らす

```rust:line-numbers=81
            crate::hint::spin_loop();
            spin -= 1;
```

`spin_loop` で CPU に待ちを伝え、残り回数を 1 減らして、次の確認へ進みます。最大 100 回なので、短い時間だけ待つことになります。

## ここがすごい

- **書き込みを避けて、キャッシュを守る**: 待っている間は `load` だけを使います。書き込みはキャッシュの一致を崩し、他のスレッドの動きを遅くするので、読むだけに絞っています。
- **待ちをやめる条件が 2 つ**: 解放されたときだけでなく、`CONTENDED` になったときにも待ちを終えます。他の人が眠る準備をしているなら、こちらも眠るべきだと判断できます。
- **回数の上限がある**: 無限に spin すると、ロックを持つスレッドが動けず、かえって遅くなります。上限を 100 回に決めて、早く眠りに移ります。
- **順序の弱い読み込み**: `Relaxed` で読めるのは、後の `compare_exchange` の `Acquire` で正しい順序が保証されるからです。役割を分けて、無駄な同期を省いています。
- **CPU への合図**: `spin_loop` を入れることで、待っているループだと CPU に伝えられ、電力と性能の両方が改善されます。

## まとめ

- spin は、状態を読むだけの短い見張りで、最大 100 回まで続ける。
- `UNLOCKED` か `CONTENDED` になれば、待ちをやめて状態を返す。
- 読み込みだけを使うことで、他のスレッドのキャッシュを乱さない。
