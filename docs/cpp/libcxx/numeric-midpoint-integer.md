---
title: (a+b)/2 があふれない整数の中点を、符号なし演算で求める
description: C++20 の std::midpoint の整数版。差を符号なし整数で計算し、符号ビットの細工で「a 側への丸め」まで再現する。オーバーフローも分岐もない。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__numeric/midpoint.h
lines: [34, 47]
function: std::midpoint（整数版）
difficulty: 3
format: 2
tags: [数値計算, ビット演算, ハック]
---

## ひとことで

`std::midpoint(a, b)` は、2 つの整数の **真ん中の値** を返す関数です。`midpoint(2, 7)` は `4`、`midpoint(7, 2)` は `5` です。割り切れないときは **`a` に近い方** に丸めます。

素直に `(a + b) / 2` と書くと、`a + b` が整数の上限を超えたときに壊れます（二分探索の有名なバグの原因です）。この実装は、差を **符号なし整数** で計算し、ビットの細工で正しい丸めまで再現します。

## コード

```cpp:line-numbers=34
template <class _Tp>
  requires(is_integral_v<_Tp> && !is_same_v<remove_cv_t<_Tp>, bool>)
[[nodiscard]]
_LIBCPP_HIDE_FROM_ABI constexpr _Tp midpoint(_Tp __a, _Tp __b) noexcept _LIBCPP_DISABLE_UBSAN_UNSIGNED_INTEGER_CHECK {
  using _Up                = make_unsigned_t<_Tp>;
  constexpr _Up __bitshift = numeric_limits<_Up>::digits - 1;

  _Up __diff     = _Up(__b) - _Up(__a);
  _Up __sign_bit = __b < __a;

  _Up __half_diff = (__diff / 2) + (__sign_bit << __bitshift) + (__sign_bit & __diff);

  return __a + __half_diff;
}
```

## 前提知識

- **`requires(...)`**: C++20 の「制約」です。テンプレートを使える型を条件で絞ります。ここでは「整数型で、`bool` ではない」型だけを受け付けます。
- **`make_unsigned_t<_Tp>`**: 同じ大きさの符号なし整数型です。`int` なら `unsigned int` です。
- **符号なし整数の巻き戻り**: 符号なし整数の計算は、範囲を超えると 2^N を法として一周します（32 ビットなら `0 - 1` は `4294967295`）。これは C++ で決められた動作で、未定義動作ではありません。一方、符号付き整数があふれるのは未定義動作です。
- **`numeric_limits<_Up>::digits`**: その型の値を表すビット数です。`unsigned int` なら 32 なので、`__bitshift` は 31 です。
- **`_Up __sign_bit = __b < __a;`**: 比較の結果（`true` / `false`）を整数にすると `1` / `0` になります。
- **`_LIBCPP_DISABLE_UBSAN_UNSIGNED_INTEGER_CHECK`**: 未定義動作を検出する道具（UBSan）には、符号なしの巻き戻りも警告する設定があります。ここでは巻き戻りが意図的なので、その警告を止めています。

## 何をしているか

32 ビットの `int` で追います。

### 1. 差と向きを求める

```cpp:line-numbers=41
  _Up __diff     = _Up(__b) - _Up(__a);
  _Up __sign_bit = __b < __a;
```

`a = 2, b = 7` なら、`__diff = 5`、`__sign_bit = 0` です。
`a = 7, b = 2` なら、`__diff = 2 - 7` が巻き戻って `2^32 - 5` になり、`__sign_bit = 1` です。この値は「-5 を 32 ビットで表したもの」と同じビット列です。

### 2. 差の半分を求める

```cpp:line-numbers=44
  _Up __half_diff = (__diff / 2) + (__sign_bit << __bitshift) + (__sign_bit & __diff);
```

`b >= a` のとき（`__sign_bit = 0`）は、残りの 2 項が 0 なので、ただの `__diff / 2` です。`5 / 2 = 2`（切り捨て、つまり `a` 側に丸め）。

`b < a` のときは、`__diff` は「負の差」のビット列です。符号なしのまま 2 で割ると、いちばん上のビット（符号の位置）が 0 になって正の数になってしまいます。そこで:

- `(__sign_bit << 31)` で、いちばん上のビットを 1 に戻します。これで「負の数を 2 で割った」ビット列になります。
- `(__sign_bit & __diff)` は、差が奇数なら 1 を足します。負の半分を `a` 側（0 側）に丸めるためです。

`a = 7, b = 2` では、`(2^32 - 5) / 2 = 2^31 - 3`、そこに `2^31` を足して `2^32 - 3`、差は奇数なので 1 足して `2^32 - 2`。これは「-2」のビット列です。

### 3. a に足す

```cpp:line-numbers=46
  return __a + __half_diff;
```

`7 + (-2) = 5` です。`2 + 2 = 4` の場合も同様です。

### あふれないことの確認

`a = INT_MIN（-2147483648）, b = INT_MAX（2147483647）` では、`__diff = 2^32 - 1`、`__sign_bit = 0`、`__half_diff = 2^31 - 1` です。`a + __half_diff = -1` で、正しい真ん中（-0.5 を `a` 側に丸めた値）が得られます。`(a + b) / 2` でも結果は -1 ですが、`INT_MAX` と `INT_MAX - 2` のように和が上限を超える組では、素直な式は壊れます。この実装はどの組でも、途中で符号付きのあふれが起きません。

## ここがすごい

- **符号付きのあふれを一切起こさない**: 計算はすべて符号なし整数で行い、一周する性質を積極的に使っています。最後に `_Tp` へ戻すときの値は、必ず `a` と `b` の間に収まります。
- **分岐がない**: `b < a` かどうかで処理を分けず、`__sign_bit` を掛け算の代わりのシフトや AND に使って、1 本の式にまとめています。
- **丸めの向きまで仕様どおり**: C++ の規格は、`midpoint` が割り切れないとき `a` の方へ丸めると決めています。`(__sign_bit & __diff)` の 1 ビットぶんの補正が、その仕様を負の差の場合にも満たしています。
- **素直な代替案との比較**: `a + (b - a) / 2` は有名な書き方ですが、`a` と `b` の符号が違うと `b - a` があふれます。符号なしにすれば差は必ず表せる、というのがこの実装の出発点です。

## まとめ

- `(a + b) / 2` は和があふれる。中点は「`a` + 差の半分」で求め、差は符号なし整数で計算するとあふれない。
- 符号なし整数の巻き戻りは定義された動作で、2 の補数の計算に利用できる。
- 比較結果を 0/1 の整数として使えば、分岐なしで場合分けを式に埋め込める。
- 丸めの向きのような細かい仕様も、1 ビットの補正で満たせる。
