---
title: 欠けたフィールドを、型に応じて None かエラーにする
description: serde の missing_field。JSON にないフィールドを埋めるとき、Option なら None を返し、それ以外は missing field のエラーにする。偽のデシリアライザを使って、型ごとに振る舞いを決める。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde/src/private/de.rs
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
pub fn missing_field<'de, V, E>(field: &'static str) -> Result<V, E>
where
    V: Deserialize<'de>,
    E: Error,
{
    struct MissingFieldDeserializer<E>(&'static str, PhantomData<E>);

    #[cfg_attr(not(no_diagnostic_namespace), diagnostic::do_not_recommend)]
    impl<'de, E> Deserializer<'de> for MissingFieldDeserializer<E>
    where
        E: Error,
    {
        type Error = E;

        fn deserialize_any<V>(self, _visitor: V) -> Result<V::Value, E>
        where
            V: Visitor<'de>,
        {
            Err(Error::missing_field(self.0))
        }

        fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, E>
        where
            V: Visitor<'de>,
        {
            visitor.visit_none()
        }

        serde_core::forward_to_deserialize_any! {
            bool i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 f32 f64 char str string
            bytes byte_buf unit unit_struct newtype_struct seq tuple
            tuple_struct map struct enum identifier ignored_any
        }
    }

    let deserializer = MissingFieldDeserializer(field, PhantomData);
    Deserialize::deserialize(deserializer)
}
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
    struct MissingFieldDeserializer<E>(&'static str, PhantomData<E>);
```

`MissingFieldDeserializer` は、フィールドの名前と、エラーの型だけを持ちます。実際のデータは持ちません。どの読み取りも、「その値は無い」という形で答えます。

### 2. `Option` なら、None を返す

```rust:line-numbers=45
        fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, E>
        where
            V: Visitor<'de>,
        {
            visitor.visit_none()
        }
```

`deserialize_option` が呼ばれたとき、`visit_none` で `None` を返します。`Option` 型のフィールドは、欠けていても問題ありません。

### 3. それ以外は、フィールドがないエラーにする

```rust:line-numbers=38
        fn deserialize_any<V>(self, _visitor: V) -> Result<V::Value, E>
        where
            V: Visitor<'de>,
        {
            Err(Error::missing_field(self.0))
        }
```

`deserialize_any` は、`missing_field` のエラーを返します。`Option` 以外の型は、ここで失敗します。エラーには、足りないフィールドの名前が入ります。

### 4. 残りのメソッドを転送する

```rust:line-numbers=52
        serde_core::forward_to_deserialize_any! {
            bool i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 f32 f64 char str string
            bytes byte_buf unit unit_struct newtype_struct seq tuple
            tuple_struct map struct enum identifier ignored_any
        }
```

数値や文字列などの読み取りは、すべて `deserialize_any` へ転送されます。同じエラーになるので、個別に書く必要がありません。

### 5. 読み取り器を使って値を作る

```rust:line-numbers=59
    let deserializer = MissingFieldDeserializer(field, PhantomData);
    Deserialize::deserialize(deserializer)
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
