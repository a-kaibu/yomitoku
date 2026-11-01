---
title: 変数のアドレスを「型の背番号」にする FastTypeId
description: 型ごとに一意な ID をコンパイル時に作る仕組み。型ごとに作られる static 変数のアドレスを ID として使うので、RTTI もハッシュも登録処理もいらない。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors.
file: absl/base/fast_type_id.h
lines: [26, 68]
function: FastTypeId
difficulty: 2
tags: [型システム, メタプログラミング, ハック]
---

## ひとことで

`absl::FastTypeId<T>()` は、型 `T` ごとに **ほかと重ならない ID** を返します。`FastTypeId<int>() == FastTypeId<int>()` は真、`FastTypeId<int>() == FastTypeId<double>()` は偽です。
仕組みはとても単純で、「型ごとに 1 個ずつ作られる変数」の **アドレス** を ID として使っています。

## コード

::: code-group

```cpp:line-numbers=26 [日本語訳]
namespace base_internal {
template <typename Type>
struct FastTypeTag {
  static constexpr char kDummyVar = 0;
};
}  // namespace base_internal の終わり

// `absl::FastTypeId<T>()` が返す型。
class FastTypeIdType final {
 public:
  // どの型にも対応しない値を作る。この値は、
  // `FastTypeId<T>()` が返すどの値とも異なる。
  constexpr FastTypeIdType() = default;

  template <typename H>
  friend H AbslHashValue(H h, FastTypeIdType x) {
    return H::combine(std::move(h), x.ptr_);
  }

  friend constexpr bool operator==(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ == b.ptr_;
  }
  friend constexpr bool operator!=(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ != b.ptr_;
  }

 private:
  // `FastTypeId<T>()` は FastTypeIdType の値を生成するメソッド。
  template <typename T>
  friend constexpr FastTypeIdType FastTypeId();

  explicit constexpr FastTypeIdType(const void* ptr) : ptr_(ptr) {}

  const void* ptr_ = nullptr;
};

// `absl::FastTypeId<Type>()` は、渡された型に対する一意な ID に
// コンパイル時に評価される。マップのキーや、そのままの比較に
// 使うのにぴったりだ。
template <typename Type>
constexpr FastTypeIdType FastTypeId() {
  return FastTypeIdType(&base_internal::FastTypeTag<Type>::kDummyVar);
}
```

```cpp:line-numbers=26 [原文]
namespace base_internal {
template <typename Type>
struct FastTypeTag {
  static constexpr char kDummyVar = 0;
};
}  // namespace base_internal

// The type returned by `absl::FastTypeId<T>()`.
class FastTypeIdType final {
 public:
  // Creates a value that does not correspond to any type. This value is
  // distinct from any value returned by `FastTypeId<T>()`.
  constexpr FastTypeIdType() = default;

  template <typename H>
  friend H AbslHashValue(H h, FastTypeIdType x) {
    return H::combine(std::move(h), x.ptr_);
  }

  friend constexpr bool operator==(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ == b.ptr_;
  }
  friend constexpr bool operator!=(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ != b.ptr_;
  }

 private:
  // `FastTypeId<T>()` is the generator method for FastTypeIdType values.
  template <typename T>
  friend constexpr FastTypeIdType FastTypeId();

  explicit constexpr FastTypeIdType(const void* ptr) : ptr_(ptr) {}

  const void* ptr_ = nullptr;
};

// `absl::FastTypeId<Type>()` evaluates at compile-time to a unique id for the
// passed-in type. These are meant to be good match for keys into maps or
// straight up comparisons.
template <typename Type>
constexpr FastTypeIdType FastTypeId() {
  return FastTypeIdType(&base_internal::FastTypeTag<Type>::kDummyVar);
}
```

:::

## 前提知識

- **クラステンプレートの static メンバ**: `template <typename Type> struct FastTypeTag { static constexpr char kDummyVar = 0; };` と書くと、`FastTypeTag<int>::kDummyVar` と `FastTypeTag<double>::kDummyVar` は **別々の変数** になります。テンプレートは型ごとに別のクラスを作るからです。
- **アドレス**: 変数が置かれているメモリ上の場所です。別々の変数は、必ず別のアドレスを持ちます。`&x` で取り出せます。
- **`const void*`**: 「何の型かは問わない、読み取り専用の場所」を指すポインタです。比べることはできますが、中身は読めません。
- **`friend`**: クラスの外の関数に、そのクラスの非公開メンバを触らせる宣言です。
- **`final`**: このクラスを継承できないようにする指定です。
- **`explicit constexpr FastTypeIdType(const void* ptr)`**: ポインタから ID を作るコンストラクタです。`private` に置かれているので、外からは作れません。
- **`AbslHashValue`**: Abseil のハッシュテーブルのキーに使えるようにするための関数です。

