---
title: 追加の余裕を、倍と 2 の冪で決めて確保する
description: smallvec の try_reserve。足りない分だけ確保すると、追加のたびに再確保が起きる。必要量と現在の容量の 2 倍の大きい方を、2 の冪に切り上げて、まとめて確保する。
language: rust
project: smallvec
repo: https://github.com/servo/rust-smallvec
license: MIT OR Apache-2.0
copyright: Copyright (c) 2018 The Servo Project Developers
commit: "5b5b752f87b449946513a2d0a08b0b5f5ca989d6"
file: src/lib.rs
lines: [691, 709]
function: SmallVec::try_reserve
difficulty: 3
format: 2
tags: [メモリ管理, 数値計算, エラー処理]
---

## ひとことで

`try_reserve` は、`SmallVec` に **あと何個分の要素を入れてよいかを確保する** 関数です。必要な量だけを確保すると、要素を少しずつ追加するたびに、領域を取り直すことになり、遅くなります。

この関数は、必要量と「現在の容量の 2 倍」のうち大きい方を取り、それを **2 の冪** に切り上げて確保します。余裕をまとめて持つので、以降の追加で再確保が起きにくくなります。

## コード

```rust:line-numbers=691
    pub fn try_reserve(&mut self, additional: usize) -> Result<(), SmallVecError> {
        if additional > self.capacity() - self.len() {
            let required = self
                .len()
                .checked_add(additional)
                .ok_or(SmallVecError::CapacityOverflow)?;

            let double_cap = self.capacity().saturating_mul(2);

            let new_capacity = required
                .max(double_cap)
                .checked_next_power_of_two()
                .ok_or(SmallVecError::CapacityOverflow)?;

            self.try_grow(new_capacity)
        } else {
            Ok(())
        }
    }
```

この関数は、まず、今の容量で足りるかを確かめます。足りれば何もしません。足りなければ、新しい容量を計算して `try_grow` に渡します。`try_` の名前が付いているので、失敗は `Result` で返ります。

## 前提知識

- **`SmallVec`**: 小さい要素数なら、ヒープを使わずに、スタック上の領域に要素を置く配列です。容量を超えるとヒープに移ります。
- **容量と長さ**: 容量は確保してある領域の大きさ、長さは実際に入っている要素の数です。
- **`checked_add` と `saturating_mul`**: 溢れを、エラーまたは上限値として扱うための計算です。
- **2 の冪（`checked_next_power_of_two`）**: 指定された数以上で、最も小さい 2 の冪を求めます。溢れたら `None` になります。
- **再確保**: 容量が足りなくなったとき、より大きい領域を取り直して、要素を移す処理です。

## 何をしているか

### 1. 足りているかを確かめる

```rust:line-numbers=692
        if additional > self.capacity() - self.len() {
```

`additional` が、残りの容量（容量から長さを引いたもの）より大きいときだけ、確保が必要です。足りていれば、何もせずに `Ok` を返します。

### 2. 必要な合計と、倍の容量を求める

```rust:line-numbers=693
            let required = self
                .len()
                .checked_add(additional)
                .ok_or(SmallVecError::CapacityOverflow)?;

            let double_cap = self.capacity().saturating_mul(2);
```

長さに `additional` を足して、必要な合計を求めます。溢れたら `CapacityOverflow` です。さらに、今の容量の 2 倍を求めます。上限を超えても、`saturating_mul` で値は頭打ちになります。

### 3. 大きい方を 2 の冪に切り上げる

```rust:line-numbers=700
            let new_capacity = required
                .max(double_cap)
                .checked_next_power_of_two()
                .ok_or(SmallVecError::CapacityOverflow)?;
```

必要な合計と、2 倍の容量の大きい方を取ります。それを 2 の冪に切り上げれば、新しい容量になります。ここでも溢れはエラーです。

### 4. 新しい容量で確保する

```rust:line-numbers=705
            self.try_grow(new_capacity)
```

求めた容量を `try_grow` に渡して、領域を確保します。

## ここがすごい

- **再確保の回数が対数的に減る**: 容量が 2 倍ずつ増えるので、要素を増やし続けても、再確保は要素数の対数の回数で済みます。
- **2 の冪で揃える**: 容量を 2 の冪にそろえると、領域の大きさが規則的になり、アロケータの扱いも楽になります。
- **溢れを必ず扱う**: 足し算、掛け算、切り上げのすべてで溢れを確かめ、エラーに変えます。大きすぎる要求でパニックしません。

## まとめ

- 足りないときは、必要量と 2 倍の容量の大きい方を、2 の冪に切り上げて確保する。
- 倍ずつ増やすので、再確保は要素数に対して少ない回数で済む。
- 溢れは、すべての計算でエラーとして扱う。
