---
title: 要素数の決まっていない tuple を、再帰と畳み込み式でハッシュする
description: DenseMapInfo の std::tuple 版です。ハッシュは if constexpr で 1 要素ずつ再帰し、等価判定は index_sequence と畳み込み式で全要素を一度に比べます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMapInfo.h
lines: [109, 139]
function: DenseMapInfo<std::tuple<Ts...>>
difficulty: 3
format: 2
tags: [メタプログラミング, ジェネリクス, ハッシュ]
---

## ひとことで

`DenseMapInfo` は、DenseMap に「この型のハッシュ値の求め方」と「等しいかの判定方法」を教える部品です。
ここは `std::tuple`（いくつかの値をひとまとめにした型）用の定義で、**要素が何個でも、どんな型の組み合わせでも** 動くように書かれています。

## コード

::: code-group

```cpp:line-numbers=109 [日本語訳]
// 全要素に Info がある tuple 用の DenseMapInfo を用意する。
template <typename... Ts> struct DenseMapInfo<std::tuple<Ts...>> {
  using Tuple = std::tuple<Ts...>;

  template <unsigned I> static unsigned getHashValueImpl(const Tuple &values) {
    if constexpr (I == sizeof...(Ts)) {
      return 0;
    } else {
      using EltType = std::tuple_element_t<I, Tuple>;
      return detail::combineHashValue(
          DenseMapInfo<EltType>::getHashValue(std::get<I>(values)),
          getHashValueImpl<I + 1>(values));
    }
  }

  static unsigned getHashValue(const std::tuple<Ts...> &values) {
    return getHashValueImpl<0>(values);
  }

  template <std::size_t... Is>
  static bool isEqualImpl(const Tuple &lhs, const Tuple &rhs,
                          std::index_sequence<Is...>) {
    return (DenseMapInfo<std::tuple_element_t<Is, Tuple>>::isEqual(
                std::get<Is>(lhs), std::get<Is>(rhs)) &&
            ...);
  }

  static bool isEqual(const Tuple &lhs, const Tuple &rhs) {
    return isEqualImpl(lhs, rhs, std::index_sequence_for<Ts...>{});
  }
};
```

```cpp:line-numbers=109 [原文]
// Provide DenseMapInfo for all tuples whose members have info.
template <typename... Ts> struct DenseMapInfo<std::tuple<Ts...>> {
  using Tuple = std::tuple<Ts...>;

  template <unsigned I> static unsigned getHashValueImpl(const Tuple &values) {
    if constexpr (I == sizeof...(Ts)) {
      return 0;
    } else {
      using EltType = std::tuple_element_t<I, Tuple>;
      return detail::combineHashValue(
          DenseMapInfo<EltType>::getHashValue(std::get<I>(values)),
          getHashValueImpl<I + 1>(values));
    }
  }

  static unsigned getHashValue(const std::tuple<Ts...> &values) {
    return getHashValueImpl<0>(values);
  }

  template <std::size_t... Is>
  static bool isEqualImpl(const Tuple &lhs, const Tuple &rhs,
                          std::index_sequence<Is...>) {
    return (DenseMapInfo<std::tuple_element_t<Is, Tuple>>::isEqual(
                std::get<Is>(lhs), std::get<Is>(rhs)) &&
            ...);
  }

  static bool isEqual(const Tuple &lhs, const Tuple &rhs) {
    return isEqualImpl(lhs, rhs, std::index_sequence_for<Ts...>{});
  }
};
```

:::

## 前提知識

- **`std::tuple<Ts...>`**: 型の異なる値を何個でもまとめられる箱です。`std::tuple<int, char*>` なら int と char* の 2 つを持ちます。
- **可変長テンプレート `typename... Ts`**: 型を何個でも受け取れるテンプレートです。`sizeof...(Ts)` でその個数がわかります。
- **テンプレートの特殊化**: `DenseMapInfo<std::tuple<Ts...>>` は「tuple のときだけはこの定義を使う」という特別版です。
- **`std::get<I>(t)`**: tuple の `I` 番目の要素を取り出します。`I` はコンパイル時に決まっている必要があります。
- **`if constexpr`**: コンパイル時に条件を判定し、選ばれなかった側のコードは作られません。
- **`std::index_sequence<0, 1, 2>`**: 「0, 1, 2」という数の並びを型として表したものです。`std::index_sequence_for<Ts...>{}` で、要素数ぶんの並びが作れます。
- **畳み込み式 `(式 && ...)`**: パラメータパックの各要素に式を適用し、`&&` でつなげて展開します（C++17）。

