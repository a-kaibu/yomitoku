---
title: アラインメントを 1 バイトの「log2」で持ち、2 の累乗以外を型で締め出す
description: メモリの整列単位を表す LLVM の Align 型。値そのものではなく log2 を 1 バイトで持つことで、小さく、比較も速く、0 や 3 のような不正な値を作れない型にしている。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Alignment.h
lines: [36, 102]
function: llvm::Align
difficulty: 2
tags: [型システム, API設計, メモリ管理]
format: 2
---

## ひとことで

`Align` は、「何バイト境界にそろえるか」という**アラインメント**を表す小さな構造体です。

アラインメントは必ず 1, 2, 4, 8, 16… の **2 の累乗**です。`Align` はそれを、値そのもの（8 なら 8）ではなく、**指数（log2）**を 1 バイトで保存します。8 なら 3、16 なら 4 です。
こうすることで、0 や 3 のような「ありえないアラインメント」を、そもそも作れないようにしています。

## コード

::: code-group

```cpp:line-numbers=36 [日本語訳]
/// この構造体は、有効な（0 でない 2 の累乗の）アラインメントを
/// コンパクトに表したもの。
/// static なグローバル定数として使うのにも向いている。
struct Align {
private:
  uint8_t ShiftValue = 0; /// 要求されるアラインメントの log2。
                          /// 作り方からして ShiftValue は 64 未満。

  friend struct MaybeAlign;
  friend unsigned Log2(Align);
  friend bool operator==(Align Lhs, Align Rhs);
  friend bool operator!=(Align Lhs, Align Rhs);
  friend bool operator<=(Align Lhs, Align Rhs);
  friend bool operator>=(Align Lhs, Align Rhs);
  friend bool operator<(Align Lhs, Align Rhs);
  friend bool operator>(Align Lhs, Align Rhs);
  friend unsigned encode(struct MaybeAlign A);
  friend struct MaybeAlign decodeMaybeAlign(unsigned Value);

public:
  /// 既定は 1 バイト境界。
  constexpr Align() = default;
  /// コピー／ムーブによる構築・代入では検査しない。
  /// `Other` を作ったときに検査済みだから。
  constexpr Align(const Align &Other) = default;
  constexpr Align(Align &&Other) = default;
  constexpr Align &operator=(const Align &Other) = default;
  constexpr Align &operator=(Align &&Other) = default;

  explicit Align(uint64_t Value) {
    assert(Value > 0 && "Value must not be 0");
    assert(llvm::isPowerOf2_64(Value) && "Alignment is not a power of 2");
    ShiftValue = Log2_64(Value);
    assert(ShiftValue < 64 && "Broken invariant");
  }

  /// `1 << Log2Value` バイトのアラインメントを返す。
  constexpr static Align fromLog2(unsigned Log2Value) {
    assert(Log2Value < 64 && "Alignment exponent is too large");
    Align Out;
    Out.ShiftValue = Log2Value;
    return Out;
  }

  /// これは型システムの抜け穴なので、乱用しないこと。
  /// たとえば C とやり取りするのに必要。
  constexpr uint64_t value() const { return uint64_t(1) << ShiftValue; }

  // 1 つ前（半分）のアラインメントを返す。
  Align previous() const {
    assert(ShiftValue != 0 && "Undefined operation");
    Align Out;
    Out.ShiftValue = ShiftValue - 1;
    return Out;
  }

  /// constexpr な Align を作れるようにする。
  template <size_t kValue> constexpr static Align Constant() {
    return fromLog2(ConstantLog2<kValue>());
  }

  /// 型から constexpr な Align を作れるようにする。
  /// Align(alignof(T)) のコンパイル時版。
  template <typename T> constexpr static Align Of() {
    return Constant<std::alignment_of_v<T>>();
  }
};
```

