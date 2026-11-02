---
title: 「次の 2 のべき乗」を求めるとき、小さな型ではわざと桁あふれさせる
description: std::bit_ceil の中身。先頭のゼロを数えて桁数を出し、8 ビットや 16 ビットの型では一度 unsigned に広げてからシフトすることで、未定義動作を避けつつ桁あふれ検出を効かせる。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__bit/bit_ceil.h
lines: [26, 40]
function: std::__bit_ceil
difficulty: 2
format: 2
tags: [ビット演算, 標準ライブラリ, 防御的プログラミング]
---
## ひとことで

`__bit_ceil` は、与えられた数 **以上** で最小の 2 のべき乗を返す関数です。C++20 の `std::bit_ceil` の本体です。
たとえば `5` なら `8`、`8` なら `8`、`0` や `1` なら `1` を返します。
ハッシュ表のバケット数を 2 のべき乗にそろえるときなどに使われます。

## コード

```cpp:line-numbers=26
template <class _Tp>
[[nodiscard]] constexpr _Tp __bit_ceil(_Tp __t) noexcept {
  if (__t < 2)
    return 1;
  const unsigned __n = numeric_limits<_Tp>::digits - std::__countl_zero((_Tp)(__t - 1u));
  _LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN(__n != numeric_limits<_Tp>::digits, "Bad input to bit_ceil");

  if constexpr (sizeof(_Tp) >= sizeof(unsigned))
    return _Tp{1} << __n;
  else {
    const unsigned __extra   = numeric_limits<unsigned>::digits - numeric_limits<_Tp>::digits;
    const unsigned __ret_val = 1u << (__n + __extra);
    return (_Tp)(__ret_val >> __extra);
  }
}
```

## 前提知識

- **`template <class _Tp>`**: テンプレートです。`_Tp` には呼び出し側の型（`unsigned char` や `unsigned long` など）が入り、型ごとに別の関数がコンパイル時に作られます。
- **`constexpr`**: コンパイル時にも計算できる関数であることを示します。定数の初期化にも使えます。
- **`noexcept`**: この関数は例外を投げない、という約束です。
- **`[[nodiscard]]`**: 戻り値を捨てるとコンパイラが警告を出します。計算結果を使い忘れるミスを防ぎます。
- **`numeric_limits<_Tp>::digits`**: 型 `_Tp` が何ビットで値を表すかです。`unsigned char` なら 8、`unsigned int` なら多くの環境で 32 です。
- **`__countl_zero(x)`**: 2 進数で書いたとき、左（上位）から `0` が何個続くかを数える内部関数です。
- **`if constexpr`**: 条件をコンパイル時に判定し、選ばれなかった側はコードとして生成しない `if` です。
- **整数の昇格**: C++ では `unsigned char` のような小さな整数を計算に使うと、自動的に `int` に広げられます。この性質が後半の工夫の理由になります。
- **`(_Tp)(...)`**: C 言語風のキャストです。値を `_Tp` 型に変換します。

## 何をしているか

### 1. 0 と 1 は特別扱い

```cpp:line-numbers=28
  if (__t < 2)
    return 1;
```

`__t < 2` なら `1`（= 2 の 0 乗）を返します。`0` から 1 を引くと桁あふれするので、先に除外しておきます。

### 2. 必要な桁数を数える

```cpp:line-numbers=30
  const unsigned __n = numeric_limits<_Tp>::digits - std::__countl_zero((_Tp)(__t - 1u));
```

`__t = 5`、型を 32 ビットの `unsigned` として追ってみます。

- `__t - 1u` = `4` = 2 進数で `...0100`
- 先頭のゼロは 29 個
- `__n = 32 - 29 = 3`

「`__t - 1` を表すのに 3 ビット必要」とわかりました。答えは `1 << 3 = 8` です。
1 を引いてから数えるのがポイントです。`__t = 8` なら `7`（`0111`）で `__n = 3`、答えは `8` のまま。2 のべき乗ちょうどのときに 1 つ上へ行きすぎません。

### 3. 範囲外チェック

```cpp:line-numbers=31
  _LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN(__n != numeric_limits<_Tp>::digits, "Bad input to bit_ceil");
```

`__n` が型のビット数と同じになるのは、答えがその型に収まらない場合です。たとえば 8 ビットで `200` を渡すと、答えの `256` は 8 ビットで表せません。このとき `_LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN` が働きます（ハードニングモードで有効になる検査です）。

### 4. 型の大きさで分岐する

```cpp:line-numbers=33
  if constexpr (sizeof(_Tp) >= sizeof(unsigned))
    return _Tp{1} << __n;
  else {
    const unsigned __extra   = numeric_limits<unsigned>::digits - numeric_limits<_Tp>::digits;
    const unsigned __ret_val = 1u << (__n + __extra);
    return (_Tp)(__ret_val >> __extra);
  }
```

`unsigned` 以上の大きさなら、`_Tp{1} << __n` で素直に答えを作ります。

`unsigned char` など小さい型では、`__extra`（`unsigned` との差のビット数、8 ビット型なら `32 - 8 = 24`）を足してから `unsigned` 上でシフトし、最後に同じだけ右に戻します。`__t = 5` なら `1u << (3 + 24)` を作り、`>> 24` で `8` に戻します。

## ここがすごい

小さい型で素直に `_Tp{1} << __n` と書くと、整数の昇格で `int` 上の計算になります。すると「8 ビットに収まらない値」もいったん `int` の中では正しく表せてしまい、型に戻すときに黙って切り捨てられます。

この関数は、わざと **`unsigned` の最上位側へ寄せてから** シフトします。答えが本来の型に収まらないと、`unsigned` でも桁あふれします。`constexpr` の計算で範囲外のシフトが起きるとコンパイルエラーになるので、定数式では「収まらない」ことが検出できます。

`unsigned` を選んでいるのも理由があります。符号付きの `int` で最上位ビットまでシフトすると未定義動作になりやすいからです。小さな型を「大きな型の上位ビット」として扱う、というひと工夫で、型ごとに別の検査を書かずに済ませています。

また、ループで `1, 2, 4, 8, ...` と倍にしていく素直な方法に比べ、先頭ゼロ数え（多くの CPU で 1 命令）とシフトだけで済むので、入力の大きさに関係なく一定の手間で終わります。

## まとめ

- 「`x - 1` のビット数」を数えると、`x` 以上の最小の 2 のべき乗がわかる。
- 0 や 1 のような端の値は先に除外すると、本体の式が単純になる。
- 小さな整数型は計算時に `int` へ昇格する。これを意識しないと桁あふれを見逃す。
- 値を上位ビットへ寄せて計算すると、狭い型の桁あふれを広い型の桁あふれとして検出できる。
