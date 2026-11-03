---
title: "年が閏年かを、4 と 100 と 400 の割り切れで判定する"
description: "calendar:is_leap_year/1 は、西暦の年が閏年かを返す。4 で割り切れ、100 では割り切れない年、または 400 で割り切れる年が閏年になる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [343, 351]
function: "calendar:is_leap_year/1"
difficulty: 1
format: 2
tags: ["日時", "数値計算", "標準ライブラリ"]
---
## ひとことで

`calendar:is_leap_year/1` は、西暦の年を受け取り、閏年なら `true`、そうでなければ `false` を返します。
閏年の決まりは、4 で割り切れる年、ただし 100 で割り切れる年は除く、さらに 400 で割り切れる年は含める、の三つです。

## コード

```erlang:line-numbers=343
is_leap_year(Y) when is_integer(Y) ->
    is_leap_year1(Y).

-spec is_leap_year1(year()) -> boolean().
is_leap_year1(Year) when Year rem 4 =:= 0, Year rem 100 =/= 0 ->
    true;
is_leap_year1(Year) when Year rem 400 =:= 0 ->
    true;
is_leap_year1(_) -> false.
```

## 前提知識

- **閏年**: 二月が二十九日まである年です。太陽暦の年と、地球の公転のずれを補うために設けられています。
- **`rem`**: 割り算の余りを求める演算子です。`Year rem 4 =:= 0` は、4 で割り切れるかを表します。
- **`=/=`**: 等しくないことを表す比較演算子です。
- **ガード**: 節の条件です。`,` でつないだ条件は、すべて真のときだけ、その節が選ばれます。

## 何をしているか

### 1. 入口で、整数かを確かめる

```erlang:line-numbers=343
is_leap_year(Y) when is_integer(Y) ->
    is_leap_year1(Y).
```

`is_leap_year/1` は、引数が整数であることを確かめてから、判定を `is_leap_year1/1` に任せます。

### 2. 4 で割り切れて、100 では割り切れない年

```erlang:line-numbers=347
is_leap_year1(Year) when Year rem 4 =:= 0, Year rem 100 =/= 0 ->
    true;
```

最初の節は、4 で割り切れ、かつ 100 では割り切れない年に当たります。たとえば 2024 年がこれにあたり、閏年です。

### 3. 400 で割り切れる年

```erlang:line-numbers=349
is_leap_year1(Year) when Year rem 400 =:= 0 ->
    true;
```

二番目の節は、400 で割り切れる年です。たとえば 2000 年がこれにあたり、100 で割り切れても、閏年になります。

### 4. それ以外は閏年ではない

```erlang:line-numbers=351
is_leap_year1(_) -> false.
```

どの条件にも当たらない年は、閏年ではありません。たとえば 1900 年は、100 で割り切れて 400 では割り切れないので、閏年ではありません。

## ここがすごい

### 例外の規則を、節の順序で表す

閏年の決まりは、「4 の倍数」に、「100 の倍数は除く」、そして「400 の倍数は含める」という例外の連なりです。
この関数は、その例外を、節の順番で書いています。最初の節で通常の場合を、次の節で例外の救済を、最後に残りを書いています。

### ガードの中に、判定を書く

判定の条件は、節の見出しのガードに書かれています。関数の中で、`if` や変数を使って分ける必要がありません。
読み手は、節の見出しを読むだけで、どの年が閏年になるかが分かります。

### 整数だけを受け付ける

`is_integer(Y)` のガードで、整数でない値を弾きます。
余りを求める計算は、整数にしか使えないので、この確かめは、判定を正しく動かすために必要です。

## まとめ

`calendar:is_leap_year(2024)` は、`true` を返します。
`calendar:is_leap_year(1900)` は、`false` を返します。
