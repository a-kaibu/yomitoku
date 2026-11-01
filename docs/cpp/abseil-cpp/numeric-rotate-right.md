---
title: 負の回転量を「& (n-1)」ひとつで吸収するビット回転
description: 整数のビットを右に回転させる RotateRight。負の回転量も、ビット幅を超える回転量も、AND 1 回で正しい右回転に変換してしまう。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2020 The Abseil Authors
file: absl/numeric/internal/bits.h
lines: [73, 102]
function: numeric_internal::RotateRight
difficulty: 2
tags: [ビット演算, 移植性, 防御的プログラミング]
---

## ひとことで

`RotateRight` は、整数のビット列を右に「回転」させる関数です。回転とは、右端からあふれたビットを左端に戻すシフトのことです。
たとえば 8 ビットの `10010110` を右に 3 回転すると、右端の `110` が左端に回って `11010010` になります。

この関数は、回転量 `s` が負（＝左回転の意味）でも、ビット幅より大きくても、`s & (n - 1)` という 1 回の AND で正しい回転量に直してしまいます。

## コード

::: code-group

```cpp:line-numbers=73 [日本語訳]
template <class T>
[[nodiscard]] ABSL_ATTRIBUTE_ALWAYS_INLINE constexpr T RotateRight(
    T x, int s) noexcept {
  static_assert(std::is_unsigned_v<T>, "T must be unsigned");
  static_assert(IsPowerOf2(std::numeric_limits<T>::digits),
                "T must have a power-of-2 size");

  // 不要な回転を避けるため、s をビット数で割った余りだけ回転する。
  //
  // 負の s は、右回転ではなく左回転を表す。
  // ここでは 2 の補数表現を利用して、同じ結果になる
  // 反対向きの右回転として計算する。
  //
  // たとえば 3 ビットの数を -2 回転させるとする。
  // その場合:
  //   * s = 0b11111111111111111111111111111110
  //   * n = 8
  //   * r = (0b11111111111111111111111111111110 & 0b111) = 0b110
  //
  // 左に 2 回転する代わりに、右に 6 回転する。これは
  // 同じ結果になる。
  const int n = std::numeric_limits<T>::digits;
  const int r = s & (n - 1);

  if (r == 0) {
    return x;
  } else {
    return (x >> r) | (x << (n - r));
  }
}
```

```cpp:line-numbers=73 [原文]
template <class T>
[[nodiscard]] ABSL_ATTRIBUTE_ALWAYS_INLINE constexpr T RotateRight(
    T x, int s) noexcept {
  static_assert(std::is_unsigned_v<T>, "T must be unsigned");
  static_assert(IsPowerOf2(std::numeric_limits<T>::digits),
                "T must have a power-of-2 size");

  // Rotate by s mod the number of digits to avoid unnecessary rotations.
  //
  // A negative s represents a left rotation instead of a right rotation.
  // We compute it as an equivalent complementary right rotation by leveraging
  // its two's complement representation.
  //
  // For example, suppose we rotate a 3-bit number by -2.
  // In that case:
  //   * s = 0b11111111111111111111111111111110
  //   * n = 8
  //   * r = (0b11111111111111111111111111111110 & 0b111) = 0b110
  //
  // Instead of rotating by 2 to the left, we rotate by 6 to the right, which
  // is equivalent.
  const int n = std::numeric_limits<T>::digits;
  const int r = s & (n - 1);

  if (r == 0) {
    return x;
  } else {
    return (x >> r) | (x << (n - r));
  }
}
```

:::

## 前提知識

