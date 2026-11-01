---
title: SmallVector<T> の「中に何個置くか」をコンパイル時に決める
description: SmallVector<T> と個数を省略したとき、全体が 64 バイトに収まるように内蔵要素の数を自動で計算します。巨大な型には static_assert で警告します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/SmallVector.h
lines: [1189, 1240]
function: CalculateSmallVectorDefaultInlinedElements
difficulty: 2
format: 2
tags: [メタプログラミング, メモリ管理, API設計]
---

## ひとことで

`SmallVector<T, N>` は、最初の `N` 個まではヒープを使わず、オブジェクトの中に要素を置く配列です。
この構造体は、`N` を省略して `SmallVector<T>` と書いたときの **ちょうどよい `N` をコンパイル時に計算** します。目標は「SmallVector 全体が 64 バイト以下」です。

## コード

::: code-group

```cpp:line-numbers=1189 [日本語訳]
/// `SmallVector<T>` の既定の内蔵要素数を計算するための
/// 補助クラス。
///
/// 最低限サポートするコンパイラが複数文の constexpr 関数に対応したら、
/// constexpr 関数に移行すべき。
template <typename T> struct CalculateSmallVectorDefaultInlinedElements {
  // `SmallVector<T>` の既定の内蔵要素数を決める
  // パラメータ。
  //
  // 既定の内蔵要素数は、次のことを保証する。
  // 1. 内蔵要素が少なくとも 1 個ある。
  // 2. `sizeof(SmallVector<T>) <= kPreferredSmallVectorSizeof`。ただし
  // 1 と矛盾する場合を除く。
  static constexpr size_t kPreferredSmallVectorSizeof = 64;

  // sizeof(T) が「大きすぎ」ないことを static_assert で確かめる。
  //
  // 内蔵要素を少なくとも 1 個保証する方針なので、いくらでも大きな要素が
  // いくらでも大きな内蔵領域を確保してしまう可能性がある。
  // SmallVector が過大な内蔵領域を確保するのは、一般に
  // アンチパターンだと考えている。そこでこうしたケースに
  // 注意を促し、大きな内蔵領域を求めるときは利用者が
  // 意図して決めたのだと確かめたい。
  //
  // このアサーションは異常なケースでは発動させたいが、それ以外では
  // 簡単に引っかからないようにしたい。そのため、しきい値は
  // kPreferredSmallVectorSizeof よりいくらか大きくしてある（そうしないと
  // `SmallVector<SmallVector<T>>` で簡単に引っかかってしまうが、この
  // パターンは実際に便利そうだ）。
  //
  // 一つ問題なのは、sizeof(T) は一般に環境依存なので、このアサーションは
  // 理論上は移植性がないことだ。ただし大きな問題にはならないと考えている。
  // LLVM の開発の多くは 64 ビット環境で行われており、
  // 32 ビット環境向けにコンパイルすると sizeof(T) はむしろ *小さくなる* ので、
  // 問題を避けられるからだ。逆に 32 ビット環境で開発していて、
  // 64 ビット環境で sizeof(T) が *大きくなって* 失敗する状況は、
  // とてもまれだと考えている。
  static_assert(
      sizeof(T) <= 256,
      "You are trying to use a default number of inlined elements for "
      "`SmallVector<T>` but `sizeof(T)` is really big! Please use an "
      "explicit number of inlined elements with `SmallVector<T, N>` to make "
      "sure you really want that much inline storage.");

  // 内蔵できる最大バイト数を計算するときは、ヘッダ自体の大きさを
  // 差し引く。
  static constexpr size_t PreferredInlineBytes =
      kPreferredSmallVectorSizeof - sizeof(SmallVector<T, 0>);
  static constexpr size_t NumElementsThatFit = PreferredInlineBytes / sizeof(T);
  static constexpr size_t value =
      NumElementsThatFit == 0 ? 1 : NumElementsThatFit;
};
```

```cpp:line-numbers=1189 [原文]
/// Helper class for calculating the default number of inline elements for
/// `SmallVector<T>`.
///
/// This should be migrated to a constexpr function when our minimum
/// compiler support is enough for multi-statement constexpr functions.
template <typename T> struct CalculateSmallVectorDefaultInlinedElements {
  // Parameter controlling the default number of inlined elements
  // for `SmallVector<T>`.
  //
  // The default number of inlined elements ensures that
  // 1. There is at least one inlined element.
  // 2. `sizeof(SmallVector<T>) <= kPreferredSmallVectorSizeof` unless
  // it contradicts 1.
  static constexpr size_t kPreferredSmallVectorSizeof = 64;

  // static_assert that sizeof(T) is not "too big".
  //
  // Because our policy guarantees at least one inlined element, it is possible
  // for an arbitrarily large inlined element to allocate an arbitrarily large
  // amount of inline storage. We generally consider it an antipattern for a
  // SmallVector to allocate an excessive amount of inline storage, so we want
  // to call attention to these cases and make sure that users are making an
  // intentional decision if they request a lot of inline storage.
  //
  // We want this assertion to trigger in pathological cases, but otherwise
  // not be too easy to hit. To accomplish that, the cutoff is actually somewhat
  // larger than kPreferredSmallVectorSizeof (otherwise,
  // `SmallVector<SmallVector<T>>` would be one easy way to trip it, and that
  // pattern seems useful in practice).
  //
  // One wrinkle is that this assertion is in theory non-portable, since
  // sizeof(T) is in general platform-dependent. However, we don't expect this
  // to be much of an issue, because most LLVM development happens on 64-bit
  // hosts, and therefore sizeof(T) is expected to *decrease* when compiled for
  // 32-bit hosts, dodging the issue. The reverse situation, where development
  // happens on a 32-bit host and then fails due to sizeof(T) *increasing* on a
  // 64-bit host, is expected to be very rare.
  static_assert(
      sizeof(T) <= 256,
      "You are trying to use a default number of inlined elements for "
      "`SmallVector<T>` but `sizeof(T)` is really big! Please use an "
      "explicit number of inlined elements with `SmallVector<T, N>` to make "
      "sure you really want that much inline storage.");

  // Discount the size of the header itself when calculating the maximum inline
  // bytes.
  static constexpr size_t PreferredInlineBytes =
      kPreferredSmallVectorSizeof - sizeof(SmallVector<T, 0>);
  static constexpr size_t NumElementsThatFit = PreferredInlineBytes / sizeof(T);
  static constexpr size_t value =
      NumElementsThatFit == 0 ? 1 : NumElementsThatFit;
};
```

