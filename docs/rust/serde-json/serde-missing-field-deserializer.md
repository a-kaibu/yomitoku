---
title: 欠けたフィールドを、型に応じて None かエラーにする
description: serde の missing_field。JSON にないフィールドを埋めるとき、Option なら None を返し、それ以外は missing field のエラーにする。偽のデシリアライザを使って、型ごとに振る舞いを決める。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/de.rs
lines: [24, 61]
function: missing_field
difficulty: 3
format: 2
tags: [型システム, ジェネリクス, 防御的プログラミング]
---

## ひとことで

`missing_field` は、デシリアライズ（JSON などからの読み込み）で **JSON に存在しないフィールドの値を作る** 関数です。その型が `Option` なら `None` を返し、そうでなければ「フィールドがない」というエラーを返します。

この判断を、型の仕組みに任せるのがポイントです。偽のデシリアライザ `MissingFieldDeserializer` を作り、その中で `deserialize_option` と `deserialize_any` の振る舞いを分けています。

## コード

```rust:line-numbers=24
#[cfg(feature = "std")]
#[cfg_attr(docsrs, doc(cfg(feature = "std")))]
pub use crate::read::IoRead;

//////////////////////////////////////////////////////////////////////////////

/// A structure that deserializes JSON into Rust values.
pub struct Deserializer<R> {
    read: R,
    scratch: Vec<u8>,
    remaining_depth: u8,
    #[cfg(feature = "float_roundtrip")]
    single_precision: bool,
    #[cfg(feature = "unbounded_depth")]
    disable_recursion_limit: bool,
}

impl<'de, R> Deserializer<R>
where
    R: read::Read<'de>,
{
    /// Create a JSON deserializer from one of the possible serde_json input
    /// sources.
    ///
    /// When reading from a source against which short reads are not efficient, such
    /// as a [`File`], you will want to apply your own buffering because serde_json
    /// will not buffer the input. See [`std::io::BufReader`].
    ///
    /// Typically it is more convenient to use one of these methods instead:
    ///
    ///   - Deserializer::from_str
    ///   - Deserializer::from_slice
    ///   - Deserializer::from_reader
    ///
    /// [`File`]: std::fs::File
    pub fn new(read: R) -> Self {
        Deserializer {
            read,
```

この関数は、`V` という値の型を指定して、`Deserialize::deserialize` を呼ぶだけです。実際の判断は、内部の `MissingFieldDeserializer` が行います。`V` が `Option` の型なら、`deserialize_option` が呼ばれ、それ以外なら `deserialize_any` が呼ばれます。

## 前提知識

- **デシリアライズ**: 外部の形式（JSON など）のデータを、Rust の値に変える処理です。
- **`Deserialize` と `Deserializer`**: 型が自分の読み方を宣言するのが `Deserialize`、データ形式ごとの読み取り器が `Deserializer` です。
- **`Visitor`**: 読み取った値を受け取って、目的の型に組み立てる役です。
- **`Option`**: 値があるかないかを表す型です。欠けていてもよいフィールドを表すのに使われます。
- **`forward_to_deserialize_any!`**: 多くのメソッドを、1 つの `deserialize_any` へ転送するマクロです。

## 何をしているか

### 1. 偽の読み取り器を用意する

```rust:line-numbers=29

```

`MissingFieldDeserializer` は、フィールドの名前と、エラーの型だけを持ちます。実際のデータは持ちません。どの読み取りも、「その値は無い」という形で答えます。

### 2. `Option` なら、None を返す

```rust:line-numbers=45
    /// Create a JSON deserializer from one of the possible serde_json input
    /// sources.
    ///
    /// When reading from a source against which short reads are not efficient, such
    /// as a [`File`], you will want to apply your own buffering because serde_json
    /// will not buffer the input. See [`std::io::BufReader`].
```

`deserialize_option` が呼ばれたとき、`visit_none` で `None` を返します。`Option` 型のフィールドは、欠けていても問題ありません。

### 3. それ以外は、フィールドがないエラーにする

```rust:line-numbers=38
    disable_recursion_limit: bool,
}

impl<'de, R> Deserializer<R>
where
    R: read::Read<'de>,
```

`deserialize_any` は、`missing_field` のエラーを返します。`Option` 以外の型は、ここで失敗します。エラーには、足りないフィールドの名前が入ります。

### 4. 残りのメソッドを転送する

```rust:line-numbers=52
    /// Typically it is more convenient to use one of these methods instead:
    ///
    ///   - Deserializer::from_str
    ///   - Deserializer::from_slice
    ///   - Deserializer::from_reader
```

数値や文字列などの読み取りは、すべて `deserialize_any` へ転送されます。同じエラーになるので、個別に書く必要がありません。

### 5. 読み取り器を使って値を作る

```rust:line-numbers=59
    pub fn new(read: R) -> Self {
        Deserializer {
```

偽の読み取り器を作り、`V::deserialize` に渡します。結果は、そのまま呼び出し側へ返ります。

## ここがすごい

- **型による振る舞いの分岐**: 「Option かどうか」の判断を、`if` ではなく、型が呼ぶメソッドの違いで表しています。新しい型を追加しても、判断の場所は変わりません。
- **データを持たない**: 偽の読み取り器は、データの代わりに名前とエラーの型だけを持ちます。余計な領域を使いません。
- **転送で重複を減らす**: 多くの型を、1 つの `deserialize_any` にまとめます。同じ処理を何度も書かずに済みます。

## まとめ

- 欠けたフィールドの扱いは、偽の読み取り器の `deserialize_option` と `deserialize_any` の違いで決める。
- `Option` なら `None`、それ以外なら「フィールドがない」エラーになる。
- 多くのメソッドは、マクロで 1 か所に転送して重複を減らす。
