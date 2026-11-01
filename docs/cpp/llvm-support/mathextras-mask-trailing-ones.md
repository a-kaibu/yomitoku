---
title: 「全部 1」を右にずらすだけで下位 N ビットのマスクを作る
description: 下位 N ビットだけが 1 の値を作る LLVM のテンプレート関数。1 << N - 1 と書かずに、全ビット 1 の値を右シフトして作る理由を読み解く。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [76, 85]
function: llvm::maskTrailingOnes
difficulty: 1
tags: [ビット演算, 防御的プログラミング, 型システム]
format: 2
---

## ひとことで

`maskTrailingOnes<T>(N)` は、**右端（下位）の N ビットだけが 1** で、残りが 0 の値を作る関数です。
たとえば `maskTrailingOnes<uint8_t>(3)` は 2 進数で `00000111`、つまり `7` を返します。

ビット演算でよく使う「マスク」（必要な桁だけを取り出すための値）を、どの整数型でも安全に作れるようにしたものです。

## コード

::: code-group

```cpp:line-numbers=76 [日本語訳]
/// 右端の N ビットが 1 で、それ以外がすべて 0 のビットマスクを作る。
/// 符号なし型だけを受け付ける。
template <typename T> constexpr T maskTrailingOnes(unsigned N) {
  static_assert(std::is_unsigned_v<T>, "Invalid type!");
  const unsigned Bits = CHAR_BIT * sizeof(T);
  assert(N <= Bits && "Invalid bit index");
  if (N == 0)
    return 0;
  return T(-1) >> (Bits - N);
}
```

```cpp:line-numbers=76 [原文]
/// Create a bitmask with the N right-most bits set to 1, and all other
/// bits set to 0.  Only unsigned types are allowed.
template <typename T> constexpr T maskTrailingOnes(unsigned N) {
  static_assert(std::is_unsigned_v<T>, "Invalid type!");
  const unsigned Bits = CHAR_BIT * sizeof(T);
  assert(N <= Bits && "Invalid bit index");
  if (N == 0)
    return 0;
  return T(-1) >> (Bits - N);
}
```

:::

## 前提知識

- **テンプレート `template <typename T>`**: 型を引数にとる関数の書き方です。`maskTrailingOnes<uint32_t>(5)` のように `<>` の中に型を書いて呼ぶと、その型用の関数がコンパイル時に作られます。
- **`constexpr`**: コンパイル時にも計算できる関数であることを示します。定数の初期化などに使えます。
- **`static_assert`**: コンパイル時のチェックです。条件が偽ならコンパイルエラーになります。実行時のコストはゼロです。
- **`assert`**: 実行時のチェックです。デバッグビルドで条件が偽ならプログラムを止めます。リリースビルドでは消えます。
- **`sizeof(T)` と `CHAR_BIT`**: `sizeof(T)` は型 `T` のバイト数、`CHAR_BIT` は 1 バイトのビット数（ほぼ常に 8）です。掛けると型のビット数になります。
- **`T(-1)`**: `-1` を符号なし型 `T` に変換すると、**すべてのビットが 1** の値になります。符号なし整数は「2 の N 乗で一周する」ルールで変換されるためです。
- **`>>`（右シフト）**: ビット列を右にずらします。符号なし型では左から 0 が入ってきます。

## 何をしているか

### 1. 型と引数のチェック

```cpp:line-numbers=79
  static_assert(std::is_unsigned_v<T>, "Invalid type!");
  const unsigned Bits = CHAR_BIT * sizeof(T);
  assert(N <= Bits && "Invalid bit index");
```

`static_assert` で、`T` が符号なし整数型でなければコンパイルを止めます。符号付き型だと右シフトで左から 1 が入る（算術シフト）ことがあり、マスクが壊れるからです。
次に型のビット数 `Bits` を求め、`assert` で `N` がそれを超えていないか確かめます。

### 2. N が 0 のときは特別扱い

```cpp:line-numbers=82
  if (N == 0)
    return 0;
```

`N == 0` なら 0 を返します。理由は次の行を見るとわかります。

### 3. 全部 1 を右にずらす

```cpp:line-numbers=84
  return T(-1) >> (Bits - N);
```

`uint8_t` で `N = 3` の場合を追ってみます。

```
T(-1)            = 11111111
Bits - N         = 8 - 3 = 5
11111111 >> 5    = 00000111   ← 下位 3 ビットだけ 1
```

「全部 1」から始めて、要らないぶん（`Bits - N` 個）を右から押し出すと、ちょうど N 個の 1 が残ります。

`N = 0` だと `Bits - N` は 8 になり、「型のビット数ぶんのシフト」になってしまいます。C++ ではシフト量が型の幅以上だと**未定義動作**（何が起きても文句が言えない状態）です。だから `if (N == 0)` で先に逃がしているのです。

## ここがすごい

よくある書き方は `(1 << N) - 1` です。しかしこれには落とし穴があります。

- `N` が型の幅と同じ（`uint32_t` で `N = 32`）だと `1 << 32` が未定義動作になります。全ビット 1 のマスクがほしいだけなのに作れません。
- `1` はふつう `int` 型なので、`uint64_t` 用に `N = 40` を渡すと `int` の幅を超えて壊れます。

この関数は「全部 1 から削る」向きで考えることで、`N = Bits` のとき**シフト量が 0** になり、全ビット 1 が素直に返ります。危ないのは `N = 0` の 1 か所だけで、そこは `if` で明示的に処理しています。

さらに、テンプレートにして `T(-1)` から始めるので、`uint8_t` でも `uint64_t` でも同じ 1 行で正しい幅のマスクが作れます。
すぐ下にある `maskLeadingOnes` などの兄弟関数は、この関数と `~`（ビット反転）を組み合わせて作られていて、土台の 1 本をしっかり作る設計になっています。

## まとめ

- 「下位 N ビットのマスク」は `(1 << N) - 1` よりも「全部 1 を右シフト」のほうが端の値に強い。
- シフト量が型の幅以上になると未定義動作なので、境界の値を個別に処理する。
- `static_assert` で型の誤用をコンパイル時に防げる。
- 符号なし型の `T(-1)` は「全ビット 1」を型の幅に合わせて作る定番イディオム。
