---
title: 配列 2 つで、重複のない集合を O(1) で操作する
description: regex-lite の PikeVM が状態を重複なく集める SparseSet。疎な配列と密な配列の 2 つを組み合わせ、初期化をしなくても所属を確かめられる。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-lite/src/pikevm.rs
lines: [858, 876]
function: SparseSet::insert
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 正規表現]
---

## ひとことで

`insert` は、**状態の番号（`StateID`）を重複なく集める集合** に、1 つの番号を追加する関数です。すでに入っていれば何もせず、入っていなければ末尾に加えて `true` を返します。

この集合は、**疎集合（sparse set）** と呼ばれるデータ構造で作られています。普通の集合と違い、配列の 2 つを組み合わせることで、追加と所属の確認をどちらも一定の時間で行えます。

## コード

::: code-group

```rust:line-numbers=858 [日本語訳]
    fn insert(&mut self, id: StateID) -> bool {
        if self.contains(id) {
            return false;
        }

        let index = self.len();
        assert!(
            index < self.capacity(),
            "{:?} exceeds capacity of {:?} when inserting {:?}",
            index,
            self.capacity(),
            id,
        );
        self.dense[index] = id;
        // 容量は u32::MAX より大きく設定できないので、この変換は失敗しない
        // u32::MAX。
        self.sparse[id.as_usize()] = u32::try_from(index).unwrap();
        self.len += 1;
        true
```

```rust:line-numbers=858 [原文]
    fn insert(&mut self, id: StateID) -> bool {
        if self.contains(id) {
            return false;
        }

        let index = self.len();
        assert!(
            index < self.capacity(),
            "{:?} exceeds capacity of {:?} when inserting {:?}",
            index,
            self.capacity(),
            id,
        );
        self.dense[index] = id;
        // OK because we don't permit the capacity to be set higher than
        // u32::MAX.
        self.sparse[id.as_usize()] = u32::try_from(index).unwrap();
        self.len += 1;
        true
```

:::

この `SparseSet` は、正規表現エンジンの PikeVM が、同じ時点で有効な状態を集めるために使います。同じ状態を 2 回処理しないことが、速さと正しさの両方に関わります。

## 前提知識

- **集合（set）**: 同じ要素を 2 つ持たない入れ物です。所属の確認と追加が主な操作です。
- **`StateID`**: 状態を表す小さな整数の型です。配列の添字として使えます。
- **密な配列（dense）と疎な配列（sparse）**: 密な配列は、追加された順に要素を詰めて並べたものです。疎な配列は、状態の番号から密な配列の位置を引くための表です。
- **`len`**: 集合にいくつの要素が入っているかを表します。密な配列のうち、有効な部分の長さです。
- **`assert!`**: 条件が偽のときにパニックを起こす確認です。容量を超える追加を防ぎます。

## 何をしているか

### 1. 既に入っているかを確かめる

```rust:line-numbers=859
        if self.contains(id) {
            return false;
        }
```

まず `contains` で所属を確認します。すでに入っていれば `false` を返し、何もしません。これで同じ状態が重複して入ることはありません。

### 2. 容量を確かめる

```rust:line-numbers=863
        let index = self.len();
        assert!(
            index < self.capacity(),
            "{:?} exceeds capacity of {:?} when inserting {:?}",
            index,
            self.capacity(),
            id,
        );
```

新しい要素の位置は、現在の `len` と同じです。その位置が容量を超えないことを `assert!` で確認します。超えるなら、呼び出し側のバグなので、パニックにします。

### 3. 密な配列と疎な配列を書き換える

```rust:line-numbers=871
        self.dense[index] = id;
```

`dense[index]` に、新しい状態の番号を書きます。これで、密な配列が 1 つ長くなります。

```rust:line-numbers=874
        self.sparse[id.as_usize()] = u32::try_from(index).unwrap();
        self.len += 1;
```

疎な配列の `id` の位置に、`index` を書き込みます。これで「この状態は密な配列の何番目にあるか」が分かります。最後に `len` を 1 増やします。

## ここがすごい

- **リセットが一瞬で済む**: 疎な配列は、リセットのたびに値を消す必要がありません。`clear` は `len` を 0 にするだけです。古い値が残っていても、次の `contains` が正しく判定します。
- **所属確認が一定時間**: `contains` は、疎な配列で位置を引き、密な配列と比べるだけです。要素の数に関係なく、一定の作業で済みます。
- **古い値に騙されない**: `sparse` には、消えた要素の古い位置が残っていることがあります。`index < len` と `dense[index] == id` の 2 つの確認を両方行うので、誤判定が起きません。

## まとめ

- 密な配列と疎な配列を組み合わせると、重複のない集合を一定時間で操作できる。
- リセットは `len` を 0 にするだけで済むので、再利用が速い。
- 古い値が残っていても、2 つの確認で正しい所属の判定ができる。