```cpp:line-numbers=36 [原文]
/// This struct is a compact representation of a valid (non-zero power of two)
/// alignment.
/// It is suitable for use as static global constants.
struct Align {
private:
  uint8_t ShiftValue = 0; /// The log2 of the required alignment.
                          /// ShiftValue is less than 64 by construction.

  friend struct MaybeAlign;
  friend unsigned Log2(Align);
  friend bool operator==(Align Lhs, Align Rhs);
  friend bool operator!=(Align Lhs, Align Rhs);
  friend bool operator<=(Align Lhs, Align Rhs);
  friend bool operator>=(Align Lhs, Align Rhs);
  friend bool operator<(Align Lhs, Align Rhs);
  friend bool operator>(Align Lhs, Align Rhs);
  friend unsigned encode(struct MaybeAlign A);
  friend struct MaybeAlign decodeMaybeAlign(unsigned Value);

public:
  /// Default is byte-aligned.
  constexpr Align() = default;
  /// Do not perform checks in case of copy/move construct/assign, because the
  /// checks have been performed when building `Other`.
  constexpr Align(const Align &Other) = default;
  constexpr Align(Align &&Other) = default;
  constexpr Align &operator=(const Align &Other) = default;
  constexpr Align &operator=(Align &&Other) = default;

  explicit Align(uint64_t Value) {
    assert(Value > 0 && "Value must not be 0");
    assert(llvm::isPowerOf2_64(Value) && "Alignment is not a power of 2");
    ShiftValue = Log2_64(Value);
    assert(ShiftValue < 64 && "Broken invariant");
  }

  /// Returns an alignment of `1 << Log2Value` bytes.
  constexpr static Align fromLog2(unsigned Log2Value) {
    assert(Log2Value < 64 && "Alignment exponent is too large");
    Align Out;
    Out.ShiftValue = Log2Value;
    return Out;
  }

  /// This is a hole in the type system and should not be abused.
  /// Needed to interact with C for instance.
  constexpr uint64_t value() const { return uint64_t(1) << ShiftValue; }

  // Returns the previous alignment.
  Align previous() const {
    assert(ShiftValue != 0 && "Undefined operation");
    Align Out;
    Out.ShiftValue = ShiftValue - 1;
    return Out;
  }

  /// Allow constructions of constexpr Align.
  template <size_t kValue> constexpr static Align Constant() {
    return fromLog2(ConstantLog2<kValue>());
  }

  /// Allow constructions of constexpr Align from types.
  /// Compile time equivalent to Align(alignof(T)).
  template <typename T> constexpr static Align Of() {
    return Constant<std::alignment_of_v<T>>();
  }
};
```

:::

## 前提知識

- **`struct` と `private` / `public`**: `struct` はデータと関数をまとめた型です。`private:` の下はその型の中からしか触れず、`public:` の下は誰でも使えます。
- **`friend`**: 指定した関数や型に、`private` な中身へのアクセスを特別に許します。
- **コンストラクタ**: 型の値を作るときに呼ばれる関数で、型と同じ名前です。`= default` は「コンパイラ任せの標準の動作でよい」という意味です。
- **`explicit`**: 暗黙の型変換を禁止します。`Align A = 8;` とは書けず、`Align A(8);` と明示する必要があります。
- **コピーとムーブ**: `Align(const Align &Other)` はコピー、`Align(Align &&Other)` はムーブ（中身の引っ越し）のコンストラクタです。
- **`constexpr static`**: コンパイル時にも呼べる、型に属する関数です。`Align::fromLog2(3)` のように呼びます。
- **テンプレート関数 `template <size_t kValue>`**: 値をテンプレート引数として受け取ります。`Align::Constant<16>()` のように書きます。
- **`std::alignment_of_v<T>`**: 型 `T` のアラインメント（`alignof(T)` と同じ）です。

## 何をしているか

### 1. 中身は 1 バイトだけ

```cpp:line-numbers=41
  uint8_t ShiftValue = 0; /// 要求されるアラインメントの log2。
```

`uint8_t ShiftValue` が唯一のデータです。初期値 0 は「2^0 = 1 バイト境界」、つまりアラインメント無しを意味します。

```cpp:line-numbers=56
  /// 既定は 1 バイト境界。
  constexpr Align() = default;
```

### 2. 作るときに必ず検査する

```cpp:line-numbers=65
  explicit Align(uint64_t Value) {
    assert(Value > 0 && "Value must not be 0");
    assert(llvm::isPowerOf2_64(Value) && "Alignment is not a power of 2");
    ShiftValue = Log2_64(Value);
    assert(ShiftValue < 64 && "Broken invariant");
  }
```