:::

## 前提知識

- **`template <typename T> struct ...`**: 型 `T` ごとに別々の構造体が作られます。ここでは「型 → 数」の変換表のように使っています。
- **`static constexpr`**: コンパイル時に値が決まる定数です。プログラムが動く前に計算が済み、実行時のコストはゼロです。
- **`sizeof(X)`**: 型 `X` が何バイトかをコンパイル時に返します。
- **`static_assert(条件, "メッセージ")`**: 条件が偽ならコンパイルエラーにして、メッセージを表示します。
- **前方宣言**: `SmallVector` の中身を書く前に名前だけ宣言しています。中身より先に `sizeof(SmallVector<T, 0>)` を使いたいので必要です。
- **`A ? B : C`**: 三項演算子です。`A` が真なら `B`、偽なら `C` になります。

## 何をしているか

### 1. 目標サイズは 64 バイト

```cpp:line-numbers=1202
  static constexpr size_t kPreferredSmallVectorSizeof = 64;
```

`kPreferredSmallVectorSizeof = 64` が「SmallVector 1 個の理想の大きさ」です。

### 2. 大きすぎる型は止める

```cpp:line-numbers=1226
  static_assert(
      sizeof(T) <= 256,
      "You are trying to use a default number of inlined elements for "
      "`SmallVector<T>` but `sizeof(T)` is really big! Please use an "
      "explicit number of inlined elements with `SmallVector<T, N>` to make "
      "sure you really want that much inline storage.");
```

`sizeof(T)` が 256 バイトを超えると、コンパイルエラーになります。
方針として「最低 1 個は中に置く」ので、巨大な型だとそれだけで SmallVector が巨大になるからです。その場合は `SmallVector<T, N>` と明示して、本当にそれでよいか利用者に考えさせます。

コメントによると、境目を 64 ではなく 256 にしたのは、`SmallVector<SmallVector<T>>` のような便利な使い方まで弾かないためです。

### 3. ヘッダの大きさを引く

```cpp:line-numbers=1235
  static constexpr size_t PreferredInlineBytes =
      kPreferredSmallVectorSizeof - sizeof(SmallVector<T, 0>);
```

`sizeof(SmallVector<T, 0>)` は、要素を 1 つも内蔵しない SmallVector、つまり **ポインタ・サイズ・容量だけのヘッダ部分** の大きさです。
64 ビット環境では多くの場合 16 バイトなので、`PreferredInlineBytes` は `64 - 16 = 48` バイトになります。

### 4. 何個入るか割り算

```cpp:line-numbers=1237
  static constexpr size_t NumElementsThatFit = PreferredInlineBytes / sizeof(T);
  static constexpr size_t value =
      NumElementsThatFit == 0 ? 1 : NumElementsThatFit;
```

- `T = int`（4 バイト）なら `48 / 4 = 12` 個
- `T = void*`（8 バイト）なら `48 / 8 = 6` 個
- `T` が 100 バイトなら `48 / 100 = 0` なので、最低保証の `1` 個

この `value` が、`SmallVector` の既定のテンプレート引数として使われます。

## ここがすごい

- **「なんとなく 8 個」をやめた**: 個数を型の大きさから逆算するので、`int` でも大きな構造体でも、メモリの使い方が揃います。64 バイトは多くの CPU のキャッシュライン（一度に読み込むメモリの単位）の大きさと同じです。
- **方針をコメントで明文化**: 冒頭のコメントに「少なくとも 1 個」「64 バイト以下（1 個と矛盾しない限り）」と、守るべき性質が書かれています。コードはその通りに組み立てられていて読みやすいです。
- **移植性への配慮も記述**: `static_assert` の前のコメントで、`sizeof(T)` が環境によって変わるため、このチェックは厳密には移植性がないことを認めたうえで、実害が少ない理由を説明しています。
- **コンパイル時に完結**: すべて `constexpr` なので、実行時の負担はまったくありません。構造体の前のコメントには、本当は `constexpr` 関数で書きたいが古いコンパイラ対応のため構造体にした、という事情も書かれています。

## まとめ

- テンプレートと `constexpr` で「型から最適な定数を計算する」ことができる。
- 既定値を固定の数ではなく、目標サイズからの逆算で決めると無駄が少ない。
- 利用者が誤りやすい使い方は `static_assert` で止め、明示を促す。
- 設計の方針や妥協点をコメントに残すと、後から読む人が判断を追える。

