---
title: RTTI を使わない型判定 isa の心臓部、classof とアップキャストの特殊化
description: LLVM の isa<X>(v) が「v は X の一種か」を判定する中核のテンプレート。各クラスの classof に任せる既定版と、親クラスへの判定は無条件で true にする部分特殊化の 2 つだけでできている。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Casting.h
lines: [60, 71]
function: llvm::isa_impl
difficulty: 3
tags: [型システム, メタプログラミング, 設計パターン]
format: 2
---

## ひとことで

LLVM では、`isa<Instruction>(V)` のように書いて「`V` は `Instruction` の一種か」を調べます。C++ 標準の `dynamic_cast` は使いません。

`isa_impl` はその判定の**中核**です。中身はたった 2 つのテンプレートで、

- 普通は、調べたい型 `To` の `classof` という静的関数に判定を任せる
- `To` が `From` の親クラスなら、調べるまでもなく `true`

という規則を表しています。

## コード

::: code-group

```cpp:line-numbers=60 [日本語訳]
// isa<X> の実装の中核はここ。To と From は
// クラス名であること。このテンプレートを特殊化すれば、isa<> を
// 一から書き直さずに実装をカスタマイズできる。
template <typename To, typename From, typename Enabler = void> struct isa_impl {
  static inline bool doit(const From &Val) { return To::classof(&Val); }
};

// アップキャストは常に許し、実行時の検査は行わない。
template <typename To, typename From>
struct isa_impl<To, From, std::enable_if_t<std::is_base_of_v<To, From>>> {
  static inline bool doit(const From &) { return true; }
};
```

```cpp:line-numbers=60 [原文]
// The core of the implementation of isa<X> is here; To and From should be
// the names of classes.  This template can be specialized to customize the
// implementation of isa<> without rewriting it from scratch.
template <typename To, typename From, typename Enabler = void> struct isa_impl {
  static inline bool doit(const From &Val) { return To::classof(&Val); }
};

// Always allow upcasts, and perform no dynamic check for them.
template <typename To, typename From>
struct isa_impl<To, From, std::enable_if_t<std::is_base_of_v<To, From>>> {
  static inline bool doit(const From &) { return true; }
};
```

:::

## 前提知識

- **クラスの継承**: `class Derived : public Base` と書くと、`Derived` は `Base` の一種（子クラス）になります。子クラスのオブジェクトは親クラスとして扱えます。
- **RTTI と `dynamic_cast`**: C++ 標準の仕組みで、実行時に「このオブジェクトの本当の型は何か」を調べられます。ただし型情報をプログラムに埋め込むので、サイズや速度のコストがあります。LLVM は通常 RTTI を無効にしてビルドされます。
- **`classof`**: LLVM の慣習で、各クラスが自分で用意する静的関数です。たとえば「オブジェクトが持つ種類番号（enum）が自分の範囲に入っていれば `true`」のように実装します。
- **テンプレートの部分特殊化**: 一般的なテンプレートに加えて、「引数がこういう条件のときはこちらを使う」という別バージョンを定義できます。
- **`std::enable_if_t<条件>`**: 条件が真のときだけ `void` という型になり、偽なら**型として成立しない**（その特殊化が候補から外れる）仕組みです。この性質を SFINAE と呼びます。
- **`std::is_base_of_v<To, From>`**: `To` が `From` の親クラス（または同じクラス）なら `true` になるコンパイル時の値です。
- **`static inline` 関数**: `struct` に属する関数で、オブジェクトを作らずに `isa_impl<A, B>::doit(v)` と呼べます。

## 何をしているか

### 1. 既定版: classof に聞く

```cpp:line-numbers=63
template <typename To, typename From, typename Enabler = void> struct isa_impl {
  static inline bool doit(const From &Val) { return To::classof(&Val); }
};
```

3 つ目のテンプレート引数 `Enabler` の既定値は `void` です。何も特別な条件に当てはまらなければ、この版が使われ、`To::classof(&Val)` を呼びます。

たとえば `Value` 型の変数 `V` に対して `isa<Instruction>(V)` を調べると、最終的に `Instruction::classof(&V)` が呼ばれます。`classof` はオブジェクトの中の種類番号を見るだけなので、比較 1 回か 2 回で終わります。

### 2. 特殊化: 親クラスへの判定は常に true

```cpp:line-numbers=67
// アップキャストは常に許し、実行時の検査は行わない。
template <typename To, typename From>
struct isa_impl<To, From, std::enable_if_t<std::is_base_of_v<To, From>>> {
  static inline bool doit(const From &) { return true; }
};
```

`From` が `Instruction` で、`To` が親クラスの `Value` なら、`Instruction` は必ず `Value` の一種です。実行時に調べる必要はありません。

`std::is_base_of_v<To, From>` が真になると、`std::enable_if_t<...>` は `void` になります。すると `isa_impl<To, From, void>` を探すときに、**この特殊化のほうがより具体的なので選ばれます**。中身は `return true;` なので、コンパイラは判定ごと消してしまえます。

逆に条件が偽だと、`enable_if_t` が型として成立しないので、この特殊化は黙って候補から外れ、既定版が使われます。

## ここがすごい

- **RTTI なしで型判定ができる**: `classof` は各クラスが持つ種類番号で判定するので、C++ の RTTI に頼りません。判定は整数の比較だけで済みます。
- **わかりきった判定はコンパイル時に消す**: 親クラスへの判定（アップキャスト）を特殊化で `true` にしておくことで、ジェネリックなコードの中で `isa` が書かれても、実行時のコストがゼロになります。冒頭のコメントにあるように、利用者がさらに特殊化して挙動を変えることもできます。
- **拡張は「classof を書くだけ」**: 新しいクラスを作った人は `classof` を 1 つ書けば、`isa`・`cast`・`dyn_cast` がすべて使えるようになります。仕組みの中心を小さく保ち、拡張点をはっきりさせた設計です。

`std::enable_if_t` を 3 つ目のテンプレート引数に置いて部分特殊化を切り替える手法は、C++ のテンプレートで「条件付きの実装」を書く定番のテクニックでもあります。

## まとめ

- LLVM は RTTI の代わりに、各クラスの `classof` で型を判定する。
- 部分特殊化と `enable_if_t` を組み合わせると、型の条件で実装を切り替えられる。
- 子から親への判定は常に真なので、特殊化でコンパイル時に `true` にしてしまう。
- 中心の仕組みを小さくし、拡張点（`classof`）を 1 つに絞ると使いやすい。
