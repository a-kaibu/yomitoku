---
title: 引数があるかないかで展開結果を変える、プリプロセッサの「詰め替え」技
description: 2 つめの引数があれば 1 つめを残し、なければ消す FB_ONE_OR_NONE と、2 つめがあればそれを、なければ 1 つめを返す FB_ARG_2_OR_1。引数の並びをずらして目的の位置を拾うだけで、マクロに条件分岐をさせている。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/Preprocessor.h
lines: [25, 57]
function: FB_ONE_OR_NONE / FB_ARG_2_OR_1
difficulty: 3
format: 2
tags: [マクロ, メタプログラミング, 移植性]
---

## ひとことで

C/C++ のプリプロセッサ（コンパイル前に文字列を置き換える仕組み）には `if` がありません。それでも、**引数の個数によって展開結果を変える** ことはできます。

- `FB_ONE_OR_NONE(hello, world)` → `hello`、`FB_ONE_OR_NONE(hello)` → 何も出ない
- `FB_ARG_2_OR_1(1, 2)` → `2`、`FB_ARG_2_OR_1(1)` → `1`

どちらも「引数を詰め直して、決まった位置にあるものを取り出す」という同じ発想で作られています。

## コード

::: code-group

```cpp:line-numbers=25 [日本語訳]
// MSVC のプリプロセッサは厄介なので、
// ところどころで可変長引数を無理やり展開させる必要がある。
#define FB_VA_GLUE(a, b) a b

/**
 * FB_ONE_OR_NONE(hello, world) は hello に展開され、
 * FB_ONE_OR_NONE(hello) は何も残さない。このマクロは、別の引数が
 * あるかどうかでテキストを挿入したり消したりするのに使う。
 */
#define FB_ONE_OR_NONE(a, ...) FB_VA_GLUE(FB_THIRD, (a, ##__VA_ARGS__, a))
#define FB_THIRD(a, b, ...) __VA_ARGS__

/**
 * 任意個の引数の並びから、最初の引数を取り出す
 * 補助マクロ。
 */
#define FB_ARG_1(a, ...) a

/**
 * 任意個の引数の並びから、2 番目の引数を取り出す
 * 補助マクロ。引数が 1 つしかなければ、
 * それを返す。
 */
#ifdef _MSC_VER
// このマクロ自体を FB_VA_GLUE で呼ぶと、GCC は
// 正しく展開してくれない :(
#define FB_ARG_2_OR_1(...) \
  FB_VA_GLUE(FB_ARG_2_OR_1_IMPL, (__VA_ARGS__, __VA_ARGS__))
#else
#define FB_ARG_2_OR_1(...) FB_ARG_2_OR_1_IMPL(__VA_ARGS__, __VA_ARGS__)
#endif
// 上のマクロの補助
#define FB_ARG_2_OR_1_IMPL(a, b, ...) b
```

```cpp:line-numbers=25 [原文]
// MSVC's preprocessor is a pain, so we have to
// forcefully expand the VA args in some places.
#define FB_VA_GLUE(a, b) a b

/**
 * FB_ONE_OR_NONE(hello, world) expands to hello and
 * FB_ONE_OR_NONE(hello) expands to nothing. This macro is used to
 * insert or eliminate text based on the presence of another argument.
 */
#define FB_ONE_OR_NONE(a, ...) FB_VA_GLUE(FB_THIRD, (a, ##__VA_ARGS__, a))
#define FB_THIRD(a, b, ...) __VA_ARGS__

/**
 * Helper macro that extracts the first argument out of a list of any
 * number of arguments.
 */
#define FB_ARG_1(a, ...) a

/**
 * Helper macro that extracts the second argument out of a list of any
 * number of arguments. If only one argument is given, it returns
 * that.
 */
#ifdef _MSC_VER
// GCC refuses to expand this correctly if this macro itself was
// called with FB_VA_GLUE :(
#define FB_ARG_2_OR_1(...) \
  FB_VA_GLUE(FB_ARG_2_OR_1_IMPL, (__VA_ARGS__, __VA_ARGS__))
#else
#define FB_ARG_2_OR_1(...) FB_ARG_2_OR_1_IMPL(__VA_ARGS__, __VA_ARGS__)
#endif
// Support macro for the above
#define FB_ARG_2_OR_1_IMPL(a, b, ...) b
```

:::

## 前提知識

- **関数形式マクロ**: `#define F(a, b) a + b` のように引数を取るマクロです。`F(1, 2)` は `1 + 2` に置き換わります。
- **可変長マクロ `...` と `__VA_ARGS__`**: `#define G(a, ...)` の `...` は「残りの引数ぜんぶ」で、本体では `__VA_ARGS__` と書いて取り出します。残りが無ければ空になります。
- **`, ##__VA_ARGS__`**: GCC 由来の拡張で、`__VA_ARGS__` が空のときは **直前のカンマも一緒に消す** という意味です。`(a, ##__VA_ARGS__, a)` は、残りが無いと `(a, a)`、`world` なら `(a, world, a)` になります。
- **`#ifdef _MSC_VER`**: Microsoft のコンパイラ（MSVC）でコンパイルしているときだけ有効になる部分です。
- **MSVC の古いプリプロセッサの癖**: MSVC の従来のプリプロセッサは、`__VA_ARGS__` を別のマクロに渡すとき、カンマを含んでいても **1 つの引数** として扱ってしまうことがあります。