- **`template <class T>`**: 型を引数にとる「テンプレート」です。`T` に `uint8_t` や `uint64_t` を入れると、それぞれの型専用の関数がコンパイル時に作られます。
- **`static_assert(条件, "メッセージ")`**: コンパイル時に条件を確認し、偽ならコンパイルエラーにします。実行時のコストはゼロです。
- **`std::is_unsigned_v<T>`**: `T` が符号なし整数型なら `true` になる定数です。
- **`std::numeric_limits<T>::digits`**: 型 `T` の値を表すビット数です。符号なし型なら `uint8_t` は 8、`uint32_t` は 32 です。
- **`constexpr`**: コンパイル時にも計算できる関数であることを示します。定数を作る式の中でも呼べます。
- **`noexcept`**: 例外を投げないという約束です。
- **`[[nodiscard]]`**: 戻り値を捨てたら警告を出してもらう印です。回転結果を使い忘れるミスを防ぎます。
- **`>>` と `<<`**: ビットを右・左にずらす演算子です。C++ では、ビット幅以上の量でシフトすると **未定義動作**（何が起きても文句を言えない状態）になります。

## 何をしているか

### 1. 型のチェック

```cpp:line-numbers=76
  static_assert(std::is_unsigned_v<T>, "T must be unsigned");
  static_assert(IsPowerOf2(std::numeric_limits<T>::digits),
                "T must have a power-of-2 size");
```

`T` が符号なしであること、そしてビット数が 2 のべき乗であることをコンパイル時に確かめます。
2 のべき乗であることは、後で使う `& (n - 1)` のトリックの前提条件です。

### 2. 回転量を 0〜n-1 に正規化

```cpp:line-numbers=94
  const int n = std::numeric_limits<T>::digits;
  const int r = s & (n - 1);
```

`n` はビット数、`r = s & (n - 1)` が実際の回転量です。
`n` が 2 のべき乗なら、`n - 1` は下位ビットがすべて 1 のマスクになります。8 ビットなら `n - 1 = 7 = 0b111` です。
AND をとると下位 3 ビットだけが残るので、これは「`s` を 8 で割った余り」と同じ意味になります。

- `s = 3` なら `r = 3`
- `s = 11` なら `11 = 0b1011` で `r = 3`（11 回転は 3 回転と同じ）
- `s = -2` なら、2 の補数表現で `...11111110` なので `r = 0b110 = 6`

最後の例が肝心です。左に 2 回転することは、8 ビットでは右に 6 回転することと同じです。関数の中の長いコメントも、この点を説明しています。

### 3. 回転本体

```cpp:line-numbers=97
  if (r == 0) {
    return x;
  } else {
    return (x >> r) | (x << (n - r));
  }
```

`r == 0` なら何もせずに `x` を返します。
それ以外は `(x >> r) | (x << (n - r))` です。`x = 10010110`、`r = 3` で追うと次のようになります。

```
x >> 3       = 00010010   ← 右にずらす（右端の 110 は消える）
x << 5       = 11000000   ← 消えた 110 を左端に持ってくる
OR           = 11010010
```

## ここがすごい

- **負の数の処理に if がいらない**: 素直に書くと「`s < 0` なら左回転を呼ぶ」「`s % n` をとる」などの分岐や割り算が必要です。2 の補数の性質と 2 のべき乗マスクを組み合わせて、AND 1 回にまとめています。C++ の `%` は負の数に対して負の余りを返すので、`s % n` では負の回転量をうまく扱えない点でも有利です。
- **未定義動作を避ける `r == 0` の分岐**: `r = 0` のまま一般式を使うと `x << n` になります。32 ビットや 64 ビットの型でビット幅ちょうどのシフトをすると未定義動作です。だから 0 だけは特別扱いしています。
- **前提条件をコードで保証する**: `& (n - 1)` が「余り」になるのは `n` が 2 のべき乗のときだけです。その前提を `static_assert` で明文化しているので、仮に 24 ビットの型を渡しても実行時に壊れず、コンパイルの時点で止まります。
- 多くのコンパイラは、この `(x >> r) | (x << (n - r))` という形を CPU の回転命令 1 つに置き換えられます。読みやすい形のまま速さも狙える書き方です。

## まとめ

- `n` が 2 のべき乗なら `s & (n - 1)` は「`s` を `n` で割った余り」で、負の `s` にも使える。
- 左回転 `k` は右回転 `n - k` と同じ。2 の補数がこの変換を自動でやってくれる。
- ビット幅以上のシフトは未定義動作なので、0 の場合を分けて書く。
- アルゴリズムの前提は `static_assert` でコンパイル時に確かめておく。