## 何をしているか

### 1. ハッシュは再帰で 1 つずつ

```cpp:line-numbers=113
  template <unsigned I> static unsigned getHashValueImpl(const Tuple &values) {
    if constexpr (I == sizeof...(Ts)) {
      return 0;
    } else {
      using EltType = std::tuple_element_t<I, Tuple>;
      return detail::combineHashValue(
          DenseMapInfo<EltType>::getHashValue(std::get<I>(values)),
          getHashValueImpl<I + 1>(values));
    }
  }

  static unsigned getHashValue(const std::tuple<Ts...> &values) {
    return getHashValueImpl<0>(values);
  }
```

`getHashValueImpl<0>` から始め、`I` 番目の要素のハッシュと、`I + 1` 番目以降のハッシュを `combineHashValue` で合成します。
`I == sizeof...(Ts)`（末尾を過ぎた）ら `0` を返して止まります。

`std::tuple<int, int>` の値 `(3, 5)` で展開すると、次のような形になります。

```
combine(hash(3), combine(hash(5), 0))
```

`if constexpr` なので、末尾を過ぎた `I` で `std::tuple_element_t<I, Tuple>` を作ろうとしてコンパイルエラーになることはありません。

### 2. 等価判定は一度に展開

```cpp:line-numbers=128
  template <std::size_t... Is>
  static bool isEqualImpl(const Tuple &lhs, const Tuple &rhs,
                          std::index_sequence<Is...>) {
    return (DenseMapInfo<std::tuple_element_t<Is, Tuple>>::isEqual(
                std::get<Is>(lhs), std::get<Is>(rhs)) &&
            ...);
  }

  static bool isEqual(const Tuple &lhs, const Tuple &rhs) {
    return isEqualImpl(lhs, rhs, std::index_sequence_for<Ts...>{});
  }
```

`isEqual` は `std::index_sequence_for<Ts...>{}` を渡して `isEqualImpl` を呼びます。すると `Is...` が `0, 1` のように受け取られます。
`isEqualImpl` の `&& ...` で、次のように展開されます。

```
Info0::isEqual(get<0>(lhs), get<0>(rhs)) && Info1::isEqual(get<1>(lhs), get<1>(rhs))
```

`&&` は左から評価され、偽が出たらそこで止まるので、無駄な比較もしません。

### 3. 要素ごとに適切な Info を使う

```cpp:line-numbers=117
      using EltType = std::tuple_element_t<I, Tuple>;
      return detail::combineHashValue(
          DenseMapInfo<EltType>::getHashValue(std::get<I>(values)),
```

```cpp:line-numbers=131
    return (DenseMapInfo<std::tuple_element_t<Is, Tuple>>::isEqual(
```

各要素の型で `DenseMapInfo<EltType>` を引くので、要素がポインタならポインタ用、整数なら整数用のハッシュが自動で選ばれます。

## ここがすごい

- **2 つの技法を使い分けている**: ハッシュは「前の結果を次に渡す」処理なので再帰が自然で、等価判定は「全部が真か」なので畳み込み式が自然です。目的に合う書き方を選んでいます。
- **実行時のループがない**: どちらもコンパイル時に展開され、最終的には要素数ぶんの呼び出しが並ぶだけのコードになります。
- **部品を組み合わせるだけ**: tuple 自体のハッシュ方法を新しく考えず、要素の `DenseMapInfo` と `combineHashValue` を組み合わせています。新しい型に `DenseMapInfo` を用意すれば、その型を含む tuple も自動でキーにできます。
- **`std::pair` 版との一貫性**: 同じファイルの pair 版も同じく `combineHashValue` を使っています。

## まとめ

- 可変長テンプレートは「再帰 + `if constexpr` の終了条件」で 1 つずつ処理できる。
- `index_sequence` と畳み込み式を使うと、全要素への処理を 1 つの式に展開できる。
- 「前の結果を使う処理」は再帰、「全部に同じ処理をして結合」は畳み込みが向いている。
- 小さな部品（要素のハッシュと合成関数）を組み合わせると、複合型の対応が自動で広がる。

