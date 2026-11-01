---
title: 負の数は符号なしに直して反転、INT_MIN でも壊れない整数→文字列の入口
description: std::to_chars の 10 進変換の入口 __to_chars_itoa。true_type/false_type で符号の有無を振り分け、負の数は符号なし整数の 2 の補数で絶対値を作る。バッファに余裕があれば桁数計算も省く。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_integral.h
lines: [43, 69]
function: std::__to_chars_itoa
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, 型システム]
---
## ひとことで

`__to_chars_itoa` は、整数を 10 進の文字列にする `std::to_chars` の入口です。
符号付きの版は、負なら `'-'` を書いてから **絶対値を符号なし整数で作り**、符号なしの版に渡します。
符号なしの版は、バッファに収まるかを確かめてから変換します。

## コード

```cpp:line-numbers=43
template <typename _Tp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 __to_chars_result
__to_chars_itoa(char* __first, char* __last, _Tp __value, false_type);

template <typename _Tp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 __to_chars_result
__to_chars_itoa(char* __first, char* __last, _Tp __value, true_type) {
  auto __x = std::__to_unsigned_like(__value);
  if (__value < 0 && __first != __last) {
    *__first++ = '-';
    __x        = std::__complement(__x);
  }

  return std::__to_chars_itoa(__first, __last, __x, false_type());
}

template <typename _Tp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 __to_chars_result
__to_chars_itoa(char* __first, char* __last, _Tp __value, false_type) {
  using __tx  = __itoa::__traits<_Tp>;
  auto __diff = __last - __first;

  if (__tx::digits <= __diff || __tx::__width(__value) <= __diff)
    return {__tx::__convert(__first, __value), errc(0)};
  else
    return {__last, errc::value_too_large};
}
```

## 前提知識

- **関数テンプレートのオーバーロード**: 同じ名前の `__to_chars_itoa` が 2 つあり、4 つ目の引数の型（`true_type` か `false_type`）で呼び分けます。
- **`true_type` / `false_type`**: 「真」「偽」を **型** として表したものです。呼び出し側が `is_signed<_Tp>()` を渡すと、符号付き整数なら `true_type`、符号なしなら `false_type` になり、コンパイル時にどちらの関数を呼ぶかが決まります。これをタグディスパッチと呼びます。
- **前方宣言**: 本体を書かずに「こういう関数がある」とだけ先に宣言しています。符号付き版の中から、後ろで定義する符号なし版を呼ぶためです。
- **`auto __x = std::__to_unsigned_like(__value)`**: 同じ大きさの符号なし整数に変換します。`int` なら `unsigned int` です。
- **`std::__complement(x)`**: 符号なし整数 `x` に対して `~x + 1` を返す内部関数です（ビット反転して 1 を足す＝2 の補数）。
- **`*__first++ = '-'`**: ポインタの指す場所に `'-'` を書き、ポインタを 1 つ進めます。
- **`__to_chars_result`**: 「書き終えた位置」と「エラーコード」の組です。`{位置, errc(0)}` は成功、`errc::value_too_large` はバッファ不足を表します。
- **`using __tx = ...`**: 型に短い別名を付けています。

## 何をしているか

### 1. 符号付きの版

```cpp:line-numbers=47
template <typename _Tp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 __to_chars_result
__to_chars_itoa(char* __first, char* __last, _Tp __value, true_type) {
  auto __x = std::__to_unsigned_like(__value);
  if (__value < 0 && __first != __last) {
    *__first++ = '-';
    __x        = std::__complement(__x);
  }

  return std::__to_chars_itoa(__first, __last, __x, false_type());
}
```

8 ビットの `signed char` で `-128` を変換する場合を考えます（32 ビットの `int` の `-2147483648` でも同じ理屈です）。

- `__to_unsigned_like` で `__x = 128`（`-128` のビット列 `1000 0000` を符号なしで読むと 128）。
- 負で、しかもバッファが空でなければ、
- `'-'` を書いて 1 文字進める。
- `__complement` で `__x = ~128 + 1`。`~1000 0000 = 0111 1111`、これに 1 を足して `1000 0000` = **128**。

`-128` の絶対値 128 は `signed char` では表せません（最大 127）。符号付きのまま `-__value` と書くと桁あふれで未定義動作になります。符号なしの世界で計算すれば、128 を正しく表せます。

### 2. 符号なしの版

```cpp:line-numbers=59
template <typename _Tp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 __to_chars_result
__to_chars_itoa(char* __first, char* __last, _Tp __value, false_type) {
  using __tx  = __itoa::__traits<_Tp>;
  auto __diff = __last - __first;

  if (__tx::digits <= __diff || __tx::__width(__value) <= __diff)
    return {__tx::__convert(__first, __value), errc(0)};
  else
    return {__last, errc::value_too_large};
}
```

`__diff` は残りのバッファの大きさです。

`if` の条件は 2 段構えです。

- `__tx::digits <= __diff`: その型の **最大桁数** が入るなら、値に関係なく収まる。桁数の計算は不要。
- そうでなければ `__tx::__width(__value)` で実際の桁数を計算して比べる。

収まるなら `__tx::__convert` で書き込み、書き終えた位置を返します。収まらないなら `{__last, errc::value_too_large}` を返します。

### バッファが空のとき

`__first == __last` なら、`if` の条件 `__first != __last` が偽なので `'-'` は書かれません。そのまま符号なし版へ進み、`__diff = 0` なので必ず `value_too_large` になります。空のバッファへ書き込む事故が起きません。

## ここがすごい

- **INT_MIN 問題を型で回避**: 「負なら符号を反転」は、最小値で必ず桁あふれします。この関数は先に符号なしへ移ってから反転するので、どの値でも安全です。`__complement` 自体も符号なし整数用に限定されていて（`static_assert` で確認）、使い方を間違えられません。
- **タグディスパッチで分岐をコンパイル時に**: 符号の有無を `if` で調べるのではなく、型で関数を選びます。符号なし整数を変換するとき、負かどうかの判定コードは最初から生成されません。
- **よくある場合を速く**: バッファは十分に大きく用意されることが多いはずです。`||` の左側が真なら右側は評価されないので、その場合は桁数の計算そのものを省けます。
- **2 つの関数で責任を分ける**: 符号の処理と、数字の書き出しを別の関数にしています。符号付き版は「`'-'` を書いて絶対値を渡す」だけに集中できます。

## まとめ

- 最小の負の数の絶対値は、同じ大きさの符号付き整数に収まらない。反転は符号なしで行う。
- `~x + 1`（2 の補数）は、符号なし整数で「マイナス」を計算する方法。
- `true_type` / `false_type` で関数を選ぶと、実行時の分岐を消せる。
- `||` の短絡評価を使えば、安い判定で済む場合に重い計算を省ける。
