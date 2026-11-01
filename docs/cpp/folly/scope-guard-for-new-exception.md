---
title: 「新しい例外が起きたときだけ」後始末する、例外の数の数え方
description: SCOPE_FAIL と SCOPE_SUCCESS の本体 ScopeGuardForNewException。作られた時点の未捕捉例外の数を覚えておき、破棄される時点の数と比べて、このスコープで例外が起きたかどうかを判定する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/ScopeGuard.h
lines: [263, 285]
function: folly::detail::ScopeGuardForNewException
difficulty: 3
format: 2
tags: [エラー処理, 設計パターン, イディオム]
---

## ひとことで

Folly には、スコープを **例外で抜けたときだけ** 処理を実行する `SCOPE_FAIL` と、**正常に抜けたときだけ** 実行する `SCOPE_SUCCESS` があります。
たとえば「途中で失敗したらトランザクションをロールバックする」処理を `SCOPE_FAIL { rollback(); };` と書けます。

`ScopeGuardForNewException` はその本体です。「今、例外が起きているか」ではなく、**「このガードを作ったあとに、新しい例外が起きたか」** を判定するのがポイントです。

## コード

```cpp:line-numbers=263
template <typename FunctionType, bool ExecuteOnException>
class ScopeGuardForNewException {
 public:
  explicit ScopeGuardForNewException(const FunctionType& fn) : guard_(fn) {}

  explicit ScopeGuardForNewException(FunctionType&& fn)
      : guard_(std::move(fn)) {}

  ScopeGuardForNewException(ScopeGuardForNewException&& other) = default;

  ~ScopeGuardForNewException() noexcept(ExecuteOnException) {
    if (ExecuteOnException != (exceptionCounter_ < uncaught_exceptions())) {
      guard_.dismiss();
    }
  }

 private:
  void* operator new(std::size_t) = delete;
  void operator delete(void*) = delete;

  ScopeGuardImpl<FunctionType, ExecuteOnException> guard_;
  int exceptionCounter_{uncaught_exceptions()};
};
```

## 前提知識

- **デストラクタ `~クラス名()`**: オブジェクトが破棄されるときに必ず呼ばれる関数です。例外でスコープを抜けるとき（スタックの巻き戻し中）にも呼ばれます。
- **`uncaught_exceptions()`**: 「投げられたが、まだ `catch` されていない例外の数」を返します（標準の `std::uncaught_exceptions` に相当する Folly の関数）。通常は 0 で、例外が伝わっている最中は 1 以上になります。
- **テンプレート引数 `bool ExecuteOnException`**: `true` なら「例外のときに実行」（SCOPE_FAIL 用）、`false` なら「正常のときに実行」（SCOPE_SUCCESS 用）です。コンパイル時に決まります。
- **メンバ変数の初期化 `int exceptionCounter_{uncaught_exceptions()};`**: オブジェクトが作られるときに、その時点の値で初期化されます。
- **`noexcept(ExecuteOnException)`**: デストラクタが例外を投げないかどうかを、テンプレート引数で切り替えています。
- **`= delete`**: その関数を使えなくします。ここでは `operator new` と `operator delete` を消して、ヒープに置けないようにしています。
- **`guard_`**: 内部に持っている普通のスコープガード（`ScopeGuardImpl`）で、破棄されるときに関数を呼びます。`dismiss()` すると呼ばなくなります。

## 何をしているか

### 1. 作るときに例外の数を覚える

```cpp:line-numbers=284
  int exceptionCounter_{uncaught_exceptions()};
```

ガードが作られた瞬間の `uncaught_exceptions()` を `exceptionCounter_` に保存します。普通の関数の中なら `0` です。

### 2. 破棄されるときに比べる

```cpp:line-numbers=273
  ~ScopeGuardForNewException() noexcept(ExecuteOnException) {
    if (ExecuteOnException != (exceptionCounter_ < uncaught_exceptions())) {
      guard_.dismiss();
    }
  }
```

`exceptionCounter_ < uncaught_exceptions()` は「作ったときより未捕捉の例外が増えたか」、つまり **このスコープで新しい例外が起きて、今まさに抜けようとしているか** です。

SCOPE_FAIL（`ExecuteOnException = true`）の場合で追います。

- **正常に抜けた**: 数は `0 → 0` で増えていないので、比較は `false`。`true != false` は真なので `dismiss()` され、何もしません。
- **例外で抜けた**: 数は `0 → 1` に増えたので `true`。`true != true` は偽なので `dismiss()` されず、`guard_` の破棄で後始末が実行されます。

SCOPE_SUCCESS（`false`）では、比較の結果が逆の場合に実行されます。1 行の `!=` で、両方の向きをまとめて表しているわけです。

### 3. ヒープに置かせない

```cpp:line-numbers=280
  void* operator new(std::size_t) = delete;
  void operator delete(void*) = delete;
```

`new ScopeGuardForNewException(...)` のようにヒープに置くと、作った場所と破棄する場所のスコープがずれ、判定の意味がなくなります。`operator new` / `delete` を削除して、ローカル変数としてしか使えないようにしています。

## ここがすごい

### 「例外中かどうか」では足りない

C++11 までは `std::uncaught_exception()`（単数形）で「今、例外が伝わっている最中か」しか調べられませんでした。これだと次の場面で誤判定します。

```cpp
struct Cleanup {
  ~Cleanup() {
    SCOPE_FAIL { log("失敗"); };
    doSomething();  // 例外なしで終わる
  }
};
```

`Cleanup` が別の例外による巻き戻しの途中で破棄されると、デストラクタの中は「例外中」です。そのため `doSomething()` が成功しても、SCOPE_FAIL が誤って実行されてしまいます。

この実装は **数を比べる** ので、外側の例外が 1 つ伝わっていても、作成時 `1`・破棄時 `1` で「増えていない」と正しく判定できます。

### デストラクタの noexcept を切り替える

SCOPE_SUCCESS の処理は正常終了時に走るので、その中で例外を投げても呼び出し元に普通に伝えられます。そのため `ExecuteOnException = false` のときはデストラクタを `noexcept(false)` にしています。
一方 SCOPE_FAIL の処理は例外の伝搬中に走るので、ここで別の例外を投げるとプログラムが終了してしまいます。そちらは `noexcept` のままです。

## まとめ

- 「今例外中か」ではなく「作ってから例外が増えたか」を比べると、入れ子の状況でも正しく判定できる。
- 1 つの比較と `!=` で、「失敗時だけ」と「成功時だけ」の 2 種類を同じコードで作れる。
- スコープに結びついたオブジェクトは、`operator new` を削除してヒープに置けないようにする手がある。
- デストラクタの `noexcept` は、テンプレート引数で条件付きにできる。
