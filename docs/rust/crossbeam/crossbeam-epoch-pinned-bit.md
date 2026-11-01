---
title: エポックの最下位ビットを「ピン留め」の印にする
description: crossbeam-epoch が、エポック番号に「ピン留めされているか」の印を同じ整数で持つ仕組み。最下位の 1 ビットを見たり立てたり消したりするだけで判定できる。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-epoch/src/epoch.rs
lines: [59, 77]
function: Epoch::is_pinned
difficulty: 2
format: 2
tags: [並行処理, ビット演算, 低レイヤ]
---

## ひとことで

`is_pinned`、`pinned`、`unpinned` は、`crossbeam-epoch` が使うエポック（時代の番号）の **最下位ビット** を、「このスレッドは今、共有データを読んでいる（ピン留めされている）」という印として扱う 3 つの関数です。
番号の本体は、残りの上の位に入っています。印を見る・立てる・消す操作が、どれもビットの 1 つの演算で済むので、速く、ずれの心配もありません。

## コード

::: code-group

```rust:line-numbers=59 [日本語訳]
    pub(crate) fn is_pinned(self) -> bool {
        (self.data & 1) == 1
    }

    /// 同じエポックを、ピン留め済みとして返す
    #[inline]
    pub(crate) fn pinned(self) -> Self {
        Self {
            data: self.data | 1,
        }
    }

    /// 同じエポックを、ピン留めなしとして返す
    #[inline]
    pub(crate) fn unpinned(self) -> Self {
        Self {
            data: self.data & !1,
        }
    }
```

```rust:line-numbers=59 [原文]
    pub(crate) fn is_pinned(self) -> bool {
        (self.data & 1) == 1
    }

    /// Returns the same epoch, but marked as pinned.
    #[inline]
    pub(crate) fn pinned(self) -> Self {
        Self {
            data: self.data | 1,
        }
    }

    /// Returns the same epoch, but marked as unpinned.
    #[inline]
    pub(crate) fn unpinned(self) -> Self {
        Self {
            data: self.data & !1,
        }
    }
```

:::

`Epoch` は、番号と印の 2 つを 1 つの `usize` に持つ構造体です。この 3 つの関数は、その印だけを操作します。

## 前提知識

- **エポックベースの回収**: 並行処理で、ほかのスレッドが読んでいるかもしれないメモリを、いつ解放してよいかを判断する仕組みです。スレッドは「ピン留め」をしている間、古いデータを読んでいる可能性があります。
- **ビット演算 `&`**: 2 つの整数で両方とも 1 のビットだけを 1 にする演算です。`x & 1` は最下位ビットだけを取り出します。
- **ビット演算 `|`**: どちらかが 1 のビットを 1 にする演算です。`x | 1` は最下位ビットを 1 にします。
- **`!1`**: `1` のビットをすべて反転させた値で、最下位ビット以外が 1 の値になります。`x & !1` は最下位ビットを 0 にします。
- **`pub(crate)`**: 同じクレートの中からだけ見える、というアクセス範囲の指定です。

## 何をしているか

### 1. ピン留めされているかを見る

```rust:line-numbers=60
        (self.data & 1) == 1
```

（`is_pinned` の本体です。）最下位ビットが 1 なら、ピン留めされているとみなします。番号の部分は見ず、印だけを読みます。

### 2. 印を立てる

```rust:line-numbers=67
            data: self.data | 1,
```

（`pinned` の本体です。）番号はそのままに、最下位ビットを 1 にして返します。元の値は変わらず、新しい `Epoch` が返ります。

### 3. 印を消す

```rust:line-numbers=75
            data: self.data & !1,
```

（`unpinned` の本体です。）最下位ビットを 0 にして返します。番号の部分はそのまま残ります。

## ここがすごい

- **番号と印が 1 つの整数で済む**: 2 つの値を別々に持つと、両方を同時に読み書きする仕組みが必要です。1 つの整数にすれば、1 回の読み書きで両方がそろうので、原子的な操作（アトミック）と相性が良くなります。
- **判定が 1 命令**: ピン留めされているかは、最下位ビットを見るだけで決まります。分岐もほとんどなく、読み込みの処理に負担がかかりません。
- **番号の部分を壊さない**: 印の操作は、番号に対応する上の位にはほとんど触れません。`| 1` と `& !1` は、最下位ビットだけを変えます。
- **次の番号への進め方と揃う**: 次のエポックは `wrapping_add(2)` で作られます（別の関数）。番号は 2 ずつ進むので、最下位ビットは常に印として空いています。
- **元の値を書き換えない**: 3 つの関数はいずれも `self` を変えず、新しい値を返します。古い状態を比べる処理を書きやすくなります。

## まとめ

- エポックの最下位ビットを「ピン留め」の印にしている。
- 印の判定は `& 1`、立てるのは `| 1`、消すのは `& !1` の 1 演算で済む。
- 番号と印を 1 つの整数にまとめることで、原子的な読み書きと相性が良い。
