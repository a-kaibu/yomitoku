---
title: ラムダの引数の型や個数を、テンプレートの部分特殊化で取り出す
description: function_traits は関数・関数ポインタ・ラムダから、引数の個数、各引数の型、戻り値の型をコンパイル時に取り出します。ラムダは operator() のメンバ関数ポインタに変換して調べます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/STLExtras.h
lines: [62, 105]
function: function_traits
difficulty: 3
format: 2
tags: [メタプログラミング, 型システム, ジェネリクス]
---

## ひとことで

`function_traits<F>` は、関数のような型 `F` について、**引数の個数・各引数の型・戻り値の型** をコンパイル時に教えてくれる道具です。

```cpp
auto L = [](int, const char *) { return 1.0; };
function_traits<decltype(L)>::num_args   // 2
function_traits<decltype(L)>::arg_t<1>   // const char *
function_traits<decltype(L)>::result_t   // double
```

## コード

::: code-group

```cpp:line-numbers=62 [日本語訳]
/// 呼び出し可能なオブジェクトについて、さまざまな特性情報を提供するクラス。
///   * 引数の個数: Traits::num_args
///   * 引数の型:   Traits::arg_t<Index>
///   * 戻り値の型: Traits::result_t
template <typename T, bool isClass = std::is_class<T>::value>
struct function_traits : public function_traits<decltype(&T::operator())> {};

/// クラスの関数型向けのオーバーロード。
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...) const, false> {
  /// この関数の引数の個数。
  enum { num_args = sizeof...(Args) };

  /// この関数の戻り値の型。
  using result_t = ReturnType;

  /// この関数の引数の型。
  template <size_t Index>
  using arg_t = std::tuple_element_t<Index, std::tuple<Args...>>;
};
/// クラスの関数型向けのオーバーロード。
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...), false>
    : public function_traits<ReturnType (ClassType::*)(Args...) const> {};
/// クラスでない関数型向けのオーバーロード。
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*)(Args...), false> {
  /// この関数の引数の個数。
  enum { num_args = sizeof...(Args) };

  /// この関数の戻り値の型。
  using result_t = ReturnType;

  /// この関数の引数の型。
  template <size_t i>
  using arg_t = std::tuple_element_t<i, std::tuple<Args...>>;
};
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*const)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
/// クラスでない関数型への参照向けのオーバーロード。
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (&)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
```

```cpp:line-numbers=62 [原文]
/// This class provides various trait information about a callable object.
///   * To access the number of arguments: Traits::num_args
///   * To access the type of an argument: Traits::arg_t<Index>
///   * To access the type of the result:  Traits::result_t
template <typename T, bool isClass = std::is_class<T>::value>
struct function_traits : public function_traits<decltype(&T::operator())> {};

/// Overload for class function types.
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...) const, false> {
  /// The number of arguments to this function.
  enum { num_args = sizeof...(Args) };

  /// The result type of this function.
  using result_t = ReturnType;

  /// The type of an argument to this function.
  template <size_t Index>
  using arg_t = std::tuple_element_t<Index, std::tuple<Args...>>;
};
/// Overload for class function types.
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...), false>
    : public function_traits<ReturnType (ClassType::*)(Args...) const> {};
/// Overload for non-class function types.
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*)(Args...), false> {
  /// The number of arguments to this function.
  enum { num_args = sizeof...(Args) };

  /// The result type of this function.
  using result_t = ReturnType;

  /// The type of an argument to this function.
  template <size_t i>
  using arg_t = std::tuple_element_t<i, std::tuple<Args...>>;
};
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*const)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
/// Overload for non-class function type references.
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (&)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
```

:::

## 前提知識

