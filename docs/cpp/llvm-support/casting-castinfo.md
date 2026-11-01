---
title: dyn_cast の正体は「調べて、だめなら失敗値、よければ変換」の 3 部品
description: LLVM の cast と dyn_cast の振る舞いを決める CastInfo の既定版。判定・変換・失敗値の 3 つの部品を分け、dyn_cast をその組み合わせとして定義している。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Casting.h
lines: [475, 497]
function: llvm::CastInfo
difficulty: 3
tags: [型システム, 設計パターン, API設計]
format: 2
---

## ひとことで

LLVM では、型の変換に次の関数を使います。

- `cast<X>(V)`: `V` を `X` に変換する。失敗しないことが前提（違えば `assert` で止まる）。
- `dyn_cast<X>(V)`: `V` が `X` の一種なら変換し、違えば `nullptr` を返す。

`CastInfo` は、それらが内部で呼ぶ**「変換の設定表」**です。この既定版は、`isPossible`（判定）、`doCast`（変換）、`castFailed`（失敗値）の 3 つの部品を持ち、`doCastIfPossible` でそれを組み合わせて `dyn_cast` の動作を作っています。

## コード

::: code-group

```cpp:line-numbers=475 [日本語訳]
template <typename To, typename From, typename Enable = void>
struct CastInfo : CastIsPossible<To, From> {
  using Self = CastInfo<To, From, Enable>;

  using CastReturnType = typename cast_retty<To, From>::ret_type;

  static inline CastReturnType doCast(const From &f) {
    return cast_convert_val<
        To, From,
        typename simplify_type<From>::SimpleType>::doit(const_cast<From &>(f));
  }

  // キャストの戻り値の型が `nullptr` から作れることを前提にしている。
  // これは主に昔からの使い方を支えるため。この動作が望ましくなければ、
  // 用途に合わせて CastInfo を特殊化すること。
  static inline CastReturnType castFailed() { return CastReturnType(nullptr); }

  static inline CastReturnType doCastIfPossible(const From &f) {
    if (!Self::isPossible(f))
      return castFailed();
    return doCast(f);
  }
};
```

```cpp:line-numbers=475 [原文]
template <typename To, typename From, typename Enable = void>
struct CastInfo : CastIsPossible<To, From> {
  using Self = CastInfo<To, From, Enable>;

  using CastReturnType = typename cast_retty<To, From>::ret_type;

  static inline CastReturnType doCast(const From &f) {
    return cast_convert_val<
        To, From,
        typename simplify_type<From>::SimpleType>::doit(const_cast<From &>(f));
  }

  // This assumes that you can construct the cast return type from `nullptr`.
  // This is largely to support legacy use cases - if you don't want this
  // behavior you should specialize CastInfo for your use case.
  static inline CastReturnType castFailed() { return CastReturnType(nullptr); }

  static inline CastReturnType doCastIfPossible(const From &f) {
    if (!Self::isPossible(f))
      return castFailed();
    return doCast(f);
  }
};
```

:::

## 前提知識

- **継承による機能の取り込み**: `struct CastInfo : CastIsPossible<To, From>` は、`CastIsPossible` が持つ `isPossible` という関数を引き継ぐという意味です。
- **`using 名前 = 型;`**: 型に別名を付けます。`Self` は自分自身の型、`CastReturnType` は変換結果の型です。
- **`typename ...::ret_type`**: テンプレートの中で、別のテンプレートが定義した型を使うときは `typename` を前に付けます。`cast_retty<To, From>::ret_type` は「`From` から `To` に変換したときの戻り値の型」（ポインタなら `To *`、参照なら `To &` など）を計算します。
- **`static inline`**: オブジェクトを作らずに `CastInfo<A, B>::doCast(v)` と呼べる関数です。
- **`const_cast`**: `const` を外す変換です。ここでは、受け取った `const From &` を内部の処理に渡すために使っています。
- **`nullptr`**: どこも指さないポインタです。

## 何をしているか

### 1. 判定は親から受け継ぐ

