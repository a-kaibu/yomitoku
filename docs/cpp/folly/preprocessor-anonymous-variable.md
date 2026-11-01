---
title: マクロの中で「かぶらない変数名」を作る、2 段階の連結
description: SCOPE_EXIT などのマクロが内部で使う一意な変数名を作る FB_ANONYMOUS_VARIABLE。__COUNTER__ や __LINE__ を名前にくっつけるが、そのためには連結マクロを 2 段に分ける必要がある。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/Preprocessor.h
lines: [86, 111]
function: FB_ANONYMOUS_VARIABLE
difficulty: 2
format: 2
tags: [マクロ, イディオム, 移植性]
---

## ひとことで

`FB_ANONYMOUS_VARIABLE(guard)` は、`guard17` や `guard3_42` のような **ほかとかぶらない名前** に展開されるマクロです。

`SCOPE_EXIT { ... };` のように、マクロが利用者の見えないところで変数を宣言したいとき、同じスコープで 2 回使っても名前が衝突しないようにするために使います。

## コード

::: code-group

```cpp:line-numbers=86 [日本語訳]
/**
 * FB_ANONYMOUS_VARIABLE(str) は、str で始まり、行によって変わる
 * 数で終わる識別子を作る。
 */
#ifndef FB_ANONYMOUS_VARIABLE
#define FB_CONCATENATE_IMPL(s1, s2) s1##s2
#define FB_CONCATENATE(s1, s2) FB_CONCATENATE_IMPL(s1, s2)
#ifdef __COUNTER__
// モジュールビルドではモジュールごとに別のプリプロセッサ状態でビルドするので、
// `__COUNTER__` は TU 全体で一意な数にならない。`__LINE__` だけに戻すのではなく、
// `__COUNTER__` と `__LINE__` を組み合わせて使い、
// できるだけ一意になるようにする。
#if FOLLY_HAS_FEATURE(modules)
#define FB_ANONYMOUS_VARIABLE(str) \
  FB_CONCATENATE(FB_CONCATENATE(FB_CONCATENATE(str, __COUNTER__), _), __LINE__)
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __COUNTER__)
#endif
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __LINE__)
#endif
// FB_ANONYMOUS_VARIABLE_ODR_SAFE は __COUNTER__ に頼らないので、
// 単一定義規則（ODR）に違反してはならないヘッダの中で使っても安全。
// ODR 違反を検査する C++ モジュールで特に役立つ。
#define FB_ANONYMOUS_VARIABLE_ODR_SAFE(str) FB_CONCATENATE(str, __LINE__)
#endif
```

```cpp:line-numbers=86 [原文]
/**
 * FB_ANONYMOUS_VARIABLE(str) introduces an identifier starting with
 * str and ending with a number that varies with the line.
 */
#ifndef FB_ANONYMOUS_VARIABLE
#define FB_CONCATENATE_IMPL(s1, s2) s1##s2
#define FB_CONCATENATE(s1, s2) FB_CONCATENATE_IMPL(s1, s2)
#ifdef __COUNTER__
// Modular builds build each module with its own preprocessor state, meaning
// `__COUNTER__` no longer provides a unique number across a TU.  Instead of
// calling back to just `__LINE__`, use a mix of `__COUNTER__` and `__LINE__`
// to try provide as much uniqueness as possible.
#if FOLLY_HAS_FEATURE(modules)
#define FB_ANONYMOUS_VARIABLE(str) \
  FB_CONCATENATE(FB_CONCATENATE(FB_CONCATENATE(str, __COUNTER__), _), __LINE__)
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __COUNTER__)
#endif
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __LINE__)
#endif
// FB_ANONYMOUS_VARIABLE_ODR_SAFE doesn't rely on __COUNTER__ and is safe to use
// in headers that should not violate the one-definition rule (ODR). It is
// especially useful for C++ modules that check for ODR violations.
#define FB_ANONYMOUS_VARIABLE_ODR_SAFE(str) FB_CONCATENATE(str, __LINE__)
#endif
```

:::

## 前提知識

- **プリプロセッサ**: コンパイル前に `#define` で定義されたマクロを文字列として置き換える仕組みです。
- **`##`（トークン連結）**: マクロの中で `s1##s2` と書くと、2 つを 1 つの名前にくっつけます。`FB_CONCATENATE_IMPL(foo, bar)` は `foobar` です。
- **`__LINE__`**: その行の行番号に置き換わる、あらかじめ定義されたマクロです。
- **`__COUNTER__`**: 使うたびに `0, 1, 2, …` と 1 ずつ増える数に置き換わるマクロです。標準ではありませんが、GCC・Clang・MSVC が対応しています。
- **`#ifdef` / `#if` / `#ifndef`**: 条件によってコードを有効・無効にするプリプロセッサの命令です。`#ifndef X` は「`X` が未定義なら」です。
- **ODR（One Definition Rule）**: 同じもの（インライン関数など）の定義は、プログラム全体で一致していなければならない、という C++ の規則です。

