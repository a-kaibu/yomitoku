---
title: 複数のラムダを多重継承で 1 つに束ね、オーバーロードにする makeVisitor
description: makeVisitor はラムダをいくつか受け取り、それらすべてを継承したクラスを作ります。using で各 operator() を取り込むので、引数の型に合ったラムダが自動で選ばれます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/STLExtras.h
lines: [1487, 1537]
function: makeVisitor
difficulty: 3
format: 2
tags: [メタプログラミング, 関数型, ジェネリクス]
---

## ひとことで

`makeVisitor` は、**いくつかのラムダを 1 つの「関数オブジェクト」にまとめる** 関数です。呼び出すと、引数の型に一番合うラムダが選ばれます。

```cpp
auto visitor = makeVisitor([](auto) { return "unhandled type"; },
                           [](int i) { return "int"; },
                           [](std::string s) { return "str"; });
visitor(42);     // "int"
visitor(3.14f);  // "unhandled type"
```

`std::variant`（いくつかの型のどれかを持つ型）の中身によって処理を分ける `std::visit` と組み合わせるのが典型的な使い方です。

## コード

::: code-group

```cpp:line-numbers=1487 [日本語訳]
namespace detail {
template <typename... Ts> struct Visitor;

template <typename HeadT, typename... TailTs>
struct Visitor<HeadT, TailTs...> : remove_cvref_t<HeadT>, Visitor<TailTs...> {
  explicit constexpr Visitor(HeadT &&Head, TailTs &&...Tail)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)),
        Visitor<TailTs...>(std::forward<TailTs>(Tail)...) {}
  using remove_cvref_t<HeadT>::operator();
  using Visitor<TailTs...>::operator();
};

template <typename HeadT> struct Visitor<HeadT> : remove_cvref_t<HeadT> {
  explicit constexpr Visitor(HeadT &&Head)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)) {}
  using remove_cvref_t<HeadT>::operator();
};
} // namespace detail の終わり

/// 型の名前を見せない呼び出し可能オブジェクトを返す。その operator() の
/// オーバーロード集合は、CallableTs の各 CallableT の operator() の集合を合わせたもの。
///
/// 返されるオブジェクトの型は、CallableTs の各 CallableT を継承する。
/// 返されるオブジェクトは、makeVisitor に渡した対応する引数について
/// オーバーロード解決で選ばれた、各 CallableT のコピーまたはムーブ
/// コンストラクタを呼んで作られる。
///
/// 例:
///
/// \code
/// auto visitor = makeVisitor([](auto) { return "unhandled type"; },
///                            [](int i) { return "int"; },
///                            [](std::string s) { return "str"; });
/// auto a = visitor(42);    // `a` は "int" になる。
/// auto b = visitor("foo"); // `b` は "str" になる。
/// auto c = visitor(3.14f); // `c` は "unhandled type" になる。
/// \endcode
///
/// ムーブしかできない型を捕まえたラムダで visitor を作る例:
///
/// \code
/// std::unique_ptr<FooHandler> FH = /* ... */;
/// auto visitor = makeVisitor(
///     [FH{std::move(FH)}](Foo F) { return FH->handle(F); },
///     [](int i) { return i; },
///     [](std::string s) { return atoi(s); });
/// \endcode
template <typename... CallableTs>
constexpr decltype(auto) makeVisitor(CallableTs &&...Callables) {
  return detail::Visitor<CallableTs...>(std::forward<CallableTs>(Callables)...);
}
```

```cpp:line-numbers=1487 [原文]
namespace detail {
template <typename... Ts> struct Visitor;

template <typename HeadT, typename... TailTs>
struct Visitor<HeadT, TailTs...> : remove_cvref_t<HeadT>, Visitor<TailTs...> {
  explicit constexpr Visitor(HeadT &&Head, TailTs &&...Tail)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)),
        Visitor<TailTs...>(std::forward<TailTs>(Tail)...) {}
  using remove_cvref_t<HeadT>::operator();
  using Visitor<TailTs...>::operator();
};

template <typename HeadT> struct Visitor<HeadT> : remove_cvref_t<HeadT> {
  explicit constexpr Visitor(HeadT &&Head)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)) {}
  using remove_cvref_t<HeadT>::operator();
};
} // namespace detail

/// Returns an opaquely-typed Callable object whose operator() overload set is
/// the sum of the operator() overload sets of each CallableT in CallableTs.
///
/// The type of the returned object derives from each CallableT in CallableTs.
/// The returned object is constructed by invoking the appropriate copy or move
/// constructor of each CallableT, as selected by overload resolution on the
/// corresponding argument to makeVisitor.
///
/// Example:
///
/// \code
/// auto visitor = makeVisitor([](auto) { return "unhandled type"; },
///                            [](int i) { return "int"; },
///                            [](std::string s) { return "str"; });
/// auto a = visitor(42);    // `a` is now "int".
/// auto b = visitor("foo"); // `b` is now "str".
/// auto c = visitor(3.14f); // `c` is now "unhandled type".
/// \endcode
///
/// Example of making a visitor with a lambda which captures a move-only type:
///
/// \code
/// std::unique_ptr<FooHandler> FH = /* ... */;
/// auto visitor = makeVisitor(
///     [FH{std::move(FH)}](Foo F) { return FH->handle(F); },
///     [](int i) { return i; },
///     [](std::string s) { return atoi(s); });
/// \endcode
template <typename... CallableTs>
constexpr decltype(auto) makeVisitor(CallableTs &&...Callables) {
  return detail::Visitor<CallableTs...>(std::forward<CallableTs>(Callables)...);
}
```