## 何をしているか

### 1. FB_THIRD: 3 番目以降を取り出す

```cpp:line-numbers=35
#define FB_THIRD(a, b, ...) __VA_ARGS__
```

`FB_THIRD(a, b, ...)` は、最初の 2 つを捨てて残りを返します。`FB_THIRD(x, y, z)` は `z`、`FB_THIRD(x, y)` は空です。

### 2. FB_ONE_OR_NONE

```cpp:line-numbers=34
#define FB_ONE_OR_NONE(a, ...) FB_VA_GLUE(FB_THIRD, (a, ##__VA_ARGS__, a))
```

引数の並びを `(a, 残り, a)` に詰め直して `FB_THIRD` に渡します。

- `FB_ONE_OR_NONE(hello, world)` → `FB_THIRD(hello, world, hello)` → **`hello`**
- `FB_ONE_OR_NONE(hello)` → `##` でカンマが消えて `FB_THIRD(hello, hello)` → **空**

2 つめの引数があるかどうかで、末尾の `a` が「3 番目」に来るかどうかが変わる、という仕掛けです。

### 3. FB_ARG_2_OR_1

```cpp:line-numbers=51
#define FB_ARG_2_OR_1(...) \
  FB_VA_GLUE(FB_ARG_2_OR_1_IMPL, (__VA_ARGS__, __VA_ARGS__))
#else
#define FB_ARG_2_OR_1(...) FB_ARG_2_OR_1_IMPL(__VA_ARGS__, __VA_ARGS__)
#endif
// Support macro for the above
#define FB_ARG_2_OR_1_IMPL(a, b, ...) b
```

引数の並びを **2 回続けて** 渡し、2 番目を取り出します。

- `FB_ARG_2_OR_1(1, 2)` → `FB_ARG_2_OR_1_IMPL(1, 2, 1, 2)` → **`2`**
- `FB_ARG_2_OR_1(1)` → `FB_ARG_2_OR_1_IMPL(1, 1)` → **`1`**

引数が 1 つしかなければ、2 回目の並びの先頭が「2 番目」の位置に来るわけです。

### 4. MSVC 対策の FB_VA_GLUE

```cpp:line-numbers=25
// MSVC's preprocessor is a pain, so we have to
// forcefully expand the VA args in some places.
#define FB_VA_GLUE(a, b) a b
```

`FB_VA_GLUE(a, b)` は `a b` と並べるだけのマクロです。`FB_VA_GLUE(FB_THIRD, (x, y, z))` は `FB_THIRD (x, y, z)` になり、ここで改めてマクロ呼び出しとして展開されます。
こうすると MSVC の古いプリプロセッサでも、`(x, y, z)` が 3 つの引数として正しく分解されます。`#ifdef _MSC_VER` の部分では、MSVC かどうかで書き方を切り替えています。

## ここがすごい

### 実際の使いどころ: BENCHMARK マクロ

`folly/Benchmark.h` の `BENCHMARK` マクロは、この 2 つを組み合わせています。

```cpp
BENCHMARK(fast)            { ... }  // 繰り返し回数を受け取らない
BENCHMARK(loop, n)         { for (unsigned i = 0; i < n; ++i) ... }
```

- `FB_ARG_2_OR_1(1, ##__VA_ARGS__)` は、`n` が書かれていれば `n`、なければ `1` になります。
- `FB_ONE_OR_NONE(unsigned, ##__VA_ARGS__)` は、`n` が書かれていれば `unsigned`、なければ空になります。

これで、生成される関数の引数リストが `(unsigned n)` になったり `()` になったりします。利用者は 1 つのマクロ名で 2 通りの書き方ができます。

### 「位置で選ぶ」という発想

プリプロセッサには条件分岐がないので、「並びをずらして、目的のものが特定の位置に来るようにする」ことで分岐の代わりにしています。この考え方を広げると、引数の個数を数えるマクロ（同じファイルの `FOLLY_PP_DETAIL_NARGS`）なども作れます。

### 移植性を 1 か所に閉じ込める

コンパイラの癖への対処を `FB_VA_GLUE` にまとめ、利用側のマクロは素直に書けるようにしています。コメントのように、「GCC では逆にこの書き方だと展開できない」といった落とし穴も記録されています。

## まとめ

- プリプロセッサに `if` はないが、引数の並べ方で「選択」は実現できる。
- `, ##__VA_ARGS__` は、残りの引数が空のときに直前のカンマを消す。
- 「(a, 残り, a) の 3 番目」「(並び, 並び) の 2 番目」のように、位置で値を拾う。
- コンパイラごとの差は、小さな補助マクロに閉じ込めると管理しやすい。