## 何をしているか

### 1. 連結マクロを 2 段にする

```cpp:line-numbers=91
#define FB_CONCATENATE_IMPL(s1, s2) s1##s2
#define FB_CONCATENATE(s1, s2) FB_CONCATENATE_IMPL(s1, s2)
```

ここがいちばん大事な部分です。もし `FB_CONCATENATE` を 1 段で、

```cpp
#define BAD_CONCAT(s1, s2) s1##s2
BAD_CONCAT(guard, __LINE__)
```

と書くと、結果は `guard__LINE__` になってしまいます。`##` の両側の引数は **展開される前に** くっつけられるからです。

そこで 1 段かませます。

- `FB_CONCATENATE(guard, __LINE__)` が呼ばれると、まず引数が展開されて `__LINE__` が `42` になる
- 次に `FB_CONCATENATE_IMPL(guard, 42)` が呼ばれ、`##` で `guard42` ができる

「`##` を使わない外側のマクロ」で引数を展開させてから、「`##` を使う内側のマクロ」に渡す、というのが定番の手法です。

### 2. 使える材料によって作り方を変える

```cpp:line-numbers=93
#ifdef __COUNTER__
// Modular builds build each module with its own preprocessor state, meaning
// `__COUNTER__` no longer provides a unique number across a TU.  Instead of
// calling back to just `__LINE__`, use a mix of `__COUNTER__` and `__LINE__`
// to try provide as much uniqueness as possible.
#if FOLLY_HAS_FEATURE(modules)
#define FB_ANONYMOUS_VARIABLE(str) \
  FB_CONCATENATE(FB_CONCATENATE(FB_CONCATENATE(str, __COUNTER__), _), __LINE__)
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __COUNTER__)
#endif
#else
#define FB_ANONYMOUS_VARIABLE(str) FB_CONCATENATE(str, __LINE__)
#endif
```

- **`__COUNTER__` がある場合**: `guard0`、`guard1`… と使うたびに違う番号になります。同じ行に 2 回書いても衝突しません。
- **モジュールビルドの場合**: C++ モジュールではモジュールごとに `__COUNTER__` が 0 から数え直されるため、それだけでは一意になりません。そこで `guard3_42` のように、カウンタと行番号の両方をつなげます。
- **`__COUNTER__` がない場合**: 行番号だけを使います。

### 3. ヘッダ用の ODR 安全版

```cpp:line-numbers=107
// FB_ANONYMOUS_VARIABLE_ODR_SAFE doesn't rely on __COUNTER__ and is safe to use
// in headers that should not violate the one-definition rule (ODR). It is
// especially useful for C++ modules that check for ODR violations.
#define FB_ANONYMOUS_VARIABLE_ODR_SAFE(str) FB_CONCATENATE(str, __LINE__)
```

`FB_ANONYMOUS_VARIABLE_ODR_SAFE` は、常に行番号だけを使います。

`__COUNTER__` の値は、そのファイルより前に何回使われたかで変わります。ヘッダの中のインライン関数で `__COUNTER__` を使うと、インクルードするファイルごとに **関数の中身（変数名）が違って** しまい、ODR に違反するおそれがあります。行番号ならどこからインクルードしても同じなので安全です。`SCOPE_EXIT` はこちらを使っています。

### 4. 二重定義を防ぐ

```cpp:line-numbers=90
#ifndef FB_ANONYMOUS_VARIABLE
```

全体が `#ifndef FB_ANONYMOUS_VARIABLE` で囲まれているので、利用者や別のライブラリが先に定義していれば、そちらが優先されます。

## ここがすごい

- **2 段連結は知らないとハマる**: `guard__LINE__` になってしまう問題は、C/C++ のマクロを書く人の多くが一度は経験します。`FB_CONCATENATE` という汎用部品にしておけば、ほかのマクロでも安心して使えます。
- **一意性の強さを状況で選ぶ**: `__COUNTER__` があれば最も衝突しにくい方法を、なければ次善の方法を使います。さらに、ヘッダで使う場合の ODR まで考えて、別の版を用意しています。
- **コメントが「なぜ」を説明している**: モジュールビルドで何が困るのか、ODR 安全版がなぜ必要なのかが、コードのすぐ上に書かれています。プリプロセッサのコードは読みにくいので、こうした説明が特に役立ちます。

## まとめ

- `##` は引数を展開する前に連結するので、`__LINE__` などをくっつけるには 2 段のマクロが必要。
- `__COUNTER__` は使うたびに増える番号、`__LINE__` は行番号。一意な名前の材料になる。
- ヘッダの中では、インクルード先によって値が変わる `__COUNTER__` に注意する。
- `#ifndef` で囲んでおくと、利用者が独自の定義で置き換えられる。
