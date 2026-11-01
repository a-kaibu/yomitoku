---
title: "あふれる「前」に気づく、64 ビット整数の安全な足し算と引き算"
description: "64 ビット整数の足し算・引き算がオーバーフローするかを、計算する前に判定する関数。新しい GCC では組み込み関数に任せ、それ以外では引き算で上限との距離を測る。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [1955, 1995]
function: "sqlite3AddInt64 / sqlite3SubInt64"
difficulty: 2
format: 2
tags: [防御的プログラミング, 数値計算, 移植性]
---

## ひとことで

`sqlite3AddInt64` は、`*pA + iB` を計算して `*pA` に入れる関数です。ただし結果が 64 ビット整数の範囲からはみ出す（**オーバーフロー**する）場合は、`*pA` を変えずに 1 を返します。成功なら 0 です。
`sqlite3SubInt64` は同じことを引き算で行います。
SQL の `SELECT 9223372036854775807 + 1` のような計算で、SQLite が整数ではなく浮動小数点数に切り替えるかを判断するのに使われています。

## コード

::: code-group

```c:line-numbers=1955 [日本語訳]
/*
** 64 ビット符号付きの値 iB を、*pA にあるもう一方の 64 ビット符号付き
** 整数に足す・引く・掛けることを試み、結果を *pA に格納する。
** 成功したら 0 を返す。演算が
** オーバーフローするなら、*pA を変えずに 1 を返す。
*/
int sqlite3AddInt64(i64 *pA, i64 iB){
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_add_overflow(*pA, iB, pA);
#else
  i64 iA = *pA;
  testcase( iA==0 ); testcase( iA==1 );
  testcase( iB==-1 ); testcase( iB==0 );
  if( iB>=0 ){
    testcase( iA>0 && LARGEST_INT64 - iA == iB );
    testcase( iA>0 && LARGEST_INT64 - iA == iB - 1 );
    if( iA>0 && LARGEST_INT64 - iA < iB ) return 1;
  }else{
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 1 );
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 2 );
    if( iA<0 && -(iA + LARGEST_INT64) > iB + 1 ) return 1;
  }
  *pA += iB;
  return 0;
#endif
}
int sqlite3SubInt64(i64 *pA, i64 iB){
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_sub_overflow(*pA, iB, pA);
#else
  testcase( iB==SMALLEST_INT64+1 );
  if( iB==SMALLEST_INT64 ){
    testcase( (*pA)==(-1) ); testcase( (*pA)==0 );
    if( (*pA)>=0 ) return 1;
    *pA -= iB;
    return 0;
  }else{
    return sqlite3AddInt64(pA, -iB);
  }
#endif
}
```

```c:line-numbers=1955 [原文]
/*
** Attempt to add, subtract, or multiply the 64-bit signed value iB against
** the other 64-bit signed integer at *pA and store the result in *pA.
** Return 0 on success.  Or if the operation would have resulted in an
** overflow, leave *pA unchanged and return 1.
*/
int sqlite3AddInt64(i64 *pA, i64 iB){
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_add_overflow(*pA, iB, pA);
#else
  i64 iA = *pA;
  testcase( iA==0 ); testcase( iA==1 );
  testcase( iB==-1 ); testcase( iB==0 );
  if( iB>=0 ){
    testcase( iA>0 && LARGEST_INT64 - iA == iB );
    testcase( iA>0 && LARGEST_INT64 - iA == iB - 1 );
    if( iA>0 && LARGEST_INT64 - iA < iB ) return 1;
  }else{
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 1 );
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 2 );
    if( iA<0 && -(iA + LARGEST_INT64) > iB + 1 ) return 1;
  }
  *pA += iB;
  return 0;
#endif
}
int sqlite3SubInt64(i64 *pA, i64 iB){
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_sub_overflow(*pA, iB, pA);
#else
  testcase( iB==SMALLEST_INT64+1 );
  if( iB==SMALLEST_INT64 ){
    testcase( (*pA)==(-1) ); testcase( (*pA)==0 );
    if( (*pA)>=0 ) return 1;
    *pA -= iB;
    return 0;
  }else{
    return sqlite3AddInt64(pA, -iB);
  }
#endif
}
```

:::

## 前提知識

- **`i64`**: SQLite が定義した 64 ビットの符号付き整数です。範囲は `SMALLEST_INT64`（-9223372036854775808）から `LARGEST_INT64`（9223372036854775807）までです。
- **符号付き整数のオーバーフロー**: C では、符号付き整数の計算が範囲を超えると **未定義動作**（何が起きてもおかしくない状態）になります。結果がたまたま負になる環境が多いですが、コンパイラは「オーバーフローは起きない」と仮定して最適化してよいので、「計算してから負になったか調べる」方法は信用できません。
- **`i64 *pA`**: 「`i64` を指すポインタ」です。`*pA` で指している変数を読み書きできます。結果を書き戻しつつ、戻り値で成功・失敗を返すために使っています。
- **`__builtin_add_overflow(a, b, &r)`**: GCC や Clang の組み込み関数です。`a + b` を計算して `r` に入れ、オーバーフローしたら真を返します。
- **`#if GCC_VERSION>=5004000`**: GCC 5.4 以降でコンパイルしているときだけ、その部分を使います。
- **`testcase(...)`**: SQLite のテスト用マクロで、その条件が成り立つ場合がテストで実際に通ったかを記録します。普通のビルドでは何もしません。

