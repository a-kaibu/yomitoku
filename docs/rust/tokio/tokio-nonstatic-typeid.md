---
title: "'static でない型でも、型の識別子を取り出す"
description: tokio の内部で使う nonstatic_typeid。TypeId::of は 'static な型しか受け付けないので、PhantomData を trait object に変え、寿命の表記だけを変えて識別子を得る。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/util/typeid.rs
lines: [21, 45]
function: nonstatic_typeid
difficulty: 3
format: 2
tags: [型システム, ジェネリクス, 防御的プログラミング]
---

## ひとことで

`nonstatic_typeid` は、ある型 `T` の **型の識別子（`TypeId`）** を取り出す関数です。`TypeId` は、2 つの型が同じかどうかを比べるための値です。

通常の `TypeId::of::<T>()` は、`T` が `'static`（プログラムの最後まで生きる）な型でないと使えません。この関数は、`'static` でない型でも同じ識別子を得るために、型の寿命の表記だけを書き換える工夫をしています。

## コード

```rust:line-numbers=21
fn nonstatic_typeid<T>() -> TypeId
where
    T: ?Sized,
{
    trait NonStaticAny {
        fn get_type_id(&self) -> TypeId
        where
            Self: 'static;
    }

    impl<T: ?Sized> NonStaticAny for PhantomData<T> {
        #[inline(always)]
        fn get_type_id(&self) -> TypeId
        where
            Self: 'static,
        {
            TypeId::of::<T>()
        }
    }

    let phantom_data = PhantomData::<T>;
    NonStaticAny::get_type_id(unsafe {
        mem::transmute::<&dyn NonStaticAny, &(dyn NonStaticAny + 'static)>(&phantom_data)
    })
}
```

この関数の中には、内部の小さなトレイト `NonStaticAny` と、その実装が書かれています。実装は `PhantomData<T>` に対して、`TypeId::of::<T>()` を返すだけです。`PhantomData` は、中身を持たずに型だけを表す値です。

## 前提知識

- **`TypeId`**: 型ごとに決まる識別子です。同じ型なら同じ値になります。
- **`'static` 境界**: 型が、参照などの一時的な借用を含まず、プログラムの最後まで有効であることを表す条件です。`TypeId::of` はこれを要求します。
- **`PhantomData<T>`**: 中身を持たず、型 `T` だけを型の上で表すための型です。
- **トレイトオブジェクト（`dyn Trait`）**: トレイトを実装した値を、型を隠して扱う仕組みです。
- **`transmute`**: ある型のビット表現を、別の型として読み替えます。寿命の表記だけを変えるときに使われます。`unsafe` で、正しさは呼び出し側が保証します。

## 何をしているか

### 1. トレイトと実装を用意する

```rust:line-numbers=25
    trait NonStaticAny {
        fn get_type_id(&self) -> TypeId
        where
            Self: 'static;
    }

    impl<T: ?Sized> NonStaticAny for PhantomData<T> {
        #[inline(always)]
        fn get_type_id(&self) -> TypeId
        where
            Self: 'static,
        {
            TypeId::of::<T>()
        }
    }
```

`NonStaticAny` は、`get_type_id` だけを持つトレイトです。`where Self: 'static` という条件を付けてあり、このメソッドは `'static` な値にだけ呼べます。実装は `PhantomData<T>` について、`TypeId::of::<T>()` を返します。`T` は `?Sized` なので、スライスやトレイトオブジェクトも扱えます。

### 2. 値をトレイトオブジェクトに変える

```rust:line-numbers=41
    let phantom_data = PhantomData::<T>;
    NonStaticAny::get_type_id(unsafe {
        mem::transmute::<&dyn NonStaticAny, &(dyn NonStaticAny + 'static)>(&phantom_data)
    })
```

`PhantomData::<T>` の値を作ります。その参照を、`&dyn NonStaticAny` から `&(dyn NonStaticAny + 'static)` へ `transmute` で読み替えます。寿命の表記だけが変わり、中身のビットは変わりません。その後、`get_type_id` を呼んで識別子を得ます。

## ここがすごい

- **実際の型情報を使う**: 戻り値の `TypeId` は、`PhantomData<T>` の実装が `TypeId::of::<T>()` を返すことで決まります。値そのものは使っていません。
- **寿命の表記だけを変える**: `transmute` は、型の寿命を偽るだけで、データの内容は変えません。`PhantomData` は中身が無いので、読み替えが安全に成り立つ場面です。
- **小さな範囲に閉じる**: `unsafe` は、読み替えの 1 か所だけです。関数の外からは、安全な型の識別子として使えます。

## まとめ

- `'static` でない型の識別子は、`PhantomData` と `TypeId::of` を組み合わせて得られる。
- 寿命の表記だけを、`transmute` で読み替える。中身が無いので、この読み替えが成り立つ。
- `unsafe` を 1 か所に閉じ、外には安全な関数として見せる。
