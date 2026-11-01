---
title: 2 の冪のリングバッファで、添字を剰余せずに折り返す
description: crossbeam-deque の作業キューのバッファ。容量が 2 の冪であることを使い、添字とマスクの論理積で折り返し、割り算なしで要素の位置を求める。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-deque/src/deque.rs
lines: [86, 94]
function: Buffer::at
difficulty: 3
format: 2
tags: [データ構造, 並行処理, ビット演算]
---

## ひとことで

`at` は、キューの **添字（インデックス）** から、バッファの中の要素へのポインタを求める関数です。キューは円環のように使われるので、添字が大きくなっても、バッファの先頭へ戻して折り返す必要があります。

ここでは、バッファの容量が **必ず 2 の冪** であることを利用しています。そのため、割り算の余りを取る代わりに、マスク（`cap - 1`）との論理積だけで折り返せます。

## コード

::: code-group

```rust:line-numbers=86 [日本語訳]
    unsafe fn at(&self, index: WorkerIndex) -> *mut T {
        // `self.cap` は常に 2 の冪です。
        // すべての読み込みを `MaybeUninit` で行います。読み込んだあとに、そのメモリへアクセスする権利がないと分かることがあるからです。
        // 実際には、そのメモリへアクセスする権利がないことがあります。
        unsafe {
            self.ptr
                .offset((index & (self.cap - 1) as WorkerIndex) as isize)
        }
    }
```

```rust:line-numbers=86 [原文]
    unsafe fn at(&self, index: WorkerIndex) -> *mut T {
        // `self.cap` is always a power of two.
        // We do all the loads at `MaybeUninit` because we might realize, after loading, that we
        // don't actually have the right to access this memory.
        unsafe {
            self.ptr
                .offset((index & (self.cap - 1) as WorkerIndex) as isize)
        }
    }
```

:::

この関数は、`unsafe` の中でポインタを計算するだけで、メモリを読んだり書いたりはしません。実際の読み書きは、返されたポインタを使う呼び出し側が、適切な順序で行います。

## 前提知識

- **円環のバッファ（リングバッファ）**: 末尾の先に先頭がつながっているように使う配列です。読み書きの位置が、容量を超えたら先頭へ戻ります。
- **添字（`WorkerIndex`）**: キューの読み書きの位置を表す整数です。増え続けるので、容量の範囲に戻す計算が必要です。
- **2 の冪**: 2、4、8、16 のように、2 を何回か掛けた数です。2 進数では、最上位の 1 以外は全部 0 です。
- **`cap - 1`**: 容量から 1 を引いた数です。2 の冪の容量では、下位のビットがすべて 1 になるマスクとして働きます。
- **論理積（`&`）**: 添字の下位ビットだけを残す操作です。これで、容量の範囲に折り返されます。

## 何をしているか

### 1. 容量のマスクを作る

`cap - 1` は、下位のビットがすべて 1 の数になります。たとえば容量が 8 なら、マスクは `0b111` です。

### 2. 添字をマスクで折り返す

```rust:line-numbers=92
                .offset((index & (self.cap - 1) as WorkerIndex) as isize)
```

添字と `cap - 1` の論理積を取ると、容量の範囲に収まった添字が得られます。この値を、バッファの先頭から足して、要素のポインタを作ります。

### 3. ポインタを返す

```rust:line-numbers=91
            self.ptr
                .offset((index & (self.cap - 1) as WorkerIndex) as isize)
        }
```

`self.ptr` に、折り返した添字を足して返します。読み書きは、この位置に対して呼び出し側が行います。

## ここがすごい

- **割り算が要らない**: 剰余の計算は、割り算の中でも重い処理です。2 の冪の容量なら、論理積 1 回で済みます。
- **添字は増え続けてよい**: 添字を毎回リセットしなくても、マスクで自然に折り返します。
- **容量の制約を型に頼らない**: 容量が 2 の冪であることは、バッファを作るときに保証されています。このコードは、その前提だけを使っています。

## まとめ

- 容量が 2 の冪なら、添字の折り返しはマスクとの論理積で済む。
- 割り算を使わないので、キューの操作が速くなる。
- 添字を増やし続けても、マスクで必ず容量の範囲に収まる。
