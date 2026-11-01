---
title: Vec の容量は「2 倍」に増やすから push が速い
description: Vec の容量が足りなくなったときに領域を広げる関数。必要量ぴったりではなく 2 倍に増やすことで、push を平均 O(1) にしている。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/raw_vec/mod.rs
lines: [519, 555]
function: RawVecInner::grow_amortized
difficulty: 2
tags: [メモリ管理, データ構造, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`grow_amortized` は、可変長配列 `Vec` の **容量（確保済みの領域）が足りなくなったときに、新しい容量を決めて領域を広げる** 関数です。`push` で要素を追加していき、容量が埋まると呼ばれます。

ポイントは、新しい容量を「必要な分だけ」ではなく **今の容量の 2 倍** にすることです。これにより、要素を 1 個ずつ追加しても、領域の作り直しはまれにしか起きません。名前の amortized は「償却（ならし）」の意味で、ならすと 1 回あたりのコストが一定になることを表しています。

## コード

```rust:line-numbers=519
    /// # Safety
    /// - `elem_layout` must be valid for `self`, i.e. it must be the same `elem_layout` used to
    ///   initially construct `self`
    /// - `elem_layout`'s size must be a multiple of its alignment
    /// - The sum of `len` and `additional` must be greater than the current capacity
    unsafe fn grow_amortized(
        &mut self,
        len: usize,
        additional: usize,
        elem_layout: Layout,
    ) -> Result<(), TryReserveError> {
        // This is ensured by the calling contexts.
        debug_assert!(additional > 0);

        if elem_layout.size() == 0 {
            // Since we return a capacity of `usize::MAX` when `elem_size` is
            // 0, getting to here necessarily means the `RawVec` is overfull.
            return Err(CapacityOverflow.into());
        }

        // Nothing we can really do about these checks, sadly.
        let required_cap = len.checked_add(additional).ok_or(CapacityOverflow)?;

        // This guarantees exponential growth. The doubling cannot overflow
        // because `cap <= isize::MAX` and the type of `cap` is `usize`.
        let cap = cmp::max(self.cap.as_inner() * 2, required_cap);
        let cap = cmp::max(min_non_zero_cap(elem_layout.size()), cap);

        // SAFETY:
        // - cap >= len + additional
        // - other preconditions passed to caller
        let ptr = unsafe { self.finish_grow(cap, elem_layout)? };

        // SAFETY: `finish_grow` would have failed if `cap > isize::MAX`
        unsafe { self.set_ptr_and_cap(ptr, cap) };
        Ok(())
    }
```

## 前提知識

- **`Vec` と容量**: `Vec` は要素数 `len` とは別に、何個まで入る領域を確保しているか（容量 `cap`）を持っています。`len` が `cap` に達すると、より大きな領域を確保して中身を移す必要があります。
- **`Result<(), TryReserveError>`**: 成功すれば `Ok(())`（中身なし）、失敗すればエラーを返す型です。
- **`?` 演算子**: `Result` や `Option` がエラー（`Err` / `None`）なら、その場で関数からエラーを返します。
- **`checked_add` と `ok_or`**: `checked_add` は足し算があふれたら `None` を返します。`ok_or(e)` は `None` を `Err(e)` に変換します。
- **`Layout`**: 要素 1 個の大きさとアラインメント（置けるアドレスの倍数）の情報です。
- **`cmp::max(a, b)`**: 大きいほうを返します。

## 何をしているか

### 1. 大きさ 0 の型は別扱い（533〜537 行目）

大きさ 0 の型（中身のない構造体など）の `Vec` は、容量を最初から `usize::MAX` としているので、ここに来たら本当に満杯です。エラーを返します。

### 2. 必要な容量を計算（540 行目）

`len + additional`（今の要素数 + 追加したい数）を、あふれに注意して計算します。

### 3. 新しい容量を決める（544〜545 行目）

`max(今の容量 × 2, 必要な容量)` を新しい容量にします。さらに、小さすぎる容量にならないよう `min_non_zero_cap` で最低値（要素が 1 バイトなら 8、1 KiB 以下なら 4、それより大きければ 1）を下回らないようにします。

空の `Vec<i32>` に 1 個ずつ `push` すると、容量は `0 → 4 → 8 → 16 → 32 → ...` と増えます。

### 4. 領域を確保して記録（550〜554 行目）

`finish_grow` で実際にメモリを確保（または拡張）し、新しいポインタと容量を記録します。

## ここがすごい

- **2 倍にすると平均 O(1)**: 容量を 1 ずつ増やすと、n 個追加するまでに作り直しが n 回、コピーの合計は約 n²/2 回になります。2 倍ずつなら作り直しは約 log₂ n 回で、コピーの合計は `1 + 2 + 4 + ... ≈ 2n` 回に収まります。1 回の `push` あたりにならすと定数時間です。
- **オーバーフローしない理由を書いている**: 542〜543 行目のとおり、`Vec` の容量はバイト数で `isize::MAX` 以下に制限されているので、`usize` で 2 倍してもあふれません。不要なチェックを省ける根拠になっています。
- **小さな Vec をスキップ**: 容量 1 や 2 の `Vec` を作っても、メモリ確保の手間ばかりかかります。最初から 4 や 8 にすることで、無駄な作り直しを減らしています。
- **大量追加にも対応**: `extend` などで一度にたくさん追加するときは、2 倍より必要量が大きくなることがあります。`max` を取ることで、その場合は必要量ぴったりの 1 回の確保で済みます。

## まとめ

- 可変長配列は、容量を一定の倍率で増やすと追加が平均 O(1) になる。
- 小さすぎる容量は効率が悪いので、最低容量を決めておく。
- オーバーフローしない理由が説明できるなら、そのチェックは省ける。