`Align(16)` と書くと、まず 0 でないこと、次に 2 の累乗であることを `assert` で確かめてから、`Log2_64(16) = 4` を保存します。`Align(12)` はデバッグビルドで即座に止まります。

### 3. コピーでは検査しない

```cpp:line-numbers=58
  /// コピー／ムーブによる構築・代入では検査しない。
  /// `Other` を作ったときに検査済みだから。
  constexpr Align(const Align &Other) = default;
  constexpr Align(Align &&Other) = default;
  constexpr Align &operator=(const Align &Other) = default;
  constexpr Align &operator=(Align &&Other) = default;
```

コメントにあるように、コピー元の `Align` は作られたときに検査済みです。だから、コピーやムーブでは何もせずに中身を写すだけにしています。

### 4. 値は必要なときにシフトで復元

```cpp:line-numbers=82
  constexpr uint64_t value() const { return uint64_t(1) << ShiftValue; }
```

`value()` は `1 << ShiftValue` を返します。`ShiftValue = 4` なら 16 です。コメントは「型システムの穴なので乱用しないこと」と注意しています。生の数に戻すと、また何でも入る世界に戻ってしまうからです。

### 5. コンパイル時に作る手段

```cpp:line-numbers=73
  constexpr static Align fromLog2(unsigned Log2Value) {
    assert(Log2Value < 64 && "Alignment exponent is too large");
    Align Out;
    Out.ShiftValue = Log2Value;
    return Out;
  }

  /// これは型システムの抜け穴なので、乱用しないこと。
  /// たとえば C とやり取りするのに必要。
  constexpr uint64_t value() const { return uint64_t(1) << ShiftValue; }

  // 1 つ前（半分）のアラインメントを返す。
  Align previous() const {
    assert(ShiftValue != 0 && "Undefined operation");
    Align Out;
    Out.ShiftValue = ShiftValue - 1;
    return Out;
  }

  /// constexpr な Align を作れるようにする。
  template <size_t kValue> constexpr static Align Constant() {
    return fromLog2(ConstantLog2<kValue>());
  }

  /// 型から constexpr な Align を作れるようにする。
  /// Align(alignof(T)) のコンパイル時版。
  template <typename T> constexpr static Align Of() {
    return Constant<std::alignment_of_v<T>>();
  }
```

- `fromLog2(4)` は指数から直接作ります。
- `Constant<16>()` は 16 の log2 を**コンパイル時に**計算します。`ConstantLog2` の中の `static_assert` で、2 の累乗でなければコンパイルエラーです。
- `Of<double>()` は、`double` 型のアラインメントから作ります。

## ここがすごい

アラインメントを `uint64_t` などの生の整数で持つと、次のような問題が起きます。

- **0 や 3 が紛れ込む**: どこかで計算を間違えると、ありえない値が流れていき、遠く離れた場所で壊れます。
- **8 バイトも使う**: 実際に使う値は 64 通りしかないのに、場所を取ります。

`Align` は、

- **作る入口を絞る**（`explicit` コンストラクタで検査、`fromLog2` は範囲チェック付き）ことで、存在する `Align` はすべて正しい、という保証を型に持たせ、
- **log2 で 1 バイトに詰める**ことで、コンパイラの内部データ（命令ごと、変数ごとに持つ）を小さく保ち、
- **比較は 1 バイトの比較で済む**（`friend` 演算子が `ShiftValue` を直接比べる）

ようにしています。

すぐ下には「未指定かもしれない」アラインメントを表す `MaybeAlign` もあり、「必ずある」と「無いかもしれない」を型で区別しています。数値を意味のある型で包む、という設計の手本です。

## まとめ

- 値の種類が限られるなら、生の整数ではなく専用の型で包むと誤りを防げる。
- 検査を作る時に集中させれば、コピーやムーブでは検査を省ける。
- 2 の累乗は log2 で持つと小さく、比較やシフトも速い。
- `explicit` で暗黙の変換を禁じると、うっかり生の数が入り込まない。
