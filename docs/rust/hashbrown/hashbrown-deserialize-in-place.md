---
title: 既存の集合に要素を読み直して再利用する
description: hashbrown の HashSet 用 deserialize_in_place。新しい集合を作らず、既存の集合を空にしてから要素を挿入し、容量を先に確保する。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/external_trait_impls/serde.rs
lines: [180, 217]
function: deserialize_in_place
difficulty: 2
format: 2
tags: [入出力, メモリ管理, ジェネリクス]
---

## ひとことで

`deserialize_in_place` は、serde（データの読み書きを行う crate）の機能で、JSON などの列から集合を作るときに、**既存の `HashSet` を作り直さずに再利用する** 関数です。新しい集合を作って、古いものを捨てる手間を省けます。

中では、読み込み用の `Visitor` という小さな型を作ります。その型は、既存の集合への参照を持ち、要素が来るたびに集合へ挿入していきます。

## コード

```rust:line-numbers=180
        fn deserialize_in_place<D>(deserializer: D, place: &mut Self) -> Result<(), D::Error>
        where
            D: Deserializer<'de>,
        {
            struct SeqInPlaceVisitor<'a, T, S, A>(&'a mut HashSet<T, S, A>)
            where
                A: Allocator;

            impl<'de, T, S, A> Visitor<'de> for SeqInPlaceVisitor<'_, T, S, A>
            where
                T: Deserialize<'de> + Eq + Hash,
                S: BuildHasher + Default,
                A: Allocator,
            {
                type Value = ();

                fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                    formatter.write_str("a sequence")
                }

                #[cfg_attr(feature = "inline-more", inline)]
                fn visit_seq<M>(self, mut seq: M) -> Result<Self::Value, M::Error>
                where
                    M: SeqAccess<'de>,
                {
                    self.0.clear();
                    self.0.reserve(size_hint::cautious(seq.size_hint()));

                    while let Some(value) = seq.next_element()? {
                        self.0.insert(value);
                    }

                    Ok(())
                }
            }

            deserializer.deserialize_seq(SeqInPlaceVisitor(place))
        }
```

## 前提知識

- **serde**: Rust でデータの形を、JSON などの形式と相互に変換するための crate です。`Deserialize` トレイトは、データから値を作る方法を表します。
- **`Visitor`**: serde で、データの種類（列、マップなど）を順に受け取る型です。`visit_seq` は、列の要素を 1 つずつ受け取る関数です。
- **`place`（既存の場所）**: `&mut Self` で渡される、すでに存在する値への可変参照です。この関数は、その場所を書き換えます。
- **`size_hint`**: 列の要素数の見込みです。大きすぎる値を信じないように、慎重に（cautious に）使うための補助関数が使われています。
- **`Eq + Hash`**: 集合に入れる要素の条件です。等しいかどうかを比べられ、ハッシュ値を作れる必要があります。

## 何をしているか

### 1. 読み込み用の型を用意する

```rust:line-numbers=184
            struct SeqInPlaceVisitor<'a, T, S, A>(&'a mut HashSet<T, S, A>)
            where
                A: Allocator;
```

`SeqInPlaceVisitor` は、既存の `HashSet` への可変参照を 1 つだけ持つ型です。新しい集合を作る代わりに、この参照を通して、既存の集合へ直接書き込みます。

### 2. 既存の集合を空にして、容量を確保する

```rust:line-numbers=205
                    self.0.clear();
                    self.0.reserve(size_hint::cautious(seq.size_hint()));
```

`visit_seq` は、まず `clear` で中身を空にします。その後、列の長さの見込みを使って `reserve` で容量を確保します。見込みは、そのまま信じるのではなく、`size_hint::cautious` で上限を付けてから使います。

### 3. 要素を 1 つずつ挿入する

```rust:line-numbers=208
                    while let Some(value) = seq.next_element()? {
                        self.0.insert(value);
                    }

                    Ok(())
```

`next_element` で要素を 1 つずつ取り出し、集合に `insert` します。読み込みが失敗したときは、`?` によって、そのエラーがそのまま返ります。

### 4. Visitor を使って読み込みを始める

```rust:line-numbers=216
            deserializer.deserialize_seq(SeqInPlaceVisitor(place))
```

`deserialize_seq` に `SeqInPlaceVisitor` を渡し、データの読み込みを始めます。これで、結果は `place` の中に書き込まれ、戻り値は `()` になります。

## ここがすごい

- **割り当てを再利用する**: 集合を作り直さないので、すでにある容量を活かせます。同じ形のデータを何度も読むような場面で効果があります。
- **既存の値を直接書き換える**: 新しい値を返して古い値と入れ替える方法と比べて、一時的な値を作らずに済みます。
- **容量の見込みを慎重に使う**: データが悪意を持って大きな数字を伝えても、むやみに大きな領域を確保しない工夫がされています。
- **型の条件を where 句で明示する**: `T: Deserialize<'de> + Eq + Hash` などの条件が見えるので、どの要素が使えるのかが分かります。

## まとめ

- 既存の値を再利用する読み込みでは、先に空にしてから要素を入れ直すのが基本です。
- 外部から来る数字は、そのまま信じずに上限を付けて使うと安全です。
- 型の条件を書くことで、どの要素型が使えるかをコンパイラが確かめてくれます。
