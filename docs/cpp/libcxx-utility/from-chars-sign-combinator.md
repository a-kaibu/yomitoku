---
title: 符号付き整数のパースを「符号を見て、符号なしで読んで、範囲を確かめる」に分解する
description: std::from_chars で符号付き整数を読むための共通部品 __sign_combinator。'-' の有無だけを見て、数字の読み取りは符号なし版の関数に任せ、最後に負の最小値まで正しく受け入れる範囲チェックをする。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/from_chars_integral.h
lines: [38, 68]
function: std::__sign_combinator
difficulty: 3
format: 2
tags: [パース, 関数型, エラー処理]
---
## ひとことで

`__sign_combinator` は、符号付き整数（`int` など）のパースを、**符号なし整数のパース関数を使って** 実現する部品です。
先頭の `'-'` を見て、残りを符号なしとして読み、最後に「その型に収まるか」を確かめます。
`"-128"` を `signed char` に読むような、最小値ぎりぎりのケースも正しく扱えます。

## コード

```cpp:line-numbers=38
template <typename _It, typename _Tp, typename _Fn, typename... _Ts>
inline _LIBCPP_CONSTEXPR_SINCE_CXX23 from_chars_result
__sign_combinator(_It __first, _It __last, _Tp& __value, _Fn __f, _Ts... __args) {
  using __tl = numeric_limits<_Tp>;
  decltype(std::__to_unsigned_like(__value)) __x;

  bool __neg = (__first != __last && *__first == '-');
  auto __r   = __f(__neg ? __first + 1 : __first, __last, __x, __args...);
  switch (__r.ec) {
  case errc::invalid_argument:
    return {__first, __r.ec};
  case errc::result_out_of_range:
    return __r;
  default:
    break;
  }

  if (__neg) {
    if (__x <= std::__complement(std::__to_unsigned_like(__tl::min()))) {
      __value = std::__complement(__x);
      return __r;
    }
  } else {
    if (__x <= std::__to_unsigned_like(__tl::max())) {
      __value = __x;
      return __r;
    }
  }

  return {__r.ptr, errc::result_out_of_range};
}
```

## 前提知識

- **可変長テンプレート `typename... _Ts` と `_Ts... __args`**: 任意の個数の追加引数を受け取れます。10 進用の関数には追加引数なし、2〜36 進用には基数 `__base` を 1 つ渡す、という違いを 1 つの部品で吸収しています。
- **`_Fn __f`**: 関数そのもの（関数ポインタや関数オブジェクト）を引数で受け取っています。「符号なしで読む関数」を外から差し込める作りです。
- **参照 `_Tp& __value`**: 呼び出し側の変数そのものを受け取り、結果を書き込みます。
- **`decltype(式)`**: 式の型を取り出します。コードの `decltype(std::__to_unsigned_like(__value)) __x;` は「`__value` を符号なしにした型」で変数 `__x` を宣言しています。`int` なら `unsigned int` です。
- **`numeric_limits<_Tp>`**: 型の最小値 `min()`・最大値 `max()` を教えてくれます。
- **`from_chars_result`**: 「読み終えた位置 `ptr`」と「エラー `ec`」の組です。
- **`errc::invalid_argument` / `errc::result_out_of_range`**: 「数字がなかった」「数字はあったが型に収まらない」を表すエラーコードです。
- **`std::__complement(x)`**: 符号なし整数で `~x + 1`（2 の補数、つまり符号の反転）を計算します。

## 何をしているか

`signed char`（-128〜127）で追います。

### 1. 符号を見る

```cpp:line-numbers=44
  bool __neg = (__first != __last && *__first == '-');
  auto __r   = __f(__neg ? __first + 1 : __first, __last, __x, __args...);
```

`"-128"` なら `__neg = true` です。`'-'` の次から、符号なしのパース関数 `__f` で読みます。`__x = 128` が得られます。

`'+'` は見ていません。`std::from_chars` は規格上 `'+'` を受け付けないので、これで正しい動作です。

### 2. エラーの振り分け

```cpp:line-numbers=46
  switch (__r.ec) {
  case errc::invalid_argument:
    return {__first, __r.ec};
  case errc::result_out_of_range:
    return __r;
  default:
    break;
  }
```

- 数字が 1 つもなかった（`invalid_argument`）ときは、位置を `__first`（`'-'` を含む元の先頭）に戻して返します。`"-"` や `"-x"` は「何も読めなかった」扱いです。
- 符号なしでも収まらなかった（`result_out_of_range`）ときは、そのまま返します。

### 3. 負の数の範囲チェック

```cpp:line-numbers=55
  if (__neg) {
    if (__x <= std::__complement(std::__to_unsigned_like(__tl::min()))) {
      __value = std::__complement(__x);
      return __r;
    }
```

`__tl::min()` は -128 です。これを符号なしにすると 128、`__complement` で反転しても 128 です。つまり「負の数なら絶対値 128 まで OK」という上限になります。

`__x = 128` は上限以下なので、`__value = __complement(128)` です。符号なしで `~128 + 1` は 128（ビット列 `1000 0000`）で、これを `signed char` に入れると **-128** になります。

`"-5"` なら `__x = 5`、`__complement(5)` は `251`（`1111 1011`）で、`signed char` としては -5 です。

### 4. 正の数の範囲チェック

```cpp:line-numbers=60
  } else {
    if (__x <= std::__to_unsigned_like(__tl::max())) {
      __value = __x;
      return __r;
    }
```

上限は `max()` の 127 です。`"128"` は `__x = 128` で上限を超えます。

### 5. 範囲外

```cpp:line-numbers=67
  return {__r.ptr, errc::result_out_of_range};
```

どちらの上限も超えたら、読み終えた位置はそのままに `result_out_of_range` を返します。

## ここがすごい

**負の範囲と正の範囲は対称ではありません。** `signed char` なら負は 128 まで、正は 127 までです。符号付きのまま読んで最後に `-` を付ける方法だと、`"-128"` の途中で 128 を表せずに失敗します。この関数は符号なしで絶対値を読んでから、負と正で別々の上限を使うことで、この非対称性を正確に扱っています。

上限を `__complement(__to_unsigned_like(min()))` と **型の情報から計算** しているのもポイントです。型ごとの定数を書き並べなくても、`int` でも `long long` でも正しい上限が出ます。

設計としては、「符号の処理」と「数字の読み取り」を分ける **コンビネータ**（関数を受け取って新しい処理を組み立てる部品）になっています。同じファイルで、10 進用と 2〜36 進用の両方の符号付き版が、この 1 つの部品から作られています。符号の扱いを 1 か所に集めたので、どちらの基数でも同じ規則が保証されます。

## まとめ

- 符号付き整数のパースは「符号を見る→符号なしで読む→範囲を確かめる」に分けると正確に書ける。
- 2 の補数では、負の最小値の絶対値は正の最大値より 1 大きい。上限は負と正で別にする。
- 型の最小値・最大値から上限を計算すると、型ごとに定数を書かずに済む。
- 関数を引数に取る部品（コンビネータ）にすると、共通の規則を 1 か所にまとめられる。
