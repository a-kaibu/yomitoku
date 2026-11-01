---
title: 長さと「ヒープ上か」の印を 1 つの整数に詰める
description: smallvec が、要素数と「ヒープに置かれているか」の 1 ビットを 1 つの usize に詰めて持つ関数。ZST のときは印を使わないよう、型の大きさで形を変えている。
language: rust
project: smallvec
repo: https://github.com/servo/rust-smallvec
license: MIT OR Apache-2.0
copyright: Copyright (c) 2018 The Servo Project Developers
commit: "5b5b752f87b449946513a2d0a08b0b5f5ca989d6"
file: src/locatedlength.rs
lines: [68, 76]
function: LocatedLength::new
difficulty: 3
format: 2
tags: [ビット演算, メモリ管理, 最適化, 型システム]
---

## ひとことで

`LocatedLength::new` は、`SmallVec` の **長さ** と、**データがヒープ（動的に確保した領域）にあるかどうか** の印を、1 つの `usize` にまとめて作る関数です。
たとえば長さ 5 で、ヒープにあるなら `0b1011` になります。長さは上の位に、印は最も下のビットに入ります。

`SmallVec` は、少ない要素ならスタック上の固定領域に入れ、多くなったらヒープに移す仕組みです。その切り替えの状態を表すために、長さを表す整数の 1 ビットを使っています。

## コード

```rust:line-numbers=68
    #[inline(always)]
    pub const fn new(length: usize, on_heap: bool) -> Self {
        debug_assert!(length < Self::MAX_LEN);
        debug_assert!(!on_heap || Self::TAG != 0);
        Self(
            (length << Self::SHIFT) | ((on_heap as usize) & Self::TAG),
            PhantomData
        )
    }
```

この関数で使われる定数は、同じファイルで次のように決まっています。

```rust:line-numbers=64
    const MAX_LEN: usize = usize::MAX >> Self::SHIFT;
    const SHIFT: u32 = (size_of::<Item>() != 0) as u32;
    const TAG: usize = Self::SHIFT as usize;
```

## 前提知識

- **`SmallVec`**: 小さな配列のように、要素をスタック上の領域にためておける可変長配列です。大きくなるとヒープに移ります。
- **ビットの配置**: `usize` の 1 ビットを「印」に使い、残りの上の位で数を表すと、1 つの整数で 2 つの値を同時に持てます。
- **`<<` と `|`**: `<<` は左にずらす演算、`|` はビットごとの OR です。`(length << 1) | flag` は、length を 1 ビット上にずらして、最下位に flag を入れる操作です。
- **`&`**: ビットごとの AND です。`(on_heap as usize) & Self::TAG` は、フラグを TAG で取り出す操作です。
- **`as usize`**: `bool` を整数にすると、`true` は 1、`false` は 0 になります。
- **ZST（大きさ 0 の型）**: 要素のメモリを持たない型です。ZST の `SmallVec` はヒープを使わないので、印のビットを持つ必要がありません。
- **`const`**: コンパイル時に決まる値です。`SHIFT` と `TAG` は型の大きさから計算されます。

## 何をしているか

### 1. 型の大きさで「印」を使うかを決める

```rust:line-numbers=64
    const MAX_LEN: usize = usize::MAX >> Self::SHIFT;
    const SHIFT: u32 = (size_of::<Item>() != 0) as u32;
    const TAG: usize = Self::SHIFT as usize;
```

`SHIFT` は、要素の型が大きさ 0 でなければ 1、ZST なら 0 です。`TAG` は、印のビットの値で、`SHIFT` と同じになります。
つまり、ZST では `TAG` も 0 になり、印のビットを使わないことが型の情報だけで決まります。

### 2. 長さと印を 1 つの値にまとめる

```rust:line-numbers=72
        Self(
            (length << Self::SHIFT) | ((on_heap as usize) & Self::TAG),
            PhantomData
        )
```

`length << SHIFT` で長さを 1 ビット上にずらし、最下位のビットを空けておきます。そこに `on_heap` を `as usize` で 0 か 1 にし、`TAG` との AND を取って OR で入れます。
たとえば `new(5, true)` は次の計算になります。

```
5 << 1          = 0b1010
(true as usize) = 1,  & TAG(1) = 1
0b1010 | 0b1    = 0b1011   （= 11）
```

### 3. 取り出し方は逆の操作

同じファイルの `len` は `self.0 >> Self::SHIFT`、`on_heap` は `self.0 & Self::TAG != 0` で、それぞれ上の位と最下位のビットを取り出します。
`new(5, true)` で作った `0b1011` は、`>> 1` で 5、`& 1` で 1（ヒープ上）になり、入れた値と一致します。

## ここがすごい

- **1 ワードに 2 つの情報**: 長さとヒープの印を別々のフィールドにすると、構造体が大きくなります。最下位ビットを印に使うと、`usize` 1 個の大きさのまま 2 つの情報を持てます。
- **型の大きさで形を変える**: ZST の場合は印の位置を 0 にして、ビットを使わないようにしています。`SHIFT` と `TAG` は型から計算されるので、実行時の分岐はありません。
- **取り出しもシフトと AND だけ**: 長さは右シフト 1 回、印は AND 1 回で取れます。構造体のフィールドを読むのと同じ程度の速さです。
- **上限の根拠**: 要素の型が 1 バイト以上なら、`Vec` の長さは `isize::MAX` バイト以下に収まります。そのため、最上位の 1 ビットを捨てても長さが入りきる、と `LocatedLength` のドキュメントに書かれています。
- **`debug_assert!` で前提を確認**: `length < MAX_LEN` と、ZST がヒープに置かれないことを、デバッグビルドで確かめています。

## まとめ

- 整数の最下位ビットを印に使うと、1 ワードで 2 つの情報を持てる。
- 型の大きさを定数で表すと、ZST の特別扱いを分岐なしで書ける。
- 詰めた値は、シフトと AND で簡単に取り出せる。
- 上限の根拠をドキュメントに書いておくと、ビット詰めの安全性が読み手に伝わる。