## 何をしているか

### 1. 型ごとの目印

```cpp:line-numbers=26
namespace base_internal {
template <typename Type>
struct FastTypeTag {
  static constexpr char kDummyVar = 0;
};
}  // namespace base_internal の終わり
```

`FastTypeTag<Type>` は、中身が `char` 1 個だけの構造体テンプレートです。`kDummyVar` の値（0）には意味がありません。大事なのは、型ごとに **別の変数として存在する** ことだけです。

### 2. ID を作る

```cpp:line-numbers=65
template <typename Type>
constexpr FastTypeIdType FastTypeId() {
  return FastTypeIdType(&base_internal::FastTypeTag<Type>::kDummyVar);
}
```

`FastTypeId<Type>()` は、`&FastTypeTag<Type>::kDummyVar`、つまりその型専用の変数のアドレスを `FastTypeIdType` に包んで返します。

- `FastTypeId<int>()` は `&FastTypeTag<int>::kDummyVar`
- `FastTypeId<std::string>()` は `&FastTypeTag<std::string>::kDummyVar`

2 つは別の変数なので、アドレスは必ず違います。同じ型なら、何回呼んでも、どのファイルから呼んでも同じ変数を指します。

### 3. ID の型

```cpp:line-numbers=34
class FastTypeIdType final {
 public:
  // どの型にも対応しない値を作る。この値は、
  // `FastTypeId<T>()` が返すどの値とも異なる。
  constexpr FastTypeIdType() = default;

  template <typename H>
  friend H AbslHashValue(H h, FastTypeIdType x) {
    return H::combine(std::move(h), x.ptr_);
  }

  friend constexpr bool operator==(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ == b.ptr_;
  }
  friend constexpr bool operator!=(FastTypeIdType a, FastTypeIdType b) {
    return a.ptr_ != b.ptr_;
  }

 private:
  // `FastTypeId<T>()` は FastTypeIdType の値を生成するメソッド。
  template <typename T>
  friend constexpr FastTypeIdType FastTypeId();

  explicit constexpr FastTypeIdType(const void* ptr) : ptr_(ptr) {}

  const void* ptr_ = nullptr;
};
```

`FastTypeIdType` は、ポインタ 1 つを包んだだけのクラスです。

- `==` と `!=` でポインタを比べます。
- デフォルトコンストラクタは `nullptr` を持つ「どの型にも対応しない ID」を作ります。本物の ID は必ず実在の変数を指すので、`nullptr` とは重なりません。
- ポインタを受け取るコンストラクタは `private` で、`FastTypeId` だけが `friend` として使えます。利用者が適当なポインタから ID を偽造できないようにしています。

## ここがすごい

- **`typeid` より軽い**: 標準の `typeid(T)` は RTTI（実行時型情報）が必要で、コンパイル設定で RTTI を切っていると使えません。`FastTypeId` はただの変数のアドレスなので、RTTI がなくても使えます。
- **登録がいらない**: 「型ごとに番号を振る」なら、普通は誰かが番号表を管理する必要があります。ここでは **リンカ** が変数を 1 つずつメモリに配置する仕組みが、そのまま一意性を保証してくれます。
- **コンパイル時に決まる**: `constexpr` 関数なので、ID を定数として使えます。比較はポインタの比較 1 回で、文字列の型名を比べるよりずっと速いです。
- **薄いラッパーで意味を持たせる**: 生の `const void*` を返すのではなく専用の型に包んだことで、「型 ID 以外のポインタ」と混ざる間違いを防いでいます。ハッシュの対応も付いているので、型をキーにしたマップがすぐ作れます。

注意点として、ID の値（アドレス）はプログラムの実行ごとに変わることがあります。ファイルに保存して後で比べる用途には使えません。

## まとめ

- テンプレートの static 変数は型ごとに 1 個ずつ作られる。そのアドレスは型の一意な ID になる。
- 一意性をリンカに保証させれば、番号の登録や管理がいらない。
- 生のポインタを専用の型で包み、作り方を `private` にすると、誤用や偽造を防げる。
- アドレスベースの ID は実行ごとに変わりうるので、プロセス内だけで使う。