- **テンプレートの部分特殊化**: 「型がこの形のときはこの定義を使う」という特別版を用意する仕組みです。コンパイラは最もよく合う版を選びます。
- **関数ポインタ型 `ReturnType (*)(Args...)`**: 「`Args...` を受け取り `ReturnType` を返す関数」を指すポインタの型です。
- **メンバ関数ポインタ型 `ReturnType (ClassType::*)(Args...) const`**: クラス `ClassType` の const メンバ関数を指すポインタの型です。
- **ラムダ式**: その場で作る無名関数です。中身は「`operator()` を持つ名前のないクラス」です。
- **`decltype(&T::operator())`**: `T` の `operator()` のメンバ関数ポインタの型です。
- **`std::is_class<T>::value`**: `T` がクラス型なら `true` です。
- **`std::tuple_element_t<I, std::tuple<Args...>>`**: 型の並び `Args...` の `I` 番目の型を取り出します。
- **`enum { num_args = ... }`**: コンパイル時の整数定数を作る古くからの書き方です。

## 何をしているか

### 1. クラス型（ラムダなど）は operator() に変換

```cpp:line-numbers=66
template <typename T, bool isClass = std::is_class<T>::value>
struct function_traits : public function_traits<decltype(&T::operator())> {};
```

第 2 引数 `isClass` の既定値は「`T` がクラスかどうか」です。クラスなら、`function_traits<decltype(&T::operator())>` を継承します。
つまり、**ラムダの問題を「メンバ関数ポインタの問題」にすり替えます**。

上のラムダ `L` なら、`&L型::operator()` の型は `double (L型::*)(int, const char *) const` です。

### 2. const メンバ関数ポインタ版が本体

```cpp:line-numbers=70
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...) const, false> {
  /// この関数の引数の個数。
  enum { num_args = sizeof...(Args) };

  /// この関数の戻り値の型。
  using result_t = ReturnType;

  /// この関数の引数の型。
  template <size_t Index>
  using arg_t = std::tuple_element_t<Index, std::tuple<Args...>>;
};
```

`ReturnType (ClassType::*)(Args...) const` の形にぴったり合うので、テンプレート引数として `ReturnType = double`、`Args... = int, const char *` が自動で取り出されます。

- `num_args` は `sizeof...(Args)` で 2
- `result_t` は `double`
- `arg_t<Index>` は `std::tuple` を使って `Index` 番目の型を取り出す別名テンプレート

### 3. 他の形は本体へ転送

```cpp:line-numbers=83
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType (ClassType::*)(Args...), false>
    : public function_traits<ReturnType (ClassType::*)(Args...) const> {};
/// クラスでない関数型向けのオーバーロード。
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*)(Args...), false> {
  /// この関数の引数の個数。
  enum { num_args = sizeof...(Args) };

  /// この関数の戻り値の型。
  using result_t = ReturnType;

  /// この関数の引数の型。
  template <size_t i>
  using arg_t = std::tuple_element_t<i, std::tuple<Args...>>;
};
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (*const)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
/// クラスでない関数型への参照向けのオーバーロード。
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType (&)(Args...), false>
    : public function_traits<ReturnType (*)(Args...)> {};
```

- 非 const のメンバ関数（`mutable` なラムダなど）→ const 版を継承
- 関数ポインタ `R (*)(Args...)` → 独自に定義
- const な関数ポインタ、関数への参照 → 関数ポインタ版を継承

継承を使って、同じ定義を何度も書かずに済ませています。

## ここがすごい

- **ラムダを型で解析できる**: ラムダの型には名前がありませんが、`operator()` のポインタに変換すれば、普通のパターンマッチで分解できます。C++ のテンプレートの強力さがよくわかる例です。
- **パターンマッチで値を取り出す**: 部分特殊化は、型の形に合わせて `ReturnType` や `Args...` を自動で抜き出します。関数型言語のパターンマッチに似ています。
- **tuple を型のリストとして使う**: `Args...` の `I` 番目を取り出す仕組みは C++ に直接はないので、`std::tuple` に詰めて `tuple_element_t` で取り出しています。
- **重複を継承で減らす**: 形の違うバリエーションは、本体の特殊化を継承するだけで対応しています。

## まとめ

- 部分特殊化を使うと、型の「形」から部品の型を取り出せる。
- ラムダは `operator()` を持つクラスなので、そのメンバ関数ポインタを調べれば引数がわかる。
- 型の並びから I 番目を取り出すには `std::tuple_element_t` が使える。
- 似たバリエーションは、共通の特殊化を継承すると短く書ける。

