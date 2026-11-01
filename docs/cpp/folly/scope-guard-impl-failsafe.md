---
title: 後始末の関数をコピーする途中で失敗しても、後始末だけは必ず走らせる
description: ScopeGuard の本体 ScopeGuardImpl のコンストラクタ。関数オブジェクトのコピーが例外を投げうるときは、元の関数への参照を持つ「保険のガード」を先に作っておき、コピーに失敗してもクリーンアップを実行する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/ScopeGuard.h
lines: [114, 181]
function: folly::detail::ScopeGuardImpl::ScopeGuardImpl
difficulty: 3
format: 2
tags: [エラー処理, 設計パターン, メモリ管理]
---

## ひとことで

`ScopeGuardImpl` は、`folly::makeGuard(f)` が返す「スコープを抜けるときに `f` を呼ぶオブジェクト」の本体です。
受け取った関数 `f` は自分の中にコピー（またはムーブ）して保存します。ところが **そのコピー自体が例外を投げたら、後始末が実行されないまま終わってしまう** かもしれません。このコンストラクタは「保険のガード」を使って、その場合でも必ず後始末を走らせます。

## コード

::: code-group

```cpp:line-numbers=114 [日本語訳]
template <typename FunctionType, bool InvokeNoexcept>
class ScopeGuardImpl : public ScopeGuardImplBase {
 public:
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::as_const(fn),
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR
  explicit ScopeGuardImpl(const FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            fn,
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType&& fn) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::move_if_noexcept(fn),
            makeFailsafe(
                std::is_nothrow_move_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR
  explicit ScopeGuardImpl(FunctionType&& fn, ScopeGuardDismissed) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      // この場合ガードは解除済みなので、保険は要らない。
      : ScopeGuardImplBase{true}, function_(std::forward<FunctionType>(fn)) {}

  FOLLY_CXX20_CONSTEXPR ScopeGuardImpl(ScopeGuardImpl&& other) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : function_(std::move_if_noexcept(other.function_)) {
    // 上の行がコピーを試みてそのコピーが例外を投げた場合、other が
    // 後始末の処理を持ったまま残り、other.dismissed_ の値に応じて
    // それを実行する（またはしない）。以下の行が実行されるのは
    // ムーブ／コピーが成功したときだけで、そのとき *this が
    // 後始末の処理を引き継ぎ、other を解除する。
    dismissed_ = std::exchange(other.dismissed_, true);
  }

  FOLLY_CXX20_CONSTEXPR ~ScopeGuardImpl() noexcept(InvokeNoexcept) {
    if (!dismissed_) {
      execute();
    }
  }

 private:
  FOLLY_CXX20_CONSTEXPR
  static ScopeGuardImplBase makeFailsafe(std::true_type, const void*) noexcept {
    return makeEmptyScopeGuard();
  }

  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR static auto makeFailsafe(
      std::false_type, Fn* fn) noexcept
      -> ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept> {
    return ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept>{
        std::ref(*fn)};
  }

  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(
      Fn&& fn, ScopeGuardImplBase&& failsafe)
      : ScopeGuardImplBase{}, function_(std::forward<Fn>(fn)) {
    failsafe.dismiss();
  }
```

