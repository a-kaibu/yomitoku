---
title: 「SCOPE_EXIT { ... };」という構文を、マクロと演算子 + で作る
description: スコープを抜けるときに書いた処理を実行させる SCOPE_EXIT マクロ。匿名の変数名と、空の enum とラムダを + でつなぐ演算子オーバーロードで、まるで言語の構文のような見た目を実現している。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/ScopeGuard.h
lines: [363, 375]
function: SCOPE_EXIT
difficulty: 2
format: 2
tags: [マクロ, イディオム, 設計パターン]
---

## ひとことで

`SCOPE_EXIT` を使うと、次のように書けます。

```cpp
FILE* f = fopen("a.txt", "r");
SCOPE_EXIT { fclose(f); };
// ... ここで return しても例外が起きても、最後に fclose(f) が呼ばれる
```

Go の `defer` に似た機能です。`SCOPE_EXIT { ... };` は新しい構文に見えますが、実際は **マクロ・ラムダ式・演算子オーバーロード** の組み合わせで作られています。

## コード

::: code-group

```cpp:line-numbers=363 [日本語訳]
/**
 * 現在のスコープを抜けるときに実行するコードを捕まえる。
 *
 * SCOPE_EXIT の波かっこ内のコードは、SCOPE_EXIT の位置で作られた
 * オブジェクトのデストラクタの中に書いたかのように実行される。
 *
 * SCOPE_EXIT の中で使う変数は参照でキャプチャされる。
 *
 * @def SCOPE_EXIT
 */
#define SCOPE_EXIT                                        \
  auto FB_ANONYMOUS_VARIABLE_ODR_SAFE(SCOPE_EXIT_STATE) = \
      ::folly::detail::ScopeGuardOnExit() + [&]() noexcept
```

```cpp:line-numbers=363 [原文]
/**
 * Capture code that shall be run when the current scope exits.
 *
 * The code within SCOPE_EXIT's braces shall execute as if the code was in the
 * destructor of an object instantiated at the point of SCOPE_EXIT.
 *
 * Variables used within SCOPE_EXIT are captured by reference.
 *
 * @def SCOPE_EXIT
 */
#define SCOPE_EXIT                                        \
  auto FB_ANONYMOUS_VARIABLE_ODR_SAFE(SCOPE_EXIT_STATE) = \
      ::folly::detail::ScopeGuardOnExit() + [&]() noexcept
```

:::

マクロが使っている `operator+` は、同じファイルの少し上にあります。

```cpp:line-numbers=314
enum class ScopeGuardOnExit {};

template <typename FunctionType>
FOLLY_CXX20_CONSTEXPR ScopeGuardImpl<std::decay_t<FunctionType>, true>
operator+(detail::ScopeGuardOnExit, FunctionType&& fn) {
  return ScopeGuardImpl<std::decay_t<FunctionType>, true>(
      std::forward<FunctionType>(fn));
}
```

## 前提知識

- **マクロ `#define`**: コンパイル前に、名前を別の文字列に置き換える仕組みです。行末の `\` は「次の行に続く」という意味です。
- **ラムダ式 `[&]() noexcept { ... }`**: その場で作る無名関数です。`[&]` は「外側の変数を参照で使える」、`noexcept` は「例外を投げない」という意味です。
- **`auto 変数 = ...;`**: 右辺の型をコンパイラに推論させて変数を作ります。
- **演算子オーバーロード**: `operator+` という名前の関数を定義すると、自分で作った型同士の `a + b` の意味を決められます。
- **`enum class X {};`**: 値を 1 つも持たない列挙型です。ここでは「目印」専用の型として使われています。`X()` でその型の値が作れます。
- **デストラクタ**: オブジェクトがスコープを抜けるときに必ず呼ばれる関数です。例外で抜ける場合も呼ばれます。
- **`FB_ANONYMOUS_VARIABLE_ODR_SAFE(name)`**: Folly のマクロで、`name` に行番号をくっつけた一意な変数名（例: `SCOPE_EXIT_STATE42`）を作ります。

## 何をしているか

### 1. マクロの展開

```cpp:line-numbers=373
#define SCOPE_EXIT                                        \
  auto FB_ANONYMOUS_VARIABLE_ODR_SAFE(SCOPE_EXIT_STATE) = \
      ::folly::detail::ScopeGuardOnExit() + [&]() noexcept
```

ソースファイルの 42 番目の行に `SCOPE_EXIT { fclose(f); };` と書いたとします。マクロが展開されると、次のようになります。

```cpp
auto SCOPE_EXIT_STATE42 =
    ::folly::detail::ScopeGuardOnExit() + [&]() noexcept { fclose(f); };
```

ポイントは、マクロが **ラムダの `{` の直前で終わっている** ことです。利用者が書いた `{ fclose(f); }` がそのままラムダの本体になり、最後の `;` が変数宣言の終わりになります。

### 2. `+` でガードオブジェクトに変える

`ScopeGuardOnExit()` は目印の型の値、右辺はラムダです。この組み合わせの `+` は、上の補足コードの `operator+` が受け持ちます。
`operator+` はラムダを受け取って `ScopeGuardImpl`（スコープを抜けるときに関数を呼ぶオブジェクト）を作って返します。それが `SCOPE_EXIT_STATE42` という変数に入ります。

### 3. スコープの終わりで実行

`SCOPE_EXIT_STATE42` はローカル変数なので、スコープを抜けるときにデストラクタが呼ばれ、そこでラムダ（`fclose(f)`）が実行されます。`return` でも例外でも同じです。

複数の `SCOPE_EXIT` を書くと、C++ のローカル変数の規則どおり、**後に書いたものから先に** 実行されます。

## ここがすごい

- **構文のような見た目**: 素直に書くと `auto guard = folly::makeGuard([&] { fclose(f); });` です。変数名を考える必要があり、行も長くなります。`SCOPE_EXIT` は変数名を自動で作り、ラムダの書き出しも隠しています。
- **`+` を使う理由**: マクロは「ここから先に利用者が `{ ... }` を書く」形にしたいので、ラムダを関数の引数として括弧で囲むことができません（閉じ括弧を書く場所がない）。二項演算子なら右辺に何かを続けて書くだけなので、マクロの外側で式を閉じられます。
- **目印の型でほかと衝突させない**: `operator+` の左辺を専用の `enum class` に限定しているので、普通の `a + b` に影響しません。同じ方法で `SCOPE_FAIL`（例外のときだけ実行）や `SCOPE_SUCCESS`（正常終了のときだけ実行）も、別の目印型で作られています。
- **`noexcept` で安全側に倒す**: 後始末の途中で例外が起きると、例外処理中にさらに例外が起きて事態が悪化しがちです。ラムダに `noexcept` を付けることで、そうした事態は即座にプログラム停止として表に出ます。

## まとめ

- マクロを「途中で終わる式」にすると、利用者のコードを式の続きとして取り込める。
- 二項演算子のオーバーロードは、マクロで構文風の DSL を作るときに便利。
- 目印専用の空の型を使えば、演算子オーバーロードが他のコードと衝突しない。
- RAII のデストラクタは、`return` でも例外でも必ず実行される。
