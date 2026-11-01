---
title: 「N 桁を書く」関数を、小さな関数の組み合わせで 1 桁から 10 桁まで積み上げる
description: to_chars の 10 進出力を支える __append1〜__append10。2 桁ずつの表引きを土台に、上半分と下半分に割って既存の関数を呼ぶだけで、10 種類の桁数を少ない割り算で書き出す。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_base_10.h
lines: [31, 72]
function: std::__itoa::__append1 〜 __append10
difficulty: 2
format: 2
tags: [文字列処理, 再帰, 最適化]
---
## ひとことで

`__appendN` は、**ちょうど N 桁** の数を 10 進の文字として書き込む関数の集まりです。
たとえば `__append4(p, 42)` は `"0042"` を書きます（必ず 4 桁）。
`__append10` までの 10 個が、互いを呼び合う形で組み立てられています。

## コード

```cpp:line-numbers=31
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append1(char* __first, uint32_t __value) _NOEXCEPT {
  *__first = '0' + static_cast<char>(__value);
  return __first + 1;
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append2(char* __first, uint32_t __value) _NOEXCEPT {
  return std::copy_n(&__digits_base_10[__value * 2], 2, __first);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append3(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append2(__itoa::__append1(__first, __value / 100), __value % 100);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append4(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append2(__itoa::__append2(__first, __value / 100), __value % 100);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append5(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append4(__itoa::__append1(__first, __value / 10000), __value % 10000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append6(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append4(__itoa::__append2(__first, __value / 10000), __value % 10000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append7(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append6(__itoa::__append1(__first, __value / 1000000), __value % 1000000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append8(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append6(__itoa::__append2(__first, __value / 1000000), __value % 1000000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append9(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append8(__itoa::__append1(__first, __value / 100000000), __value % 100000000);
}

template <class _Tp>
_LIBCPP_CONSTEXPR_SINCE_CXX23 char* __append10(char* __first, _Tp __value) _NOEXCEPT {
  return __itoa::__append8(__itoa::__append2(__first, static_cast<uint32_t>(__value / 100000000)),
                           static_cast<uint32_t>(__value % 100000000));
}
```

## 前提知識

- **`char* __first`**: 書き込み先の位置を指すポインタです。どの関数も、書き終えた次の位置を返します。だから `__append2(__append1(p, ...), ...)` のように **入れ子で呼ぶと、続けて書ける** のです。
- **`*__first = ...`**: ポインタが指す場所に値を書き込みます。
- **`static_cast<char>(...)`**: 型変換です。数値を `char` 型にします。
- **`'0' + 数値`**: `'0'` の文字コードに 0〜9 を足すと、`'0'`〜`'9'` の文字になります。
- **`std::copy_n(src, n, dst)`**: `src` から `n` 個の要素を `dst` にコピーし、コピー先の終わりの位置を返します。
- **`&__digits_base_10[__value * 2]`**: `__digits_base_10` は `"00" "01" "02" ... "99"` の 200 文字を並べた表です。`&` で「その要素の位置」を取ります。
- **`template <class _Tp>`**: `__append10` だけはテンプレートです。10 桁の数は 32 ビットに収まらない（最大 9999999999）ので、64 ビットの値でも受け取れるようにしています。

## 何をしているか

### 1. 土台は 1 桁と 2 桁

```cpp:line-numbers=31
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append1(char* __first, uint32_t __value) _NOEXCEPT {
  *__first = '0' + static_cast<char>(__value);
  return __first + 1;
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append2(char* __first, uint32_t __value) _NOEXCEPT {
  return std::copy_n(&__digits_base_10[__value * 2], 2, __first);
}
```

`__append1` は `'0' + 値` を 1 文字書きます。
`__append2` は表から 2 文字をコピーします。値が `42` なら、表の 84 番目と 85 番目（0 から数えて）の `'4' '2'` です。割り算なしで 2 桁を書けます。

### 2. 上下に割って組み合わせる