:::

## 前提知識

- **ラムダ式**: その場で作る無名関数です。中身は「`operator()` を 1 つ持つ名前のないクラス」です。
- **多重継承**: 1 つのクラスが複数のクラスを親にできます。ラムダもクラスなので、親にできます。
- **`using Base::operator();`**: 親クラスの関数を、自分のスコープに取り込みます。複数の親に同名の関数があると曖昧になるので、こうして全部を「同じ名前のオーバーロード」として並べます。
- **オーバーロード解決**: 同じ名前の関数が複数あるとき、引数の型に最もよく合うものをコンパイラが選ぶ仕組みです。`int` には `(int i)` 版が、`auto` 版より優先されます。
- **可変長テンプレートの再帰**: `Visitor<HeadT, TailTs...>` は、先頭 1 つと残りに分けて定義し、残りは再帰的に同じ形で処理します。
- **`std::forward`**: 受け取った引数を、コピーかムーブかの性質を保ったまま渡します。
- **`remove_cvref_t<T>`**: 型から `const` や参照（`&`）を取り除きます。
- **`decltype(auto)`**: 戻り値の型を、`return` の式からそのまま推論します。

## 何をしているか

### 1. 再帰的に継承する

```cpp:line-numbers=1490
template <typename HeadT, typename... TailTs>
struct Visitor<HeadT, TailTs...> : remove_cvref_t<HeadT>, Visitor<TailTs...> {
  explicit constexpr Visitor(HeadT &&Head, TailTs &&...Tail)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)),
        Visitor<TailTs...>(std::forward<TailTs>(Tail)...) {}
  using remove_cvref_t<HeadT>::operator();
  using Visitor<TailTs...>::operator();
};
```

`Visitor<A, B, C>` は、`A` と `Visitor<B, C>` の両方を継承します。`Visitor<B, C>` は `B` と `Visitor<C>` を継承し…と続きます。
結果として、**A, B, C すべてを親に持つクラス** になります。

### 2. 各親の operator() を取り込む

```cpp:line-numbers=1495
  using remove_cvref_t<HeadT>::operator();
  using Visitor<TailTs...>::operator();
```

`using remove_cvref_t<HeadT>::operator();` で先頭のラムダの呼び出しを、`using Visitor<TailTs...>::operator();` で残り全部の呼び出しを取り込みます。
再帰の各段で 2 つずつ取り込むので、最終的にすべての `operator()` が 1 つのオーバーロード集合になります。

### 3. 最後の 1 つ

```cpp:line-numbers=1499
template <typename HeadT> struct Visitor<HeadT> : remove_cvref_t<HeadT> {
  explicit constexpr Visitor(HeadT &&Head)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)) {}
  using remove_cvref_t<HeadT>::operator();
};
```

ラムダが 1 つだけになったら、それを継承して取り込むだけです。再帰の終わりです。

### 4. 親をラムダで初期化

```cpp:line-numbers=1492
  explicit constexpr Visitor(HeadT &&Head, TailTs &&...Tail)
      : remove_cvref_t<HeadT>(std::forward<HeadT>(Head)),
        Visitor<TailTs...>(std::forward<TailTs>(Tail)...) {}
```

コンストラクタは、受け取ったラムダで親クラスを初期化します。`std::forward` を使うので、ムーブしかできないものを捕まえたラムダも渡せます。

### 5. 入口の関数

```cpp:line-numbers=1534
template <typename... CallableTs>
constexpr decltype(auto) makeVisitor(CallableTs &&...Callables) {
  return detail::Visitor<CallableTs...>(std::forward<CallableTs>(Callables)...);
}
```

`makeVisitor(...)` は、受け取ったラムダの型から `Visitor<...>` を作って返すだけです。利用者が型を書かなくて済みます。

## ここがすごい

- **言語機能だけで「パターンマッチ」**: 新しい仕組みを作らず、継承・`using`・オーバーロード解決という既存の C++ 機能の組み合わせだけで、型による分岐を実現しています。
- **選び方はコンパイラ任せ**: どのラムダを呼ぶかは、普通の関数呼び出しと同じ規則で決まります。`auto` 版を「その他すべて」の受け皿にできるのも、より具体的な型が優先される規則のおかげです。
- **実行時のコストがない**: 選択はコンパイル時に終わり、呼び出しは普通の関数呼び出しになります。
- **ドキュメントの例が具体的**: `makeVisitor` の前のコメントで、戻り値の例やムーブ専用の値を捕まえる例まで示しています。

## まとめ

- ラムダはクラスなので、継承して組み合わせられる。
- 複数の親の同名関数は `using` で取り込むと、1 つのオーバーロード集合になる。
- 可変長テンプレートは「先頭 + 残り」の再帰で、任意個に対応できる。
- 型による分岐は、オーバーロード解決に任せるとコンパイル時に決まる。

