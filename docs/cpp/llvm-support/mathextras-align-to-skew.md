---
title: 「ずれ」付きの切り上げ整列を、ずらして整列して戻すだけで解く
description: 「8 の倍数 + 3」のような位置に値を切り上げる alignTo の Skew 版。引いて、普通の整列をして、足し戻す 3 ステップで、符号なし整数の一周まで味方につける。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [508, 528]
function: llvm::alignTo
difficulty: 2
tags: [数値計算, メモリ管理, イディオム]
format: 2
---

## ひとことで

`alignTo(Value, Align, Skew)` は、`Value` 以上で、**`Align` の倍数に `Skew` を足した形**の最小の整数を返します。

関数の上のコメントにある例がわかりやすいです。

- `alignTo(5, 8, 7)` → `7`（8×0+7）
- `alignTo(17, 8, 1)` → `17`（8×2+1）
- `alignTo(321, 255, 42)` → `552`（255×2+42）

「境界から少しずれた位置にそろえたい」ときに使います。たとえばファイル内のデータを、ヘッダの分だけずらした位置で整列させるような場面です。

## コード

::: code-group

```cpp:line-numbers=508 [日本語訳]
/// 0 でない \p Skew が指定されると、戻り値は \p Size 以上で、
/// ある整数 N について \p A * N + \p Skew に等しい最小の整数になる。
/// \p Skew が \p A より大きければ、値は '\p
/// Skew mod \p A' に調整される。\p Align は 0 であってはならない。
///
/// 例:
/// \code
///   alignTo(5, 8, 7) = 7
///   alignTo(17, 8, 1) = 17
///   alignTo(~0LL, 8, 3) = 3
///   alignTo(321, 255, 42) = 552
/// \endcode
///
/// あふれることがある。
template <typename U, typename V, typename W,
          typename T = common_uint<common_uint<U, V>, W>>
constexpr T alignTo(U Value, V Align, W Skew) {
  assert(Align != 0u && "Align can't be 0.");
  Skew %= Align;
  return alignTo(Value - Skew, Align) + Skew;
}
```

```cpp:line-numbers=508 [原文]
/// If non-zero \p Skew is specified, the return value will be a minimal integer
/// that is greater than or equal to \p Size and equal to \p A * N + \p Skew for
/// some integer N. If \p Skew is larger than \p A, its value is adjusted to '\p
/// Skew mod \p A'. \p Align must be non-zero.
///
/// Examples:
/// \code
///   alignTo(5, 8, 7) = 7
///   alignTo(17, 8, 1) = 17
///   alignTo(~0LL, 8, 3) = 3
///   alignTo(321, 255, 42) = 552
/// \endcode
///
/// May overflow.
template <typename U, typename V, typename W,
          typename T = common_uint<common_uint<U, V>, W>>
constexpr T alignTo(U Value, V Align, W Skew) {
  assert(Align != 0u && "Align can't be 0.");
  Skew %= Align;
  return alignTo(Value - Skew, Align) + Skew;
}
```

:::

## 前提知識

- **テンプレート**: `template <typename U, typename V, typename W, ...>` は、3 つの引数の型をそれぞれ自動で受け取る書き方です。
- **`common_uint<A, B>`**: LLVM 内の型の別名で、2 つの型を符号なしにして広いほうにそろえた型です。テンプレートの宣言では 2 回使って、3 つの型をまとめています。
- **`%=`**: `Skew = Skew % Align` の省略形です。
- **オーバーロード**: 同じ名前 `alignTo` で引数の数が違う関数を定義できます。`return` の行の `alignTo(Value - Skew, Align)` は、引数 2 つの普通の版（`Value` 以上の最小の `Align` の倍数を返す）を呼んでいます。
- **符号なし整数の一周**: 符号なし整数で 0 より小さくなると、最大値の側に一周します。逆に最大値を超えると 0 の側に一周します。

## 何をしているか

### 1. Skew を Align 未満にそろえる

```cpp:line-numbers=526
  Skew %= Align;
```

`Skew` が `Align` 以上でも、「`Align` の倍数 + `Skew`」の集合は `Skew % Align` の場合と同じです。たとえば `Align = 8` なら、`Skew = 11` と `Skew = 3` は同じ意味です。まずそろえておきます。

### 2. 引いて、整列して、足し戻す

```cpp:line-numbers=527
  return alignTo(Value - Skew, Align) + Skew;
```

`alignTo(17, 8, 1)` を追います。

```
Value - Skew      = 17 - 1 = 16
alignTo(16, 8)    = 16           ← 16 は 8 の倍数
16 + Skew         = 17
```

`alignTo(321, 255, 42)` では:

```
321 - 42          = 279
alignTo(279, 255) = 510          ← 279 以上の最小の 255 の倍数
510 + 42          = 552
```

「ずれた格子」を一度「ずれていない格子」に戻して普通の整列をし、もう一度ずらすだけです。

### 3. Value が Skew より小さい場合

`alignTo(5, 8, 7)` では `5 - 7` が負になりそうです。64 ビットの符号なしで考えると、`5 - 7` は `2^64 - 2` に一周します。

```
alignTo(2^64 - 2, 8)  = 2^64        → 一周して 0
0 + 7                 = 7
```

途中で 2 回一周しますが、**2^64 を法とする計算として正しい**ので、答えは期待どおり `7` になります。符号なし整数の一周は C++ の規格で決まった動作なので、これは偶然ではなく、安心して頼れる性質です。

## ここがすごい

素直に書くと、

```cpp
// Value 以上で、(x - Skew) が Align で割り切れる最小の x を探す
```

という条件をそのまま式にしようとして、場合分け（`Value < Skew` のときなど）が増えがちです。

この実装は「座標をずらせば既存の問題になる」と考え、引数 2 つの `alignTo` に丸投げしています。新しいロジックは引き算と足し算だけです。`Value < Skew` という一見厄介な場合も、符号なしの一周によって**特別扱いなしで**正しく処理されます。

ただしコメントに「May overflow.」（あふれることがある）とあるように、答えが型に収まらないほど大きい場合はあふれます。万能ではないことも正直にコメントに書かれています。

同じファイルの `alignDown` も同じ「引いて、処理して、足す」の形で書かれていて、一貫した設計になっています。

## まとめ

- 「ずれた格子」の問題は、ずらしを打ち消してから解き、最後に戻すと簡単になる。
- `Skew %= Align` で、意味の同じ入力を 1 つの形にそろえる。
- 符号なし整数の一周は規格で定められた動作で、法を取った計算として利用できる。
- 制約（あふれる可能性）はコメントで明示する。