```cpp:line-numbers=40
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append3(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append2(__itoa::__append1(__first, __value / 100), __value % 100);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append4(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append2(__itoa::__append2(__first, __value / 100), __value % 100);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append5(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append4(__itoa::__append1(__first, __value / 10000), __value % 10000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append6(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append4(__itoa::__append2(__first, __value / 10000), __value % 10000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append7(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append6(__itoa::__append1(__first, __value / 1000000), __value % 1000000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append8(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append6(__itoa::__append2(__first, __value / 1000000), __value % 1000000);
}

_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __append9(char* __first, uint32_t __value) _NOEXCEPT {
  return __itoa::__append8(__itoa::__append1(__first, __value / 100000000), __value % 100000000);
}
```

残りはすべて「上の部分」と「下の部分」に割り、既存の関数を呼ぶだけです。

| 関数 | 上の部分 | 下の部分 |
| --- | --- | --- |
| `__append3` | `/ 100` を 1 桁 | `% 100` を 2 桁 |
| `__append4` | `/ 100` を 2 桁 | `% 100` を 2 桁 |
| `__append5` | `/ 10000` を 1 桁 | `% 10000` を 4 桁 |
| `__append6` | `/ 10000` を 2 桁 | `% 10000` を 4 桁 |
| `__append7` | `/ 1000000` を 1 桁 | 6 桁 |
| `__append8` | `/ 1000000` を 2 桁 | 6 桁 |
| `__append9` | `/ 100000000` を 1 桁 | 8 桁 |

`__append5(p, 12345)` を追います。

```
__append5(p, 12345)
  → __append1(p, 1)            '1' を書く
  → __append4(p+1, 2345)
      → __append2(p+1, 23)      "23" を書く
      → __append2(p+3, 45)      "45" を書く
```

結果は `"12345"` です。下の部分は「必ず N 桁」なので、`__append4(..., 7)` なら `"0007"` と 0 埋めされます。これが正しいのは、上の部分がすでに書かれているからです。

### 3. 10 桁は型に注意

```cpp:line-numbers=68
template <class _Tp>
_LIBCPP_CONSTEXPR_SINCE_CXX23 char* __append10(char* __first, _Tp __value) _NOEXCEPT {
  return __itoa::__append8(__itoa::__append2(__first, static_cast<uint32_t>(__value / 100000000)),
                           static_cast<uint32_t>(__value % 100000000));
}
```

`__append10` は `/ 100000000` で上の 2 桁と下の 8 桁に割ります。割った結果はどちらも 32 ビットに収まるので、`static_cast<uint32_t>` で 32 ビットに落としてから渡しています。

## ここがすごい

- **割り算の回数が少ない**: 1 桁ずつ `% 10` と `/ 10` を繰り返すと、10 桁で 10 回ずつ必要です。2 桁の表を使い、大きく割ってから小さく割る形にすると、割り算の回数をおよそ半分に減らせます。しかも割る数は定数なので、コンパイラは割り算を掛け算とシフトに置き換えられます。
- **小さな部品の組み合わせ**: どの関数も 1 行です。新しい桁数に対応したければ、既存の 2 つを組み合わせるだけです。正しさも「部品が正しければ全体も正しい」と確かめやすくなります。
- **戻り値をつなげる設計**: 「書いた次の位置を返す」という約束を全関数で守っているので、`f(g(p, a), b)` という入れ子だけで連続書き込みができます。位置を数える変数が要りません。
- **`inline` で一体化**: 全部 `inline` の小さな関数なので、呼び出しはコンパイル時に展開され、最終的には関数呼び出しのない一続きの命令になることが期待できます。

## まとめ

- 2 桁ぶんの文字を表にしておくと、割り算の回数を減らせる。
- 「上の部分と下の部分に割って、それぞれ書く」を積み重ねれば、どの桁数にも対応できる。
- 下の部分を 0 埋めの固定長で書くと、上下を連結するだけで正しい文字列になる。
- 「書き終えた位置を返す」約束にすると、関数を入れ子にするだけで続けて書ける。
