---
title: 「下位の 1 を数える」を「反転して下位の 0 を数える」に言い換える
description: std::countr_zero と std::countr_one。ゼロ入力の扱いを組み込み関数の第 2 引数で決め、1 の数え上げはビット反転で 0 の数え上げに帰着させる。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__bit/countr.h
lines: [25, 40]
function: std::countr_zero / std::countr_one
difficulty: 1
format: 2
tags: [ビット演算, 標準ライブラリ, イディオム]
---
## ひとことで

`countr_zero` は、整数を 2 進数で書いたときに **右端（下位）から 0 がいくつ続くか** を返します。`countr_one` は 1 がいくつ続くかを返します。
たとえば `0b0101_1000` なら `countr_zero` は 3、`0b0000_0111` なら `countr_one` は 3 です。
ここでは、片方をもう片方で実装するという、短いけれど学びのある書き方を読みます。

## コード

```cpp:line-numbers=25
template <class _Tp>
[[__nodiscard__]] _LIBCPP_CONSTEXPR int __countr_zero(_Tp __t) _NOEXCEPT {
  return __builtin_ctzg(__t, numeric_limits<_Tp>::digits);
}

#if _LIBCPP_STD_VER >= 20

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr int countr_zero(_Tp __t) noexcept {
  return std::__countr_zero(__t);
}

template <__unsigned_integer _Tp>
[[nodiscard]] constexpr int countr_one(_Tp __t) noexcept {
  return std::countr_zero(static_cast<_Tp>(~__t));
}
```

## 前提知識

- **`template <class _Tp>`**: どんな型でも受け取れるテンプレートです。内部用の `__countr_zero` は制約なしで、ライブラリの内部から幅広く使われます。
- **`template <__unsigned_integer _Tp>`**: 「符号なし整数型だけ」という制約（コンセプト）付きテンプレートです。利用者向けの `countr_zero` はこちらで、`int` を渡すとコンパイルエラーになります。
- **`[[nodiscard]]` / `[[__nodiscard__]]`**: 戻り値を捨てると警告する属性です。アンダースコア付きの綴りは、利用者が `nodiscard` という名前のマクロを定義していても壊れないようにするための書き方です。
- **`std::` と `::`**: `std` は標準ライブラリの名前空間（名前の住所のようなもの）です。`std::__countr_zero` は「`std` の中の `__countr_zero`」という意味です。
- **`__builtin_ctzg(x, fallback)`**: Clang/GCC の組み込み関数です。下位の 0 を数えます。`x` が 0 のときは、第 2 引数 `fallback` の値を返します。
- **`~`**: ビット反転です。0 と 1 を入れ替えます。
- **`static_cast<_Tp>(...)`**: 型変換です。

## 何をしているか

### 1. 内部用の本体

```cpp:line-numbers=25
template <class _Tp>
[[__nodiscard__]] _LIBCPP_CONSTEXPR int __countr_zero(_Tp __t) _NOEXCEPT {
  return __builtin_ctzg(__t, numeric_limits<_Tp>::digits);
}
```

`__builtin_ctzg(__t, numeric_limits<_Tp>::digits)` を呼ぶだけです。

ポイントは第 2 引数です。古い組み込み関数 `__builtin_ctz` は、0 を渡すと **結果が未定義** でした。0 には 1 が 1 つもないので、「最下位の 1 の位置」が決まらないからです。
`__builtin_ctzg` の第 2 引数に型のビット数を渡すと、0 のときはその値を返します。32 ビット型なら「0 が 32 個続く」と答えるわけで、規格の要求する `countr_zero(0) == 32` とぴったり一致します。

### 2. 利用者向けの入口

```cpp:line-numbers=32
template <__unsigned_integer _Tp>
[[nodiscard]] constexpr int countr_zero(_Tp __t) noexcept {
  return std::__countr_zero(__t);
}
```

型を符号なし整数に限定して、内部用の本体へ渡します。

### 3. 1 の数え上げを反転で解く

```cpp:line-numbers=37
template <__unsigned_integer _Tp>
[[nodiscard]] constexpr int countr_one(_Tp __t) noexcept {
  return std::countr_zero(static_cast<_Tp>(~__t));
}
```

`x = 0000 0111` で `countr_one` を追います。

```
x   = 0000 0111
~x  = 1111 1000
countr_zero(~x) = 3
```

下位に続く 1 は、反転すると下位に続く 0 になります。だから `countr_zero(~x)` がそのまま答えです。

`static_cast<_Tp>` が必要なのは、`unsigned char` のような小さな型では `~__t` の計算が `int` に広げられて行われるからです。`int` は符号付きなので、そのままでは「符号なし整数だけ」という `countr_zero` の制約に合わず、コンパイルできません。
元の型に戻すと、0 のときの答えも元の型のビット数になります。たとえば `unsigned char` の `0xFF`（8 ビットすべて 1）を反転すると、元の型では `0x00` です。`countr_zero` は第 2 引数の働きで 8 を返し、「1 が 8 個続く」という正しい答えになります。

## ここがすごい

- **端のケースを組み込み関数に任せる**: 自前で `if (x == 0) return digits;` と書くこともできますが、組み込み関数の引数で済ませると分岐が消え、コンパイラが最適な命令列（x86 の `TZCNT` のように 0 も正しく扱える命令など）を選べます。
- **1 つの実装を使い回す**: `countr_one` 専用の処理を書かず、反転で `countr_zero` に帰着させています。同じファイルの `countl_one`（左から 1 を数える）も、`countl_zero` を使って同じ形で書かれています。正しさを確かめるべき本体が 1 つで済みます。
- **内部用と公開用を分ける**: 内部用 `__countr_zero` は古い言語バージョンからも使えるよう制約を付けず、公開用 `countr_zero` は C++20 のコンセプトで型を厳しく絞っています。

## まとめ

- 「1 を数える」は「反転して 0 を数える」に言い換えられる。
- 0 入力のような境界値は、未定義動作になりやすい。組み込み関数の仕様を確認して扱う。
- 小さな整数型は演算で `int` に広がるので、ビット反転のあとは元の型に戻す。
- 内部用の緩い関数と、公開用の厳しい関数を分けると、ライブラリ内での再利用と利用者の安全を両立できる。