```cpp:line-numbers=114 [原文]
template <typename FunctionType, bool InvokeNoexcept>
class ScopeGuardImpl : public ScopeGuardImplBase {
 public:
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::as_const(fn),
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR
  explicit ScopeGuardImpl(const FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            fn,
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType&& fn) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::move_if_noexcept(fn),
            makeFailsafe(
                std::is_nothrow_move_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR
  explicit ScopeGuardImpl(FunctionType&& fn, ScopeGuardDismissed) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      // No need for failsafe in this case, as the guard is dismissed.
      : ScopeGuardImplBase{true}, function_(std::forward<FunctionType>(fn)) {}

  FOLLY_CXX20_CONSTEXPR ScopeGuardImpl(ScopeGuardImpl&& other) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : function_(std::move_if_noexcept(other.function_)) {
    // If the above line attempts a copy and the copy throws, other is
    // left owning the cleanup action and will execute it (or not) depending
    // on the value of other.dismissed_. The following lines only execute
    // if the move/copy succeeded, in which case *this assumes ownership of
    // the cleanup action and dismisses other.
    dismissed_ = std::exchange(other.dismissed_, true);
  }

  FOLLY_CXX20_CONSTEXPR ~ScopeGuardImpl() noexcept(InvokeNoexcept) {
    if (!dismissed_) {
      execute();
    }
  }

 private:
  FOLLY_CXX20_CONSTEXPR
  static ScopeGuardImplBase makeFailsafe(std::true_type, const void*) noexcept {
    return makeEmptyScopeGuard();
  }

  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR static auto makeFailsafe(
      std::false_type, Fn* fn) noexcept
      -> ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept> {
    return ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept>{
        std::ref(*fn)};
  }

  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(
      Fn&& fn, ScopeGuardImplBase&& failsafe)
      : ScopeGuardImplBase{}, function_(std::forward<Fn>(fn)) {
    failsafe.dismiss();
  }
```

:::

## 前提知識

- **RAII とデストラクタ**: C++ ではオブジェクトがスコープを抜けると、必ずデストラクタ（`~クラス名()`）が呼ばれます。例外で抜ける場合も同じです。ScopeGuard はこれを利用して「抜けるときに関数を呼ぶ」を実現しています。
- **参照 `&` と右辺値参照 `&&`**: `FunctionType& fn` は名前の付いた変数への参照、`FunctionType&& fn` は一時オブジェクトなど「もう使われない値」への参照です。後者からは中身を盗む「ムーブ」ができます。
- **委譲コンストラクタ**: `: ScopeGuardImpl(...)` のように、コンストラクタから同じクラスの別のコンストラクタを呼べます。
- **`noexcept(条件)`**: 条件が真なら例外を投げない、と宣言します。`std::is_nothrow_copy_constructible_v<T>` は「`T` のコピーが例外を投げないか」をコンパイル時に調べます。
- **`std::true_type` / `std::false_type`**: 「真」「偽」を表す型です。値ではなく型で分岐させることで、オーバーロードでコンパイル時に関数を選べます。
- **`std::ref(x)`**: `x` への参照を、コピー可能なオブジェクトとして包みます。これを呼ぶと元の `x` が呼ばれます。参照のコピーは例外を投げません。
- **`std::move_if_noexcept(x)`**: ムーブが例外を投げないならムーブ、投げうるならコピーをします。
- **`FOLLY_CXX20_CONSTEXPR`**: C++20 以降なら `constexpr` を付けるマクロです。

## 何をしているか

### 1. 3 つの入口

```cpp:line-numbers=117
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::as_const(fn),
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR
  explicit ScopeGuardImpl(const FunctionType& fn) noexcept(
      std::is_nothrow_copy_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            fn,
            makeFailsafe(
                std::is_nothrow_copy_constructible<FunctionType>{}, &fn)) {}

  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(FunctionType&& fn) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : ScopeGuardImpl(
            std::move_if_noexcept(fn),
            makeFailsafe(
                std::is_nothrow_move_constructible<FunctionType>{}, &fn)) {}
```

関数の受け取り方（変更可能な参照・`const` 参照・右辺値）ごとにコンストラクタがあります。どれも同じ形で、

1. `makeFailsafe(...)` で保険のガードを作り
2. それを持って、`Fn&& fn, ScopeGuardImplBase&& failsafe` を受け取る **本当のコンストラクタ** に委譲します。

### 2. 保険のガードを作る

