---
title: 継承して using するだけで protected メンバを取り出す裏技
description: std::back_insert_iterator が内部に持つコンテナへの参照を取り出す関数。関数内で派生クラスを作り、using で protected メンバを公開するという、規格の範囲内の小技を使う。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/core.h
lines: [490, 499]
function: detail::get_container
difficulty: 2
format: 2
tags: [イディオム, 型システム, ハック, 標準ライブラリ]
---

## ひとことで

`std::back_inserter(vec)` が返す `std::back_insert_iterator` は、書き込むたびに `vec.push_back` を呼ぶ出力先です。{fmt} はこの出力先を受け取ったとき、1 文字ずつ `push_back` するのではなく、**中のコンテナに直接まとめて書き込みたい** のです。

ところが、イテレータが持つコンテナへのポインタ `container` は `protected`（外から見えない）メンバです。`get_container` は、それを **合法的に** 取り出します。

## コード

::: code-group

```cpp:line-numbers=490 [日本語訳]
// *insert_iterator からコンテナへの参照を取り出す。
template <typename OutputIt>
inline FMT_CONSTEXPR auto get_container(OutputIt it) ->
    typename OutputIt::container_type& {
  struct accessor : OutputIt {
    constexpr accessor(OutputIt base) : OutputIt(base) {}
    using OutputIt::container;
  };
  return *accessor(it).container;
}
```

```cpp:line-numbers=490 [原文]
// Extracts a reference to the container from *insert_iterator.
template <typename OutputIt>
inline FMT_CONSTEXPR auto get_container(OutputIt it) ->
    typename OutputIt::container_type& {
  struct accessor : OutputIt {
    constexpr accessor(OutputIt base) : OutputIt(base) {}
    using OutputIt::container;
  };
  return *accessor(it).container;
}
```

:::

## 前提知識

- **`protected` メンバ**: クラスの外からは見えないが、そのクラスを継承した派生クラスからは見えるメンバです。標準規格は `back_insert_iterator` が `protected` な `container` を持つと定めています。
- **継承 `struct accessor : OutputIt`**: `accessor` は `OutputIt` の機能をすべて受け継いだ新しい型です。
- **`using OutputIt::container;`**: 派生クラスの中で書くと、基底クラスのメンバ `container` を **派生クラスの public メンバとして** 公開し直せます。
- **関数の中のクラス（ローカルクラス）**: 関数の中で定義した型は、その関数の中でだけ使えます。
- **`typename OutputIt::container_type&`**: 戻り値の型で、「イテレータが扱うコンテナ型への参照」です。`typename` は「これは型の名前です」とコンパイラに教える印です。
- **`*ptr`**: ポインタの指す先そのものです。ここでは `container` がポインタなので、`*` でコンテナ本体の参照になります。

## 何をしているか

### 1. 受け取ったイテレータをもとに派生クラスを作る

```cpp:line-numbers=494
  struct accessor : OutputIt {
    constexpr accessor(OutputIt base) : OutputIt(base) {}
    using OutputIt::container;
  };
```

`accessor` は `OutputIt`（たとえば `std::back_insert_iterator<std::string>`）を継承しています。コンストラクタで元のイテレータをコピーして、基底クラスの部分を初期化します。

派生クラスの中からは `protected` な `container` が見えるので、`using` で public に引き上げます。

### 2. 一時オブジェクトから取り出す

```cpp:line-numbers=498
  return *accessor(it).container;
```

`accessor(it)` で一時オブジェクトを作り、`.container` でポインタを取り出し、`*` でコンテナの参照にして返します。

`std::string s;` に `std::back_inserter(s)` を渡された場合、戻り値は `s` そのものへの参照です。{fmt} はこれを使い、`s` の容量を広げてから直接書き込みます。

## ここがすごい

- **規格の範囲内のハック**: `reinterpret_cast` でメモリを覗く、といった危険な方法を使っていません。「派生クラスは protected メンバに触れる」「using でアクセス指定を変えられる」という、どちらも正当な言語のルールの組み合わせです。
- **あらゆる back_insert_iterator に効く**: テンプレートなので、`std::string` でも `std::vector<char>` でも、自作のコンテナでも同じように使えます。
- **影響を関数の中に閉じ込める**: `accessor` は関数の中だけの型なので、ほかのコードからは見えません。トリックを使っている場所が 1 か所に限られます。
- **大きな高速化につながる**: 1 文字ごとの `push_back` は毎回容量チェックが入ります。コンテナを直接得られれば、必要な分を一度に確保して `memcpy` などでまとめて書けます。

## まとめ

- 派生クラスからは基底クラスの protected メンバに触れられる。
- `using Base::member;` で、受け継いだメンバのアクセス指定を変えられる。
- 関数の中に小さなクラスを作ると、トリックの影響範囲を狭くできる。
- 標準ライブラリの型の内部も、規格が保証している範囲なら安全に利用できる。
