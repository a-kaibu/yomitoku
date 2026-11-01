---
title: static char 1 個の「住所」をクラスの身分証にする軽量 RTTI
description: LLVM のエラー型の土台 ErrorInfo。各クラスが持つ static char ID の住所を型の識別子に使い、CRTP で isA の連鎖を自動生成する。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Error.h
lines: [344, 365]
function: llvm::ErrorInfo
difficulty: 3
tags: [エラー処理, 型システム, 設計パターン]
format: 2
---

## ひとことで

LLVM では、独自のエラー型を次のように作ります。

```cpp
class MyError : public ErrorInfo<MyError> {
  // ...
public:
  static char ID;
};
char MyError::ID = 0;   // .cpp に 1 つ
```

`ErrorInfo` は、この 1 行の継承だけで「このエラーは `MyError` の一種か」を判定する仕組みを作ってくれるテンプレートです。判定に使うのは、**`static char ID` という変数の住所（アドレス）**です。値は何でもよく、プログラムの中で住所が 1 つに決まることだけを利用しています。

## コード

::: code-group

```cpp:line-numbers=344 [日本語訳]
/// 利用者のエラー型のための基底クラス。利用者はエラー型を
/// 次のように宣言すること:
///
/// class MyError : public ErrorInfo<MyError> {
///   ....
/// };
///
/// このクラスは ErrorInfoBase::kind メソッドの実装を提供する。
/// これは Error の RTTI の仕組みで使われる。
template <typename ThisErrT, typename ParentErrT = ErrorInfoBase>
class ErrorInfo : public ParentErrT {
public:
  using ParentErrT::ParentErrT; // コンストラクタを引き継ぐ

  static const void *classID() { return &ThisErrT::ID; }

  const void *dynamicClassID() const override { return &ThisErrT::ID; }

  bool isA(const void *const ClassID) const override {
    return ClassID == classID() || ParentErrT::isA(ClassID);
  }
};
```

```cpp:line-numbers=344 [原文]
/// Base class for user error types. Users should declare their error types
/// like:
///
/// class MyError : public ErrorInfo<MyError> {
///   ....
/// };
///
/// This class provides an implementation of the ErrorInfoBase::kind
/// method, which is used by the Error RTTI system.
template <typename ThisErrT, typename ParentErrT = ErrorInfoBase>
class ErrorInfo : public ParentErrT {
public:
  using ParentErrT::ParentErrT; // inherit constructors

  static const void *classID() { return &ThisErrT::ID; }

  const void *dynamicClassID() const override { return &ThisErrT::ID; }

  bool isA(const void *const ClassID) const override {
    return ClassID == classID() || ParentErrT::isA(ClassID);
  }
};
```

:::

## 前提知識

- **`static` メンバー変数**: クラスに 1 つだけ存在する変数です。オブジェクトをいくつ作っても共有されます。`char MyError::ID = 0;` のように .cpp で実体を定義します。
- **`&` で住所を取る**: `&ThisErrT::ID` は変数 `ID` のメモリ上の住所です。別の変数は必ず別の住所を持つので、**住所をクラスごとの一意な番号**として使えます。
- **`const void *`**: 型を問わない「何かへの住所」です。ここでは比較にしか使わないので、型は要りません。
- **仮想関数と `override`**: 親クラスで `virtual` と宣言された関数を、子クラスで上書きしたことを示します。呼び出すと、オブジェクトの**本当の型**の版が実行されます。
- **CRTP**: `class MyError : public ErrorInfo<MyError>` のように、**自分自身をテンプレート引数にして親を継承する**書き方です。親のテンプレートの中で、子の型（`ThisErrT`）を使えるようになります。
- **`using ParentErrT::ParentErrT;`**: 親クラスのコンストラクタを、そのまま子でも使えるようにする宣言です（継承コンストラクタ）。

## 何をしているか

### 1. 親を選べる継承

```cpp:line-numbers=353
template <typename ThisErrT, typename ParentErrT = ErrorInfoBase>
class ErrorInfo : public ParentErrT {
public:
  using ParentErrT::ParentErrT; // コンストラクタを引き継ぐ
```

`ErrorInfo<MyError>` と書けば親は `ErrorInfoBase`（すべてのエラーの根）です。`ErrorInfo<MyError, StringError>` と書けば、既存の `StringError` を親にして機能を引き継げます。

### 2. 型の身分証を返す

```cpp:line-numbers=358
  static const void *classID() { return &ThisErrT::ID; }

  const void *dynamicClassID() const override { return &ThisErrT::ID; }
```

`classID()` は**静的な**関数で、「`MyError` という型」の身分証（`MyError::ID` の住所）を返します。
`dynamicClassID()` は**仮想**関数で、「このオブジェクトの本当の型」の身分証を返します。`ErrorInfoBase *` 経由で呼んでも、中身が `MyError` なら `MyError::ID` の住所が返ります。

### 3. 親をたどる isA

```cpp:line-numbers=362
  bool isA(const void *const ClassID) const override {
    return ClassID == classID() || ParentErrT::isA(ClassID);
  }
```

`isA(ClassID)` は「自分は `ClassID` の型の一種か」を答えます。

`MyError2 : ErrorInfo<MyError2, MyError>` というエラーで、`isA(MyError::classID())` を呼んだとします。

```
MyError2 の isA: ClassID == &MyError2::ID ? → いいえ
  → 親 MyError の isA: ClassID == &MyError::ID ? → はい → true
```

自分の身分証と違えば、親の `isA` に聞きます。親も `ErrorInfo` から作られていれば、同じ処理が根の `ErrorInfoBase` まで続きます。根の `isA` は、`ErrorInfoBase` 自身の身分証と比べるだけです。

```cpp:line-numbers=70

  // このインスタンスが、ClassID で識別されるクラスの
  // 子クラスかどうかを調べる。
  virtual bool isA(const void *const ClassID) const {
    return ClassID == classID();
```

## ここがすごい

C++ には標準の型判定（RTTI と `dynamic_cast`）がありますが、LLVM は通常 RTTI を切ってビルドされます。そこで自前の仕組みが要ります。

LLVM の他の部分（`isa<>` など）では、クラスごとに「種類番号」の `enum` を用意する方式がよく使われます。しかしエラー型は、LLVM を使う外部のプロジェクトも**自由に追加**します。中央の `enum` に番号を登録する方式では、全員で番号を調整しなければなりません。

`static char ID` の住所を使う方式なら、

- 各クラスが `char` を 1 つ定義するだけで、**調整なしに一意な識別子**が手に入る
- 比較は住所の比較 1 回で済む
- CRTP のおかげで、`classID`・`dynamicClassID`・`isA` を**利用者が書かなくてよい**

という利点があります。継承の深さだけ `isA` がたどられますが、エラー型の階層は浅いので問題になりません。

`ID` の値そのもの（`= 0`）には意味がない、という点も面白いところです。「変数はそれぞれ別の住所を持つ」という言語の性質だけで、型の身分証を作っています。

## まとめ

- `static` 変数の住所は、プログラム中で一意な識別子として使える。
- CRTP で子の型を親に渡すと、型ごとの定型コードを自動生成できる。
- 静的な `classID` と仮想の `dynamicClassID` を組み合わせて、型の判定ができる。
- 親の `isA` を順にたどれば、継承関係の判定もできる。
- 中央管理の番号が要らない仕組みは、外部から拡張される型に向いている。
