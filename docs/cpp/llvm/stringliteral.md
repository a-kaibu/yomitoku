---
title: 文字列リテラルの長さをコンパイル時に確定させる StringLiteral
description: StringLiteral は配列の大きさ N をテンプレートで受け取り、長さを N-1 と決めます。途中に \0 を含む誤用は Clang の enable_if 属性でコンパイルエラーにします。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/StringRef.h
lines: [881, 910]
function: StringLiteral
difficulty: 2
format: 2
tags: [文字列処理, メタプログラミング, API設計]
---

## ひとことで

`StringLiteral` は、`"test"` のような **文字列リテラル専用の StringRef** です。
長さを実行時に `strlen` で数えるのではなく、**配列の大きさから コンパイル時に決める** ので、`constexpr` なグローバル定数の表を、起動時の初期化処理なしで作れます。

## コード

::: code-group

```cpp:line-numbers=881 [日本語訳]
/// 文字列リテラルを包み、長さをコンパイル時に計算した StringRef の
/// グローバルな表を作るための代わりとして使うクラス。
/// グローバルコンストラクタの呼び出しを避けるため、StringLiteral は
/// constexpr の文脈で *だけ* 使うこと。たとえば次のように:
///
/// constexpr StringLiteral S("test");  （使用例）
///
class StringLiteral : public StringRef {
private:
  constexpr StringLiteral(const char *Str, size_t N) : StringRef(Str, N) {}

public:
  template <size_t N>
  constexpr StringLiteral(const char (&Str)[N])
#if defined(__clang__) && __has_attribute(enable_if)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wgcc-compat"
      __attribute((enable_if(__builtin_strlen(Str) == N - 1,
                             "invalid string literal")))
#pragma clang diagnostic pop
#endif
      : StringRef(Str, N - 1) {
  }

  // "foo\0bar" のような文字列のための明示的な構築。
  template <size_t N>
  static constexpr StringLiteral withInnerNUL(const char (&Str)[N]) {
    return StringLiteral(Str, N - 1);
  }
};
```

```cpp:line-numbers=881 [原文]
/// A wrapper around a string literal that serves as a proxy for constructing
/// global tables of StringRefs with the length computed at compile time.
/// In order to avoid the invocation of a global constructor, StringLiteral
/// should *only* be used in a constexpr context, as such:
///
/// constexpr StringLiteral S("test");
///
class StringLiteral : public StringRef {
private:
  constexpr StringLiteral(const char *Str, size_t N) : StringRef(Str, N) {}

public:
  template <size_t N>
  constexpr StringLiteral(const char (&Str)[N])
#if defined(__clang__) && __has_attribute(enable_if)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wgcc-compat"
      __attribute((enable_if(__builtin_strlen(Str) == N - 1,
                             "invalid string literal")))
#pragma clang diagnostic pop
#endif
      : StringRef(Str, N - 1) {
  }

  // Explicit construction for strings like "foo\0bar".
  template <size_t N>
  static constexpr StringLiteral withInnerNUL(const char (&Str)[N]) {
    return StringLiteral(Str, N - 1);
  }
};
```

:::

## 前提知識

- **文字列リテラルの型**: `"test"` の型は `const char[5]` です。見える文字は 4 つですが、末尾に `\0` が自動で付くので配列の大きさは 5 です。
- **配列の参照 `const char (&Str)[N]`**: 配列をポインタに変えずに、大きさ `N` ごと受け取る書き方です。`template <size_t N>` と組み合わせると、`N` がコンパイル時に自動で決まります。
- **継承 `class StringLiteral : public StringRef`**: StringLiteral は StringRef の一種なので、StringRef を受け取る関数にそのまま渡せます。
- **`constexpr` コンストラクタ**: コンパイル時にオブジェクトを作れるコンストラクタです。
- **グローバルコンストラクタ**: グローバル変数を実行時に初期化する処理です。プログラムの起動を遅くし、初期化順の問題も起こします。LLVM はこれを避ける方針です。
- **`#pragma clang diagnostic`**: Clang の警告を一時的に切り替える指示です。

## 何をしているか

### 1. 長さは N - 1

```cpp:line-numbers=893
  template <size_t N>
  constexpr StringLiteral(const char (&Str)[N])
#if defined(__clang__) && __has_attribute(enable_if)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wgcc-compat"
      __attribute((enable_if(__builtin_strlen(Str) == N - 1,
                             "invalid string literal")))
#pragma clang diagnostic pop
#endif
      : StringRef(Str, N - 1) {
  }
```

`StringLiteral S("test");` と書くと、`N` は 5 になり、`StringRef(Str, N - 1)`、つまり長さ 4 の StringRef ができます。
`strlen` を呼ばないので、`constexpr` の中で完結します。クラスの前のコメントにある `constexpr StringLiteral S("test");` という使い方がまさにこれです。

### 2. 途中の `\0` を検出

```cpp:line-numbers=895
#if defined(__clang__) && __has_attribute(enable_if)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wgcc-compat"
      __attribute((enable_if(__builtin_strlen(Str) == N - 1,
                             "invalid string literal")))
#pragma clang diagnostic pop
#endif
```

困るのは `"foo\0bar"` のようなリテラルです。配列の大きさは 8 なので長さ 7 になりますが、C 文字列として見ると `"foo"`（長さ 3）です。どちらの意味か紛らわしくなります。

Clang では `enable_if` 属性で「`__builtin_strlen(Str) == N - 1` のときだけこのコンストラクタを使える」と条件を付けています。
`"foo\0bar"` だと `strlen` は 3、`N - 1` は 7 で一致しないので、**コンパイルエラー（"invalid string literal"）** になります。

この属性は GCC にない Clang 独自のものなので、`#if` で Clang のときだけ有効にし、互換性の警告も `#pragma` で抑えています。

### 3. わざと `\0` を含めたいとき

```cpp:line-numbers=905
  // "foo\0bar" のような文字列のための明示的な構築。
  template <size_t N>
  static constexpr StringLiteral withInnerNUL(const char (&Str)[N]) {
    return StringLiteral(Str, N - 1);
  }
```

本当に `\0` を含むデータを表したいときは、`StringLiteral::withInnerNUL("foo\0bar")` と書きます。
この関数は `private` なコンストラクタを直接使うので、チェックを通らずに長さ 7 の StringLiteral を作れます。

## ここがすごい

- **起動コストゼロの定数表**: `constexpr StringLiteral Names[] = {"add", "sub"};` のような表を作っても、実行時の初期化コードが生まれません。
- **誤用をコンパイル時に止める**: 「長さを配列から決める」方式の弱点（途中の `\0`）を、コンパイラの機能で塞いでいます。実行時のテストでは見落としやすい種類の誤りです。
- **意図した例外には別の名前を用意**: チェックを外す方法を、`withInnerNUL` という目立つ名前の関数として用意しています。読む人にも「ここは意図的」と伝わります。
- **使える環境だけで強化**: Clang 以外ではチェックがなくなるだけで、動き自体は同じです。移植性を損なわずに安全性を足しています。

## まとめ

- テンプレートで配列の参照を受け取ると、大きさをコンパイル時に得られる。
- 文字列リテラルの長さは「配列の大きさ - 1」で求まる（末尾の `\0` の分）。
- 誤用しやすい入力は、コンパイラの拡張機能で弾けることがある。
- 安全チェックを外す手段は、目立つ名前の別 API として用意するとよい。

