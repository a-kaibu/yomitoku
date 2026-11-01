---
title: ツールチェーンのバグを避けるため、CAS の成功時オーダーを自動で強める
description: compare_exchange の成功時と失敗時のメモリオーダーの組み合わせを、古い libstdc++ や sanitizer が誤判定する問題を、コンパイル時の条件で回避する関数。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/AtomicUtil-inl.h
lines: [63, 115]
function: detail::atomic_compare_exchange_succ
difficulty: 3
tags: [並行処理, 移植性, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`atomic_compare_exchange_succ` は、CAS（後述）に渡す **成功時のメモリオーダー** を、必要なときだけ **失敗時のオーダー以上に強める** 関数です。
C++17 では成功時と失敗時を独立に指定できますが、一部のライブラリやツールは古い C++14 のルールで検査してしまいます。
そうした環境でだけ値を調整し、正しいコードが誤って弾かれないようにしています。

## コード

::: code-group

```cpp:line-numbers=63 [日本語訳]
constexpr std::memory_order atomic_compare_exchange_succ(
    bool cond, std::memory_order succ, std::memory_order fail) {
  constexpr auto const relaxed = std::memory_order_relaxed;
  constexpr auto const release = std::memory_order_release;
  constexpr auto const acq_rel = std::memory_order_acq_rel;

  assert(fail != release);
  assert(fail != acq_rel);

  auto const bump = succ == release ? acq_rel : succ;
  auto const high = fail < bump ? bump : fail;
  return !cond || fail == relaxed ? succ : high;
}

//  atomic_compare_exchange_succ（成功時オーダーの調整）
//
//  条件しだいで失敗時オーダーを混ぜ込んだ、成功時オーダーを返す。
//
//  C++17 より前は、atomic な compare-exchange 操作は成功時オーダーが
//  失敗時オーダー以上の強さであることを要求していた。C++17 でこの要件はなくなった。
//  その帰結として、この規則が有効なら、実装は明示された失敗時オーダーを無視し
//  成功時オーダーから推測してもよいことになる。
//
//    https://en.cppreference.com/w/cpp/atomic/atomic/compare_exchange （参考）
//
//  アサーションを有効にした libstdc++ は、C++17 でもこの規則を強制する。
//  ただしそれは libstdc++12 より前までで、12 以降は強制しない。
//
//    https://github.com/gcc-mirror/gcc/commit/dba1ab212292839572fda60df00965e094a11252 （参考）
//
//  Clang の TSAN は渡された失敗時オーダーを無視し、atomic な compare-exchange 操作では
//  失敗時オーダーを成功時オーダーから推測する。これは
//  成功時 release / 失敗時 acquire のような場合に壊れる。
//
//    https://github.com/google/sanitizers/issues/970 （参考）
//
//  GCC のすべての sanitizer は、compare-exchange 操作に渡されたメモリオーダーの
//  正しさを静的に検査し、違反を警告 invalid-memory-model として報告する。
//  しかし現行版（gcc-13）まで、使っているのは C++14 の規則であり、
//  成功時 relaxed / 失敗時 acquire のような場合に壊れる。
//
//    https://godbolt.org/z/3hjjdGzMv （参考）
//
//  これらすべての場合に対処する。
constexpr std::memory_order atomic_compare_exchange_succ(
    std::memory_order succ, std::memory_order fail) {
  constexpr auto const cond = false //
      || (kGlibcxxVer && kGlibcxxVer < 12 && kGlibcxxAssertions) //
      || (kIsSanitizeThread && kIsClang) //
      || (kIsSanitize && !kIsClang && kGnuc) //
      ;
  return atomic_compare_exchange_succ(cond, succ, fail);
}
```

```cpp:line-numbers=63 [原文]
constexpr std::memory_order atomic_compare_exchange_succ(
    bool cond, std::memory_order succ, std::memory_order fail) {
  constexpr auto const relaxed = std::memory_order_relaxed;
  constexpr auto const release = std::memory_order_release;
  constexpr auto const acq_rel = std::memory_order_acq_rel;

  assert(fail != release);
  assert(fail != acq_rel);

  auto const bump = succ == release ? acq_rel : succ;
  auto const high = fail < bump ? bump : fail;
  return !cond || fail == relaxed ? succ : high;
}

//  atomic_compare_exchange_succ
//
//  Return a success order with, conditionally, the failure order mixed in.
//
//  Until C++17, atomic compare-exchange operations require the success order to
//  be at least as strong as the failure order. C++17 drops this requirement. As
//  an implication, were this rule in force, an implementation is free to ignore
//  the explicit failure order and to infer one from the success order.
//
//    https://en.cppreference.com/w/cpp/atomic/atomic/compare_exchange
//
//  The libstdc++ library with assertions enabled enforces this rule, including
//  under C++17, but only until and not since libstdc++12.
//
//    https://github.com/gcc-mirror/gcc/commit/dba1ab212292839572fda60df00965e094a11252
//
//  Clang TSAN ignores the passed failure order and infers failure order from
//  success order in atomic compare-exchange operations, which is broken for
//  cases like success-release/failure-acquire.
//
//    https://github.com/google/sanitizers/issues/970
//
//  All GCC sanitizers statically check the memory-orders passed to compare-
//  exchange operations for correctness and report violations with the warning
//  invalid-memory-model; but, up to the current version (gcc-13), they use the
//  C++14 rule, which is broken for cases like success-relaxed/failure-acquire.
//
//    https://godbolt.org/z/3hjjdGzMv
//
//  Handle all of these cases.
constexpr std::memory_order atomic_compare_exchange_succ(
    std::memory_order succ, std::memory_order fail) {
  constexpr auto const cond = false //
      || (kGlibcxxVer && kGlibcxxVer < 12 && kGlibcxxAssertions) //
      || (kIsSanitizeThread && kIsClang) //
      || (kIsSanitize && !kIsClang && kGnuc) //
      ;
  return atomic_compare_exchange_succ(cond, succ, fail);
}
```

:::

## 前提知識

- **CAS（compare-and-swap、`compare_exchange`）**: 「変数が期待値と同じなら新しい値に書き換え、違えば今の値を教える」を不可分に行う操作です。成功したときと失敗したときで、別々のメモリオーダーを指定できます。
- **メモリオーダー**: atomic 操作の前後で、他の読み書きをどこまで並べ替えてよいかの約束です。`relaxed`（約束なし）、`acquire`（読み込み側の順序）、`release`（書き込み側の順序）、`acq_rel`（両方）、`seq_cst`（最強）があります。`std::memory_order` は列挙型で、標準ライブラリの実装では弱い順に小さい値が割り当てられています。このコードは `<` による大小比較で強さを比べています。
- **失敗時オーダーの制約**: CAS の失敗は「読んだだけ」なので、失敗時に `release` や `acq_rel` は指定できません。最初の `assert` 2 つはそれを確認しています。
- **`constexpr`**: コンパイル時に計算できる関数・値です。
- **`kGlibcxxVer` や `kIsSanitizeThread`**: Folly が用意する定数で、使っている標準ライブラリのバージョンや、ThreadSanitizer（TSAN、データ競合を検出するツール）などを有効にしているかを表します。
- **`false || ... || ...`**: 先頭の `false` と行末の `//` は、条件を 1 行ずつ足し引きしやすくし、整形ツールに行をまとめさせないための書き方です。

## 何をしているか

### 1. 調整が必要な環境か判定する

```cpp:line-numbers=107
constexpr std::memory_order atomic_compare_exchange_succ(
    std::memory_order succ, std::memory_order fail) {
  constexpr auto const cond = false //
      || (kGlibcxxVer && kGlibcxxVer < 12 && kGlibcxxAssertions) //
      || (kIsSanitizeThread && kIsClang) //
      || (kIsSanitize && !kIsClang && kGnuc) //
      ;
  return atomic_compare_exchange_succ(cond, succ, fail);
}
```

`cond` は次のどれかに当てはまると真になります。

- libstdc++ 12 より古く、かつアサーションが有効
- Clang で TSAN を使っている
- GCC で何らかの sanitizer を使っている

理由は直前の長いコメントに、リンク付きで書かれています。

### 2. 成功時オーダーを強める

```cpp:line-numbers=72
  auto const bump = succ == release ? acq_rel : succ;
  auto const high = fail < bump ? bump : fail;
  return !cond || fail == relaxed ? succ : high;
```

成功時が `release` なら `acq_rel` に上げた値を `bump` とします。
次に、`bump` と失敗時の強いほうを `high` とします。
最後に、`cond` が偽か失敗時が `relaxed` なら元の `succ` を、そうでなければ `high` を返します。

具体例を 2 つ追います（`cond` は真とします）。

- `succ = relaxed`、`fail = acquire`: `bump = relaxed`、`high = acquire`。返り値は `acquire` です。
- `succ = release`、`fail = acquire`: `bump = acq_rel`、`high = acq_rel`。返り値は `acq_rel` です。単に `acquire` へ上げると、元の `release` の意味が消えてしまうので、両方を含む `acq_rel` にしています。

### 3. 利用側

```cpp:line-numbers=119
template <template <typename> class Atom, typename T>
bool atomic_compare_exchange_weak_explicit(
    Atom<T>* obj,
    type_t<T>* expected,
    type_t<T> desired,
    std::memory_order succ,
    std::memory_order fail) {
  succ = detail::atomic_compare_exchange_succ(succ, fail);
  return obj->compare_exchange_weak(*expected, desired, succ, fail);
}
```

`atomic_compare_exchange_weak_explicit` などのラッパーは、CAS を呼ぶ直前にこの関数を通すだけです。

## ここがすごい

- **正しいコードを、間違った検査から守る**: たとえば Baton の待機処理では「成功時 relaxed、失敗時 acquire」という組み合わせを意図的に使っています。C++17 では正しいのですが、古い libstdc++ のアサーションや GCC の sanitizer は C++14 のルールで「成功時が失敗時より弱い」と判定します。Clang の TSAN は、渡した失敗時のオーダーを無視して成功時のオーダーから推測してしまいます。
- **必要な環境でだけ強める**: 強める方向の変更は常に安全ですが、無条件に強めると速度が落ちる可能性があります。`cond` で問題のある環境に限定し、普通のビルドでは何も変えません。
- **意味を壊さない強め方**: `release` を含む指定を `acq_rel` に上げるなど、元の成分を残したまま強めています。
- **根拠をリンクで残す**: GCC のコミット、sanitizer の issue、Compiler Explorer の再現例への URL がコメントにあります。いつ削除してよいかを後から判断できます。

## まとめ

- CAS の成功時と失敗時のオーダーは C++17 で独立になったが、ツールが追いついていないことがある。
- 回避策は「問題のある環境でだけ」「意味を保ったまま強める」のが安全。
- 環境の判定をコンパイル時定数にすると、通常ビルドでは一切コストがかからない。
- 回避コードには、原因となったバグへのリンクを残しておくとよい。

