---
title: 可変長引数テンプレートで、いくつでも値をまとめてハッシュする
description: 任意個の値をまとめて 1 つのハッシュ値にする hash_sequence と、タプルを展開して渡す hash_tuple。可変長テンプレートの再帰と index_sequence による展開の基本形がそろっている。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/hash/Hash.h
lines: [81, 107]
function: folly::hash::detail::hash_sequence / hash_tuple
difficulty: 3
format: 2
tags: [メタプログラミング, ハッシュ, 再帰, ジェネリクス]
---

## ひとことで

`hash_sequence(h, a, b, c)` は、ハッシュ関数 `h` を使って **いくつもの値をまとめて 1 つのハッシュ値** にします。
`hash_tuple(h, t)` は、`std::tuple`（いくつかの値の組）を受け取り、その中身を `hash_sequence` に渡します。`(名前, 年齢)` のような組をハッシュテーブルのキーにしたいときに使う土台です。

どちらも、C++ の **可変長引数テンプレート** の教科書的な使い方になっています。

## コード

```cpp:line-numbers=81
template <typename H>
constexpr uint64_t hash_sequence(const H&) noexcept {
  return 0;
}

template <typename H, typename T>
constexpr uint64_t hash_sequence(const H& h, const T& v) noexcept(
    noexcept(h(v))) {
  return h(v);
}

template <typename H, typename T, typename... Ts>
constexpr uint64_t hash_sequence(
    const H& h, const T& v, const Ts&... ts) noexcept(noexcept(h(v))) {
  return hash::hash_128_to_64(h(v), hash_sequence(h, ts...));
}

template <typename H, typename Tuple, size_t... Is>
uint64_t hash_tuple_sequence(
    const H& h, const Tuple& t, std::index_sequence<Is...>) {
  return hash_sequence(h, std::get<Is>(t)...);
}

template <typename H, typename... Ts>
constexpr uint64_t hash_tuple(const H& h, const std::tuple<Ts...>& t) {
  return hash_tuple_sequence(h, t, std::make_index_sequence<sizeof...(Ts)>());
}
```

## 前提知識

- **可変長引数テンプレート `typename... Ts`**: 型を 0 個以上いくつでも受け取れるテンプレートです。`const Ts&... ts` は、それに対応する引数の並び（パラメータパック）です。`ts...` と書くと、中身が `a, b, c` のように展開されます。
- **オーバーロード**: 同じ名前で引数の数や型が違う関数を複数定義できます。呼び出し時に、合うものが選ばれます。ここでは引数が「0 個」「1 個」「2 個以上」の 3 種類があります。
- **`noexcept(noexcept(h(v)))`**: 外側の `noexcept(...)` は「この関数が例外を投げないか」の宣言で、中の `noexcept(h(v))` は「`h(v)` が例外を投げないか」を調べる式です。つまり「`h` が例外を投げないなら、この関数も投げない」と、性質を引き継いでいます。
- **`std::tuple` と `std::get<I>(t)`**: `std::tuple<int, std::string>` は値の組です。`std::get<0>(t)` で 0 番目、`std::get<1>(t)` で 1 番目を取り出します。番号はコンパイル時の定数でなければなりません。
- **`std::index_sequence<Is...>`**: `0, 1, 2, …` という **コンパイル時の番号の並び** を型として表したものです。`std::make_index_sequence<3>()` は `index_sequence<0, 1, 2>` を作ります。
- **`sizeof...(Ts)`**: パラメータパックの要素数です。

## 何をしているか

### 1. 再帰の終わりと 1 個の場合

```cpp:line-numbers=81
template <typename H>
constexpr uint64_t hash_sequence(const H&) noexcept {
  return 0;
}

template <typename H, typename T>
constexpr uint64_t hash_sequence(const H& h, const T& v) noexcept(
    noexcept(h(v))) {
  return h(v);
}
```

- 値が 0 個なら `0` を返します。
- 値が 1 個なら、そのまま `h(v)` を返します。

### 2. 2 個以上なら、先頭と残りに分ける

```cpp:line-numbers=92
template <typename H, typename T, typename... Ts>
constexpr uint64_t hash_sequence(
    const H& h, const T& v, const Ts&... ts) noexcept(noexcept(h(v))) {
  return hash::hash_128_to_64(h(v), hash_sequence(h, ts...));
}
```

`hash_sequence(h, a, b, c)` を呼ぶと、`v = a`、`ts = (b, c)` に分かれます。

```
hash_sequence(h, a, b, c)
= hash_128_to_64(h(a), hash_sequence(h, b, c))
= hash_128_to_64(h(a), hash_128_to_64(h(b), hash_sequence(h, c)))
= hash_128_to_64(h(a), hash_128_to_64(h(b), h(c)))
```

`hash_128_to_64` は 2 つの 64 ビットハッシュを 1 つにまとめる関数です。この再帰はすべて **コンパイル時に展開** され、実行時には関数呼び出しが入れ子になった普通のコードだけが残ります。

### 3. タプルを引数の並びに変える

```cpp:line-numbers=98
template <typename H, typename Tuple, size_t... Is>
uint64_t hash_tuple_sequence(
    const H& h, const Tuple& t, std::index_sequence<Is...>) {
  return hash_sequence(h, std::get<Is>(t)...);
}

template <typename H, typename... Ts>
constexpr uint64_t hash_tuple(const H& h, const std::tuple<Ts...>& t) {
  return hash_tuple_sequence(h, t, std::make_index_sequence<sizeof...(Ts)>());
}
```

`std::tuple<int, std::string, double> t` の場合で追います。

- `hash_tuple` は `sizeof...(Ts)` = 3 から `make_index_sequence<3>()`、つまり `index_sequence<0, 1, 2>` を作って渡します。
- `hash_tuple_sequence` は `Is...` = `0, 1, 2` を受け取り、`std::get<Is>(t)...` を展開します。これは `std::get<0>(t), std::get<1>(t), std::get<2>(t)` になります。
- 結果として `hash_sequence(h, 0番目, 1番目, 2番目)` が呼ばれます。

## ここがすごい

- **再帰の「終わり」を 2 段用意している**: 1 個の場合を特別に用意しているので、`hash_128_to_64(h(c), 0)` のような余計な混ぜ合わせが発生しません。最後の値はそのままのハッシュ値で使われます。0 個の場合も定義があるので、空のタプルでもコンパイルが通ります。
- **順番に意味がある**: `(a, b)` と `(b, a)` は別のハッシュ値になります。`hash_128_to_64` が 2 つの引数を対称に扱わないためです。座標 `(1, 2)` と `(2, 1)` を区別したい場合には、これが正しい性質です。
- **`index_sequence` は定番の展開技**: 「タプルの中身を関数の引数として渡す」は、`std::get` の番号がコンパイル時定数でなければならないため、普通のループでは書けません。番号の並びを型として作り、パック展開で一気に並べる、という手法は C++ のメタプログラミングで頻繁に出てきます（標準ライブラリの `std::apply` も同じ発想です）。
- **例外の性質を引き継ぐ**: `noexcept(noexcept(h(v)))` によって、ハッシュ関数が例外を投げなければ `hash_sequence` も `noexcept` になります。呼び出し側の最適化や、ムーブの可否判定に役立ちます。

## まとめ

- 可変長テンプレートは「先頭 1 個と残り」に分けて再帰すると書きやすい。
- 再帰の終わり（0 個・1 個）をオーバーロードで用意する。
- タプルを引数の並びに変えるには `std::index_sequence` とパック展開を使う。
- `noexcept(noexcept(式))` で、呼ぶ関数の性質をそのまま引き継げる。
