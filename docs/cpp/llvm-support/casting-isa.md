---
title: 「どれかの型か」を畳み込み式 1 行で書く可変長 isa
description: isa<A, B, C>(v) のように複数の型をまとめて判定できる LLVM の isa。C++17 の畳み込み式で、型の数だけ判定を || でつなぐ。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Casting.h
lines: [541, 549]
function: llvm::isa
difficulty: 2
tags: [ジェネリクス, メタプログラミング, API設計]
format: 2
---

## ひとことで

`isa<X>(V)` は「`V` は型 `X` の一種か」を判定する LLVM の関数です。この版は**型をいくつでも並べられます**。

```cpp
if (isa<LoadInst, StoreInst>(I)) { ... }   // 読み込みか書き込みの命令なら
```

これは `isa<LoadInst>(I) || isa<StoreInst>(I)` と同じ意味です。それを、C++17 の**畳み込み式**を使ってたった 1 行で実装しています。

## コード

::: code-group

```cpp:line-numbers=541 [日本語訳]
/// isa<X> - 引数が、テンプレート引数に並べた型のどれかの
/// インスタンスなら true を返す。次のように使う:
///
///  if (isa<Type>(myVal)) { ... }
///  if (isa<Type0, Type1, Type2>(myVal)) { ... }
template <typename... To, typename From>
[[nodiscard]] inline bool isa(const From &Val) {
  return (CastInfo<To, const From>::isPossible(Val) || ...);
}
```

```cpp:line-numbers=541 [原文]
/// isa<X> - Return true if the parameter to the template is an instance of one
/// of the template type arguments.  Used like this:
///
///  if (isa<Type>(myVal)) { ... }
///  if (isa<Type0, Type1, Type2>(myVal)) { ... }
template <typename... To, typename From>
[[nodiscard]] inline bool isa(const From &Val) {
  return (CastInfo<To, const From>::isPossible(Val) || ...);
}
```

:::

## 前提知識

- **可変長テンプレート `typename... To`**: 型をいくつでも受け取れるテンプレート引数です。`To` は 1 つの型ではなく「型の並び（パック）」になります。
- **テンプレート引数の推論**: `From` は書かなくても、渡した引数 `Val` の型から自動で決まります。`isa<A, B>(V)` と書くと、`To = {A, B}`、`From = V の型` です。並びを先に、推論させたい型を後ろに置くことで、この書き方ができるようになっています。
- **畳み込み式（fold expression）**: `(式 || ...)` と書くと、パックの要素ごとに `式` を作って `||` でつなぎます。C++17 で入った機能です。
- **`CastInfo<To, From>::isPossible(Val)`**: LLVM の型変換の「設定表」です。`To` へ変換できるか（`Val` が `To` の一種か）を返します。内部では各クラスの `classof` などが使われます。
- **`[[nodiscard]]`**: 戻り値を捨てるとコンパイラが警告を出す属性です。`isa(V);` のように結果を使わない書き間違いを見つけられます。
- **`const From &`**: 値をコピーせず、書き換えもしない参照で受け取ります。

## 何をしているか

### 1. 型の並びを受け取る

```cpp:line-numbers=546
template <typename... To, typename From>
[[nodiscard]] inline bool isa(const From &Val) {
```

`isa<LoadInst, StoreInst>(I)` と呼ぶと、`To` は `LoadInst, StoreInst` の 2 つ、`From` は `I` の型（たとえば `Instruction`）になります。

### 2. 畳み込みで展開する

```cpp:line-numbers=548
  return (CastInfo<To, const From>::isPossible(Val) || ...);
```

```cpp
(CastInfo<To, const From>::isPossible(Val) || ...)
```

コンパイラはこれを次のように展開します。

```cpp
CastInfo<LoadInst, const Instruction>::isPossible(Val) ||
CastInfo<StoreInst, const Instruction>::isPossible(Val)
```

`||` は左から順に評価され、どれかが真になった時点で残りは評価されません（短絡評価）。`I` が `LoadInst` なら、`StoreInst` の判定は実行されません。

型が 1 つだけなら、畳み込みは単なる 1 回の判定になります。型を 1 つしか受け付けない昔の版と、使い方は完全に互換です。

## ここがすごい

C++17 より前に同じことをするには、再帰を使って書く必要がありました。

```cpp
template <typename X, typename Y> bool isa(const Y &V) { /* 1 個の判定 */ }
template <typename X, typename X2, typename... Xs, typename Y>
bool isa(const Y &V) { return isa<X>(V) || isa<X2, Xs...>(V); }
```

先頭を 1 つ取り出し、残りで自分を呼ぶ、という形です。関数の数が増え、読むのも大変です。

畳み込み式を使うと、

- **1 つの関数・1 行**で、任意の個数の型を扱え、
- 展開はコンパイル時に行われるので、**手で `||` を並べたのと同じコード**になり、
- 短絡評価もそのまま効きます。

また、ユーザーから見ると `isa<A>(V)` も `isa<A, B, C>(V)` も同じ名前で書けます。よく使う「このどれかか」という判定を、読みやすく短く書けるようにした API 設計の改善です。

判定の本体を `CastInfo` に任せているのもポイントです。`isa` 自身は「並べてつなぐ」ことだけに専念していて、型ごとの判定方法（ポインタか、スマートポインタか、`std::optional` か）は別の場所でカスタマイズできるようになっています。

## まとめ

- 可変長テンプレートの並びは、畳み込み式 `(式 || ...)` で一気に展開できる。
- 畳み込みは手で書いた `||` と同じで、短絡評価も効く。
- 推論させたい型を最後に置くと、「型の並び + 推論」の呼び出し方ができる。
- 「並べる」役と「1 つを判定する」役を分けると、それぞれ単純に保てる。