```cpp:line-numbers=476
struct CastInfo : CastIsPossible<To, From> {
```

`isPossible(f)` は `CastIsPossible` から受け継いでいます。中では各クラスの `classof` などを使って「`f` は `To` の一種か」を調べます。

### 2. 変換

```cpp:line-numbers=481
  static inline CastReturnType doCast(const From &f) {
    return cast_convert_val<
        To, From,
        typename simplify_type<From>::SimpleType>::doit(const_cast<From &>(f));
  }
```

`doCast` は、判定済みの値を実際に変換します。ポインタなら C 形式のキャストで型を付け替えるだけ（同じファイルの `cast_convert_val` の特殊化）なので、実行時のコストはほぼありません。どの方法で変換するかは `cast_convert_val` というさらに内側のテンプレートが決めます。

### 3. 失敗値

```cpp:line-numbers=487
  // キャストの戻り値の型が `nullptr` から作れることを前提にしている。
  // これは主に昔からの使い方を支えるため。この動作が望ましくなければ、
  // 用途に合わせて CastInfo を特殊化すること。
  static inline CastReturnType castFailed() { return CastReturnType(nullptr); }
```

`castFailed` は、変換できなかったときに返す値です。既定では `nullptr` から作ります。コメントにある通り、これは「戻り値の型が `nullptr` から作れる」という前提で、昔からの使い方（ポインタ）に合わせたものです。そうでない型では `CastInfo` を特殊化してほしい、と書かれています。

### 4. 組み合わせ

```cpp:line-numbers=492
  static inline CastReturnType doCastIfPossible(const From &f) {
    if (!Self::isPossible(f))
      return castFailed();
    return doCast(f);
  }
```

```cpp
if (!Self::isPossible(f)) return castFailed();
return doCast(f);
```

`Instruction *I` に対して `dyn_cast<LoadInst>(I)` を呼ぶと、

1. `isPossible`: `I` が本当に `LoadInst` か調べる
2. 違えば `castFailed()`、つまり `nullptr` を返す
3. そうなら `doCast` で `LoadInst *` に変換して返す

という流れになります。`cast<LoadInst>(I)` のほうは、`assert` で判定してから `doCast` を直接呼ぶだけです。

`if (!Self::isPossible(f))` とわざわざ `Self::` を付けているのにも理由があります。`isPossible` は、テンプレート引数に依存する親クラス（`CastIsPossible<To, From>`）から受け継いだ関数です。C++ では、このような親のメンバーは名前だけでは探してもらえないというルール（2 段階の名前探索）があるため、`Self::` を付けて「このクラスの（受け継いだ）関数」と明示しているのです。

## ここがすごい

`dyn_cast` を 1 つの大きな関数として書くと、「ポインタの場合」「参照の場合」「`std::unique_ptr` の場合」「`std::optional` の場合」……と、分岐がどんどん増えていきます。

`CastInfo` は振る舞いを

- **判定（isPossible）**
- **変換（doCast）**
- **失敗したときの値（castFailed）**

の 3 つに分け、`dyn_cast` はそれを組み合わせるだけの薄い関数にしています。新しい種類の型に対応したいときは、**`CastInfo` を特殊化して必要な部品だけ差し替えれば**、`isa`・`cast`・`dyn_cast`・`cast_if_present` がすべて使えるようになります。実際、同じファイルには `std::unique_ptr` 用や `std::optional` 用の特殊化があります。

「アルゴリズムの骨組みは固定し、細部だけ差し替えられるようにする」という考え方は、テンプレートメソッドパターンと呼ばれる設計です。それをコンパイル時のテンプレートで実現しているので、差し替えによる実行時のコストもありません。

## まとめ

- `dyn_cast` は「判定 → 失敗値 or 変換」の組み合わせにすぎない。
- 振る舞いを小さな部品に分けると、特殊化で一部だけ差し替えられる。
- `Self::` 経由で呼ぶと、差し替えた部品が確実に使われる。
- 前提（`nullptr` から作れる）とその外し方をコメントに書いておくと、拡張する人が迷わない。