## 何をしているか

### 1. 新しいコンパイラなら組み込み関数

```c:line-numbers=1962
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_add_overflow(*pA, iB, pA);
```

GCC 5.4 以降（Intel のコンパイラを除く）では、`__builtin_add_overflow` 1 行で済ませます。CPU のオーバーフロー検出の仕組みを直接使えるので、速くて確実です。

### 2. 正の数を足す場合

```c:line-numbers=1968
  if( iB>=0 ){
    testcase( iA>0 && LARGEST_INT64 - iA == iB );
    testcase( iA>0 && LARGEST_INT64 - iA == iB - 1 );
    if( iA>0 && LARGEST_INT64 - iA < iB ) return 1;
```

`iB >= 0` のとき、あふれるのは `iA` も正で、`iA + iB > LARGEST_INT64` の場合だけです。
この不等式を **移項** して `LARGEST_INT64 - iA < iB` と書けば、計算の途中であふれることがありません。`iA` が正なので、`LARGEST_INT64 - iA` は必ず範囲内です。

たとえば `iA = LARGEST_INT64 - 5`、`iB = 10` なら、`LARGEST_INT64 - iA = 5 < 10` なので 1 を返します。`iB = 5` ならちょうど上限で、成功します。

### 3. 負の数を足す場合

```c:line-numbers=1972
  }else{
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 1 );
    testcase( iA<0 && -(iA + LARGEST_INT64) == iB + 2 );
    if( iA<0 && -(iA + LARGEST_INT64) > iB + 1 ) return 1;
  }
```

`iB < 0` のとき、あふれるのは `iA` も負で、`iA + iB < SMALLEST_INT64` の場合です。
ここでは `SMALLEST_INT64` を直接書かず、`-(iA + LARGEST_INT64) > iB + 1` という形で判定しています。
`SMALLEST_INT64 = -LARGEST_INT64 - 1` なので、元の不等式 `iA + iB < -LARGEST_INT64 - 1` を移項すると `-(iA + LARGEST_INT64) > iB + 1` になります。`iA` は負なので `iA + LARGEST_INT64` はあふれず、`iB` も負なので `iB + 1` もあふれません。

### 4. 問題なければ計算する

```c:line-numbers=1977
  *pA += iB;
  return 0;
```

あふれないと確かめてから `*pA += iB` を実行し、0 を返します。

### 5. 引き算は足し算に変える

```c:line-numbers=1981
int sqlite3SubInt64(i64 *pA, i64 iB){
#if GCC_VERSION>=5004000 && !defined(__INTEL_COMPILER)
  return __builtin_sub_overflow(*pA, iB, pA);
#else
  testcase( iB==SMALLEST_INT64+1 );
  if( iB==SMALLEST_INT64 ){
    testcase( (*pA)==(-1) ); testcase( (*pA)==0 );
    if( (*pA)>=0 ) return 1;
    *pA -= iB;
    return 0;
  }else{
    return sqlite3AddInt64(pA, -iB);
  }
#endif
}
```

`a - b` は `a + (-b)` なので、`sqlite3AddInt64(pA, -iB)` を呼びます。
ただし `iB` が最小値のときは `-iB` 自体があふれるので、別に扱います。`iB = SMALLEST_INT64` を引くことは `2^63` を足すことと同じなので、`*pA` が 0 以上なら必ずあふれ、負なら必ず収まります。この場合だけは `if( iB==SMALLEST_INT64 )` の枝で直接判定します。

## ここがすごい

- **計算する前に判定する**: 「足してから符号を見る」方法は、未定義動作に頼るので危険です。この関数は、あふれない形に式を移項してから比べるので、C の規則の範囲で正しく判定できます。
- **境界のテストを明示している**: `testcase( iA>0 && LARGEST_INT64 - iA == iB )` などの `testcase` は、「ちょうど上限」と「上限より 1 だけ手前」の両方がテストされていることを確かめるためのものです。オーバーフロー判定は 1 つずれるだけでバグになるので、境界の両側を必ず試す、という SQLite のテスト文化が見えます。
- **最小値という例外を見落とさない**: 2 の補数の整数は、負の側が 1 つだけ広いので、最小値には対応する正の値がありません。引き算を足し算に変える便利な方法も、この 1 つの値だけは使えません。`if( iB==SMALLEST_INT64 )` でそれを特別扱いしています。
- **速い道と移植できる道**: 組み込み関数が使えればそれを使い、使えなければ標準 C だけで同じ判定をします。同じファイルの `sqlite3MulInt64` も同じ構成です。

## まとめ

- C の符号付き整数のオーバーフローは未定義動作。「計算してから調べる」は信用できない。
- `a + b > MAX` は `MAX - a < b` のように移項すれば、あふれずに判定できる。
- 最小の負の整数は符号反転できない。引き算を足し算に変えるときは特別扱いが要る。
- 境界ちょうどと、その 1 つ手前の両方をテストする。
