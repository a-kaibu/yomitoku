---
title: ラムダの引数の型を decltype(&operator()) で読み取って振り分けに使う
description: LLVM の ErrorHandlerTraits は、渡されたラムダの operator() の型を調べ、引数がどのエラー型かを取り出す。ハンドラを書く人は型を二度書かなくてよい。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Error.h
lines: [868, 887]
function: llvm::ErrorHandlerTraits
difficulty: 3
tags: [メタプログラミング, 型システム, エラー処理]
format: 2
---

## ひとことで

`handleErrors(E, [](const FileNotFound &X) { ... })` のようにラムダを渡すと、LLVM は「このラムダは `FileNotFound` 用だ」と自動で判断します。

その判断をしているのが `ErrorHandlerTraits` です。ラムダの**呼び出し演算子 `operator()` の型**をコンパイル時に調べ、そこから**引数の型**を取り出します。
取り出した型を使って、「このエラーに使えるか（`appliesTo`）」と「正しい型に変換して呼ぶ（`apply`）」の 2 つを提供します。

## コード

::: code-group

```cpp:line-numbers=868 [日本語訳]
/// ErrorInfo 型用のハンドラが使えるかを調べ、適用するための
/// ヘルパー。
template <typename HandlerT>
class ErrorHandlerTraits
    : public ErrorHandlerTraits<
          decltype(&std::remove_reference_t<HandlerT>::operator())> {};

// 'Error (const ErrT&)' の形の関数向けの特殊化。
template <typename ErrT> class ErrorHandlerTraits<Error (&)(ErrT &)> {
public:
  static bool appliesTo(const ErrorInfoBase &E) {
    return E.template isA<ErrT>();
  }

  template <typename HandlerT>
  static Error apply(HandlerT &&H, std::unique_ptr<ErrorInfoBase> E) {
    assert(appliesTo(*E) && "Applying incorrect handler");
    return H(static_cast<ErrT &>(*E));
  }
};
```

```cpp:line-numbers=868 [原文]
/// Helper for testing applicability of, and applying, handlers for
/// ErrorInfo types.
template <typename HandlerT>
class ErrorHandlerTraits
    : public ErrorHandlerTraits<
          decltype(&std::remove_reference_t<HandlerT>::operator())> {};

// Specialization functions of the form 'Error (const ErrT&)'.
template <typename ErrT> class ErrorHandlerTraits<Error (&)(ErrT &)> {
public:
  static bool appliesTo(const ErrorInfoBase &E) {
    return E.template isA<ErrT>();
  }

  template <typename HandlerT>
  static Error apply(HandlerT &&H, std::unique_ptr<ErrorInfoBase> E) {
    assert(appliesTo(*E) && "Applying incorrect handler");
    return H(static_cast<ErrT &>(*E));
  }
};
```

:::

## 前提知識

- **ラムダ式**: `[](int x) { return x + 1; }` のような、その場で作る無名の関数です。C++ では、ラムダは **`operator()` を持つ名前のないクラスのオブジェクト**として実装されます。
- **メンバー関数ポインタ**: `&Class::operator()` は、クラスのメンバー関数を指すポインタです。その型は `戻り値 (Class::*)(引数) const` のような形をしています。
- **`decltype(式)`**: 式の型をコンパイル時に取り出します。`decltype(&L::operator())` は、ラムダ `L` の呼び出し演算子のポインタの型です。
- **`std::remove_reference_t<T>`**: `T` から参照（`&`）を外した型です。ハンドラが参照で渡されても、クラスそのものの型を得るために使います。
- **テンプレートの部分特殊化**: `ErrorHandlerTraits<Error (&)(ErrT &)>` のように、「引数がこの形の型のときはこちらを使う」という別の版を定義できます。形に合わせて `ErrT` が自動で取り出されます。
- **`E.template isA<ErrT>()`**: テンプレートの中で、別のテンプレート関数を呼ぶときに `template` キーワードが必要になることがあります。
- **`static_cast<ErrT &>(*E)`**: 親クラスの参照を子クラスの参照に変換します。

## 何をしているか

### 1. 一般の場合: operator() の型を調べ直す

```cpp:line-numbers=870
template <typename HandlerT>
class ErrorHandlerTraits
    : public ErrorHandlerTraits<
          decltype(&std::remove_reference_t<HandlerT>::operator())> {};
```

`HandlerT` がラムダの型だとします。この版は、自分自身を

```
ErrorHandlerTraits< decltype(&ラムダ型::operator()) >
```

として**継承**します。つまり「ラムダそのもの」ではなく「ラムダの `operator()` の型」で調べ直すわけです。

`[](const FileNotFound &X) { ... }` の `operator()` の型は、おおよそ

```
void (ラムダ型::*)(const FileNotFound &) const
```

です。この形に合う特殊化は、同じファイルの少し下で定義されています。

```cpp:line-numbers=953
template <typename C, typename RetT, typename ErrT>
class ErrorHandlerTraits<RetT (C::*)(const ErrT &) const>
    : public ErrorHandlerTraits<RetT (&)(ErrT &)> {};
```

ここで `C` がラムダ型、`RetT` が `void`、`ErrT` が `FileNotFound` と取り出されます。そして「`void (&)(FileNotFound &)` 型の関数用」の特殊化に、さらに処理を任せます。

### 2. 最終的な形: 判定と呼び出し

```cpp:line-numbers=876
template <typename ErrT> class ErrorHandlerTraits<Error (&)(ErrT &)> {
public:
  static bool appliesTo(const ErrorInfoBase &E) {
    return E.template isA<ErrT>();
  }

  template <typename HandlerT>
  static Error apply(HandlerT &&H, std::unique_ptr<ErrorInfoBase> E) {
    assert(appliesTo(*E) && "Applying incorrect handler");
    return H(static_cast<ErrT &>(*E));
  }
};
```

引数の型 `ErrT` が分かれば、あとは簡単です。

- `appliesTo(E)`: `E` が `ErrT` の一種か、`isA` で調べます。
- `apply(H, E)`: `E` を `ErrT &` に変換して、ハンドラ `H` を呼びます。

コードに引用したのは、ハンドラが `Error` を返す場合の版です。`void` を返す場合の版も別にあり、そちらは呼んだ後に `Error::success()` を返します。

## ここがすごい

この仕組みが無ければ、利用者は次のように型を二度書く必要があります。

```cpp
handleErrors(E, handler<FileNotFound>([](const FileNotFound &X) { ... }));
```

`ErrorHandlerTraits` は、**ラムダが自分の引数の型を知っている**ことを利用し、それを `decltype` と部分特殊化で引き出しています。

- ラムダ、普通の関数、メンバー関数のどれでも、特殊化を足すことで同じように扱える
- 引数が `ErrT &` でも `const ErrT &` でも `std::unique_ptr<ErrT>` でも、特殊化で吸収し、最終的に少数の「本体」の版へまとめる（継承で処理を任せる）
- すべてコンパイル時に決まるので、実行時には `isA` の判定と関数呼び出しだけが残る

という設計で、利用者のコードを最小限にしています。

「`operator()` の型を経由して、ラムダの引数を調べる」という技は、C++ のテンプレートで呼び出し可能なオブジェクトの型情報を取り出す定番のテクニックです。

## まとめ

- ラムダは `operator()` を持つクラス。その型を `decltype(&T::operator())` で取り出せる。
- メンバー関数ポインタの型を部分特殊化で分解すると、引数や戻り値の型が手に入る。
- いろいろな形の特殊化を、継承で少数の本体へまとめると重複が減る。
- 型をコードから推論させれば、利用者が同じ型を二度書かずに済む。
