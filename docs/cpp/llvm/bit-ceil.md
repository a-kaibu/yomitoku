---
title: 「1 引いてからビット幅」で、ちょうどいい 2 のべき乗に切り上げる
description: bit_floor は値以下で最大の 2 のべき乗を、bit_ceil は値以上で最小の 2 のべき乗を返します。どちらも bit_width（何ビットで表せるか）とシフト 1 回で求めます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/bit.h
lines: [343, 368]
function: llvm::bit_floor / llvm::bit_ceil
difficulty: 1
format: 2
tags: [ビット演算, 標準ライブラリ, 数値計算]
---

## ひとことで

- `bit_floor(5)` は 4。**5 以下で最大の 2 のべき乗** です。
- `bit_ceil(5)` は 8。**5 以上で最小の 2 のべき乗** です。

ハッシュ表の大きさを 2 のべき乗にそろえるときなどに使います。どちらも、ループを使わず「何ビットで表せるか」から一発で計算します。

## コード

::: code-group

```cpp:line-numbers=343 [日本語訳]
/// Value が 0 でなければ、Value 以下で最大の 2 のべき乗を返す。
/// 0 なら 0 を返す。
///
/// 例: bit_floor(5) == 4。
template <typename T> [[nodiscard]] T bit_floor(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (!Value)
    return 0;
  return T(1) << (llvm::bit_width(Value) - 1);
}

/// Value が 0 でなければ、Value 以上で最小の 2 のべき乗を返す。
/// それ以外なら 1 を返す。
///
/// 例: bit_ceil(5) == 8。
///
/// T で表せる最大の 2 のべき乗より大きい入力に対しては、
/// 戻り値は未定義になる。
template <typename T> [[nodiscard]] T bit_ceil(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (Value < 2)
    return 1;
  return T(1) << llvm::bit_width<T>(Value - 1u);
}
```

```cpp:line-numbers=343 [原文]
/// Returns the largest integral power of two no greater than Value if Value is
/// nonzero.  Returns 0 otherwise.
///
/// Ex. bit_floor(5) == 4.
template <typename T> [[nodiscard]] T bit_floor(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (!Value)
    return 0;
  return T(1) << (llvm::bit_width(Value) - 1);
}

/// Returns the smallest integral power of two no smaller than Value if Value is
/// nonzero.  Returns 1 otherwise.
///
/// Ex. bit_ceil(5) == 8.
///
/// The return value is undefined if the input is larger than the largest power
/// of two representable in T.
template <typename T> [[nodiscard]] T bit_ceil(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (Value < 2)
    return 1;
  return T(1) << llvm::bit_width<T>(Value - 1u);
}
```

:::

## 前提知識

- **2 のべき乗**: 1, 2, 4, 8, 16… のように 2 を何回か掛けた数です。2 進数では `1` が 1 個だけの数（`100`, `1000` など）になります。
- **`T(1) << n`**: 型 `T` の 1 を `n` ビット左へずらします。結果は 2 の `n` 乗です。
- **`bit_width(x)`**: `x` を 2 進数で書くのに必要な桁数です。`5`（`101`）なら 3、`8`（`1000`）なら 4、`0` なら 0 です。
- **`template <typename T>` と `static_assert`**: どの符号なし整数型でも使え、符号付きの型を渡すとコンパイルエラーになります。
- **`1u`**: 符号なしの 1 です。
- **`[[nodiscard]]`**: 戻り値を捨てると警告が出る印です。

## 何をしているか

### 1. bit_floor

```cpp:line-numbers=347
template <typename T> [[nodiscard]] T bit_floor(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (!Value)
    return 0;
  return T(1) << (llvm::bit_width(Value) - 1);
}
```

最上位の 1 だけを残せば、それが「以下で最大の 2 のべき乗」です。最上位の 1 の位置は `bit_width(Value) - 1` です。

- `Value = 5`（`101`）: `bit_width` は 3 → `1 << 2` = **4**
- `Value = 8`（`1000`）: `bit_width` は 4 → `1 << 3` = **8**（8 自身が 2 のべき乗）
- `Value = 0`: 該当する 2 のべき乗がないので 0

### 2. bit_ceil

```cpp:line-numbers=362
template <typename T> [[nodiscard]] T bit_ceil(T Value) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (Value < 2)
    return 1;
  return T(1) << llvm::bit_width<T>(Value - 1u);
}
```

ここが工夫のある部分です。`1 << bit_width(Value)` だと、`Value = 8` のとき 16 になってしまいます。8 はすでに 2 のべき乗なので、答えは 8 であるべきです。

そこで **先に 1 引いてから** ビット幅を測ります。

- `Value = 5`: `5 - 1 = 4`（`100`）→ `bit_width` は 3 → `1 << 3` = **8**
- `Value = 8`: `8 - 1 = 7`（`111`）→ `bit_width` は 3 → `1 << 3` = **8**
- `Value = 9`: `9 - 1 = 8`（`1000`）→ `bit_width` は 4 → `1 << 4` = **16**

1 引くと、ちょうど 2 のべき乗だった値だけ桁が 1 つ下がります。それ以外は桁が変わりません。この差を利用しています。

### 3. 小さい値の扱い

```cpp:line-numbers=365
  if (Value < 2)
    return 1;
```

`Value` が 0 か 1 なら 1 を返します。0 のとき `0 - 1` は巻き戻って最大値になり、結果がおかしくなるので先に除いています。

## ここがすごい

- **ループなしで求まる**: 素直に書くと「1 から始めて 2 倍し続け、`Value` 以上になったら止める」ループになります。ここでは `bit_width`（内部で CPU の先頭 0 カウント命令を使える）とシフト 1 回で済みます。
- **「1 引く」で境界の場合分けを消す**: ちょうど 2 のべき乗かどうかを `if` で調べなくても、1 引くだけで正しい答えになります。
- **限界を正直に書く**: 関数の前のコメントで、`T` で表せる最大の 2 のべき乗より大きい値を渡すと結果が未定義になることを明記しています。
- **標準と同じ名前**: C++20 の `std::bit_floor` / `std::bit_ceil` と同じ名前・意味にしているので、新しい規格へ移るときに置き換えやすくなっています。

## まとめ

- 2 のべき乗への切り下げは「最上位の 1 だけ残す」こと。
- 切り上げは「1 引いてから桁数を測る」と、ちょうど 2 のべき乗の場合も正しく扱える。
- 0 や 1 のような端の値は、計算の前に除いておくと安全。
- 標準ライブラリと同じ名前で用意しておくと、将来の移行が楽になる。