```cpp:line-numbers=163
  FOLLY_CXX20_CONSTEXPR
  static ScopeGuardImplBase makeFailsafe(std::true_type, const void*) noexcept {
    return makeEmptyScopeGuard();
  }

  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR static auto makeFailsafe(
      std::false_type, Fn* fn) noexcept
      -> ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept> {
    return ScopeGuardImpl<decltype(std::ref(*fn)), InvokeNoexcept>{
        std::ref(*fn)};
  }
```

`makeFailsafe` は、コピー（またはムーブ）が例外を投げないかどうかで 2 つに分かれます。

- **投げない（`true_type`）**: 保険は不要なので、空のガードを返します。
- **投げうる（`false_type`）**: 元の関数 `fn` への `std::ref` を持つガードを作ります。参照を持つだけなので、このガードの作成は例外を投げません。

### 3. 本体を作り、成功したら保険を解除

```cpp:line-numbers=176
  template <typename Fn>
  FOLLY_CXX20_CONSTEXPR explicit ScopeGuardImpl(
      Fn&& fn, ScopeGuardImplBase&& failsafe)
      : ScopeGuardImplBase{}, function_(std::forward<Fn>(fn)) {
    failsafe.dismiss();
  }
```

`function_(std::forward<Fn>(fn))` で関数を自分の中にコピーします。

- **コピーに成功した場合**: `failsafe.dismiss()` を呼び、保険を無効にします。以後はこの `ScopeGuardImpl` が後始末の責任を持ちます。
- **コピーが例外を投げた場合**: 本体の構築は失敗し、`failsafe.dismiss()` は実行されません。一時オブジェクトだった保険のガードは、例外が伝わる途中で破棄され、**デストラクタで元の `fn` を呼び出します**。後始末は実行されたうえで、例外が呼び出し元に伝わります。

### 4. ムーブコンストラクタも同じ考え方

```cpp:line-numbers=145
  FOLLY_CXX20_CONSTEXPR ScopeGuardImpl(ScopeGuardImpl&& other) noexcept(
      std::is_nothrow_move_constructible_v<FunctionType>)
      : function_(std::move_if_noexcept(other.function_)) {
    // If the above line attempts a copy and the copy throws, other is
    // left owning the cleanup action and will execute it (or not) depending
    // on the value of other.dismissed_. The following lines only execute
    // if the move/copy succeeded, in which case *this assumes ownership of
    // the cleanup action and dismisses other.
    dismissed_ = std::exchange(other.dismissed_, true);
  }
```

ガード自体をムーブするときも、`function_` の移動が成功してから `other.dismissed_` を `true` にします。コメントのとおり、途中で失敗しても、元のガード `other` が責任を持ち続けます。

## ここがすごい

- **「後始末が消える」穴をふさぐ**: ScopeGuard の目的は「何があっても後始末する」ことです。しかし素直に `function_(fn)` と書くだけだと、そのコピーで例外が起きた瞬間、後始末を担うオブジェクトがどこにも存在しなくなります。ロックの解放やファイルのクローズが漏れる、という最悪の結果です。
- **コストは必要なときだけ**: コピーが `noexcept` な普通のラムダなら、空のガードが選ばれ、最適化でほぼ消えます。保険の仕組みは、例外を投げうる型のときだけ働きます。
- **型で分岐する**: `true_type` / `false_type` を引数にしたオーバーロードは、C++17 の `if constexpr` 以前からある「タグディスパッチ」という手法です。
- **責任の移動を 1 行で**: 保険の解除（`dismiss`）や `std::exchange(other.dismissed_, true)` は、「成功が確定してから責任を引き継ぐ」という順番を守っています。

## まとめ

- RAII のオブジェクトは「構築に失敗したとき」の後始末まで考える必要がある。
- 失敗しうる処理の前に、例外を投げない「保険」を用意しておく手がある。
- 成功が確定してから責任を引き継ぐ（保険を解除する）、という順番が大事。
- `true_type` / `false_type` によるオーバーロードで、コンパイル時に処理を切り替えられる。
