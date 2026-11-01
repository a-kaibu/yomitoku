---
title: 既存のキーを上書きしても、順番の位置は変えない
description: indexmap の内部で、同じキーの値を入れ替える処理。既存の位置は変えずに値を差し替え、新しいキーなら末尾に追加する。Entry API で両方を 1 回の検索で分ける。
language: rust
project: indexmap
repo: https://github.com/indexmap-rs/indexmap
license: Apache-2.0 OR MIT
copyright: Copyright (c) 2016--2017
commit: "41a870887c4c77adf665886e63df08f406bfe37a"
file: src/inner.rs
lines: [352, 381]
function: Core::replace_full
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, API設計]
---

## ひとことで

`replace_full` は、`IndexMap` にキーと値を入れるときの内部処理です。**同じキーがすでにあれば、その位置を変えずに値を差し替え**、なければ **末尾に新しく加えます**。どちらの場合も、前の値（あれば）を返します。

`IndexMap` は、入れた順番を覚えているハッシュマップです。順番を保つために、要素の本体（`entries`）と、ハッシュの表（`indices`）の 2 つを持ちます。この関数は、その 2 つを同時に正しく更新します。

## コード

```rust:line-numbers=352
    pub(crate) fn replace_full(
        &mut self,
        hash: HashValue,
        key: K,
        value: V,
    ) -> (usize, Option<(K, V)>)
    where
        K: Eq,
    {
        let eq = equal(&key, &self.entries);
        let hasher = get_hash(&self.entries);
        match self.indices.entry(hash.get(), eq, hasher) {
            hash_table::Entry::Occupied(entry) => {
                let i = *entry.get();
                let entry = &mut self.entries[i];
                let kv = (
                    mem::replace(&mut entry.key, key),
                    mem::replace(&mut entry.value, value),
                );
                (i, Some(kv))
            }
            hash_table::Entry::Vacant(entry) => {
                let i = self.entries.len();
                entry.insert(i);
                self.push_entry(hash, key, value);
                debug_assert_eq!(self.indices.len(), self.entries.len());
                (i, None)
            }
        }
    }
```

この関数は、呼び出し側から受け取ったハッシュ値を使います。ハッシュを計算し直さないので、同じキーを 2 回ハッシュしなくて済みます。戻り値は、その要素の位置と、差し替えた古いキーと値の組です。

## 前提知識

- **`IndexMap`**: 挿入順を保つハッシュマップです。要素は、挿入された順に並んで保存されます。
- **`entries` と `indices`**: `entries` は要素の本体を順に並べた配列です。`indices` は、ハッシュ値から `entries` の添字を引く表です。
- **Entry API**: 「既存なら何かをする、なければ別のことをする」を 1 回の検索で書くための仕組みです。`Occupied` と `Vacant` の 2 つに分かれます。
- **`mem::replace`**: 値を別の値に入れ替え、古い値を返します。
- **`debug_assert_eq!`**: デバッグのときだけ、2 つの長さが揃っていることを確かめます。

## 何をしているか

### 1. 検索の準備をする

```rust:line-numbers=361
        let eq = equal(&key, &self.entries);
        let hasher = get_hash(&self.entries);
```

新しいキーと、既存のキーを比べる関数（`equal`）を用意します。ハッシュ値は、呼び出し側から受け取ったものを使います。

### 2. 既存のキーなら、中身を差し替える

```rust:line-numbers=364
            hash_table::Entry::Occupied(entry) => {
                let i = *entry.get();
                let entry = &mut self.entries[i];
                let kv = (
                    mem::replace(&mut entry.key, key),
                    mem::replace(&mut entry.value, value),
                );
                (i, Some(kv))
```

`Occupied` なら、そのキーの位置 `i` を取り出し、`entries[i]` のキーと値を `mem::replace` で入れ替えます。位置は `i` のままです。古いキーと値を組にして返します。

### 3. 新しいキーなら、末尾に加える

```rust:line-numbers=373
            hash_table::Entry::Vacant(entry) => {
                let i = self.entries.len();
                entry.insert(i);
                self.push_entry(hash, key, value);
                debug_assert_eq!(self.indices.len(), self.entries.len());
                (i, None)
```

`Vacant` なら、新しい位置は `entries` の末尾です。`indices` に位置を登録し、`push_entry` で本体を追加します。`debug_assert_eq!` で、2 つの表の長さが一致していることを確かめます。

## ここがすごい

- **位置が変わらない**: 既存のキーを上書きしても、順番が動きません。反復の順番が、挿入の順番のままに保たれます。
- **検索は 1 回**: Entry API を使うので、「あるか」を調べてから「入れる」という 2 度の検索になりません。
- **ハッシュを使い回す**: 呼び出し側が計算したハッシュ値をそのまま使うので、計算が 1 回で済みます。

## まとめ

- 既存のキーは位置を変えずに値を差し替え、新しいキーは末尾に加える。
- Entry API で、検索を 1 回だけにする。
- 2 つの表の長さを揃えて、順番と検索の表が食い違わないようにする。
