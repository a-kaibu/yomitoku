---
title: "ライブラリに頼らず、ビットを見て NaN を見分ける"
description: "SQLite が浮動小数点数の NaN（非数）を判定する関数。数学ライブラリの isnan() が使えない環境では、double の 64 ビットを整数として読み、指数部と仮数部のビットで判定する。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [58, 75]
function: "sqlite3IsNaN"
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, 移植性]
---

## ひとことで

`sqlite3IsNaN` は、`double`（浮動小数点数）の値が **NaN（Not a Number、「数ではない」ことを表す特別な値）** かどうかを調べる関数です。
`0.0 / 0.0` のような計算をすると NaN ができます。
SQLite は、数学ライブラリの `isnan()` を使えない環境のために、**値の 64 ビットを整数として取り出してビットの並びで判定する** 自前の実装を持っています。

## コード

::: code-group

```c:line-numbers=58 [日本語訳]
/*
** 浮動小数点数の値が NaN（非数）なら真を返す。
**
** SQLITE_HAVE_ISNAN 付きでコンパイルされたら数学ライブラリの isnan() を使う。
** そうでなければ、たいていのシステムで動く自前の実装を使う。
*/
int sqlite3IsNaN(double x){
  int rc;   /* 戻り値 */
#if !SQLITE_HAVE_ISNAN && !HAVE_ISNAN
  u64 y;
  memcpy(&y,&x,sizeof(y));
  rc = IsNaN(y);
#else
  rc = isnan(x);
#endif /* HAVE_ISNAN */
  testcase( rc );
  return rc;
}
```

```c:line-numbers=58 [原文]
/*
** Return true if the floating point value is Not a Number (NaN).
**
** Use the math library isnan() function if compiled with SQLITE_HAVE_ISNAN.
** Otherwise, we have our own implementation that works on most systems.
*/
int sqlite3IsNaN(double x){
  int rc;   /* The value return */
#if !SQLITE_HAVE_ISNAN && !HAVE_ISNAN
  u64 y;
  memcpy(&y,&x,sizeof(y));
  rc = IsNaN(y);
#else
  rc = isnan(x);
#endif /* HAVE_ISNAN */
  testcase( rc );
  return rc;
}
```

:::

`IsNaN` マクロは `src/sqliteInt.h` で次のように定義されています。

<!-- source: src/sqliteInt.h -->
```c:line-numbers=4924
# define EXP754 (((u64)0x7ff)<<52)
# define MAN754 ((((u64)1)<<52)-1)
# define IsNaN(X) (((X)&EXP754)==EXP754 && ((X)&MAN754)!=0)
# define IsOvfl(X) (((X)&EXP754)==EXP754)
```

## 前提知識

- **`double`**: 64 ビットの浮動小数点数です。ほとんどの環境で IEEE 754 という規格の形式で表されます。
- **IEEE 754 の 64 ビット形式**: 最上位の 1 ビットが符号、次の 11 ビットが **指数部**（2 の何乗か）、残りの 52 ビットが **仮数部**（有効数字）です。指数部がすべて 1（`0x7ff`）のときは特別な意味になり、仮数部が 0 なら無限大、0 以外なら NaN です。
- **`u64`**: SQLite が定義している「符号なし 64 ビット整数」の型名です。`unsigned`（符号なし）は負の数を持たない整数のことです。
- **`memcpy(&y, &x, sizeof(y))`**: `x` のメモリの中身を、`y` のメモリへバイト単位でそのままコピーします。`&x` は「`x` が置かれている場所（アドレス）」を表します。`sizeof(y)` は `y` の大きさ（8 バイト）です。
- **`#if` 〜 `#else` 〜 `#endif`**: コンパイル前に、条件によってコードの片方だけを残す仕組みです（プリプロセッサ）。`!SQLITE_HAVE_ISNAN` は「`SQLITE_HAVE_ISNAN` が定義されていないか 0」という意味です。
- **`#define`（マクロ）**: コンパイル前に文字列を置き換える仕組みです。`IsNaN(y)` はその場で `(((y)&EXP754)==EXP754 && ...)` に展開されます。
- **`<<` と `&`**: `<<` は左シフト（ビットを左にずらす）、`&` はビットごとの AND です。

## 何をしているか

### 1. どちらの実装を使うか選ぶ

```c:line-numbers=66
#if !SQLITE_HAVE_ISNAN && !HAVE_ISNAN
  u64 y;
  memcpy(&y,&x,sizeof(y));
  rc = IsNaN(y);
#else
  rc = isnan(x);
#endif /* HAVE_ISNAN */
```

`#if` で、`isnan()` が使えるかどうかを判定します。
使えない場合は `memcpy` と `IsNaN` を使う自前実装、使える場合は `isnan(x)` がコンパイルされます。
どちらか片方しか実行ファイルには残りません。

### 2. double のビットを整数として取り出す

```c:line-numbers=67
  u64 y;
  memcpy(&y,&x,sizeof(y));
```

`u64 y;` で 64 ビット整数の変数を用意し、`memcpy` で `x` の 8 バイトをそのまま `y` へ写します。
これで `y` には「浮動小数点数としての値」ではなく、**ビットの並びそのもの** が入ります。
たとえば `x = 1.0` なら、`y` は `0x3FF0000000000000` になります。

### 3. マクロでビットを調べる

```c:line-numbers=69
  rc = IsNaN(y);
```

`EXP754` は `0x7ff` を 52 ビット左にずらした値で、ちょうど指数部の 11 ビットだけが 1 になったマスクです。
`MAN754` は `1` を 52 ビットずらして 1 を引いた値で、下位 52 ビット（仮数部）がすべて 1 のマスクです。

`IsNaN(y)` は次の 2 つが両方成り立つときに真になります。

- `(y & EXP754) == EXP754`: 指数部が全部 1 である。
- `(y & MAN754) != 0`: 仮数部が 0 ではない。

NaN の典型的なビット列 `0x7FF8000000000000` なら、指数部は `0x7ff` で、仮数部は `0x8000000000000` なので真です。
正の無限大 `0x7FF0000000000000` は指数部が全部 1 ですが、仮数部が 0 なので偽になります。

### 4. 結果を返す

```c:line-numbers=73
  testcase( rc );
  return rc;
```

`testcase(rc)` は SQLite のテスト用マクロで、「`rc` が真になる場合と偽になる場合の両方がテストで通ったか」を確認するためのものです。通常のビルドでは何もしません。

## ここがすごい

- **`x != x` に頼らない**: NaN は「自分自身と等しくない」という性質があるので、`x != x` で判定する書き方がよく知られています。しかし、コンパイラの最適化オプションによっては「`x != x` は常に偽」と仮定されて消されてしまうことがあります。ビットを直接見る方法なら、そうした最適化の影響を受けません。
- **ポインタのキャストではなく `memcpy`**: `*(u64*)&x` のように型を読み替える書き方は、C の strict aliasing 規則（ある型のデータを別の型のポインタで読んではいけない、という規則）に反します。`memcpy` を使えば規則を守ったまま、同じビット列を整数として扱えます。最近のコンパイラはこの `memcpy` を 1 命令にまとめてくれることが多いです。
- **すぐ下の兄弟関数との対比**: 直後の関数 `sqlite3IsOverflow` は、同じビット列に `IsOvfl` マクロ（指数部が全部 1 かだけを見る）を当てて「NaN または無限大」を判定します。仮数部の検査を足すか足さないかだけで、2 つの判定を作り分けているのがわかります。
- **移植性の工夫**: 組み込み機器など、標準の数学ライブラリが揃っていない環境でも SQLite は動きます。`#if` で切り替える形にしておくことで、ふだんは標準の `isnan()`、使えないときだけ自前実装、と両立させています。

## まとめ

- IEEE 754 の `double` は「符号 1 ＋ 指数 11 ＋ 仮数 52」ビット。指数が全部 1 で仮数が 0 以外なら NaN。
- 浮動小数点数のビットを調べたいときは、`memcpy` で同じ大きさの整数にコピーするのが安全。
- `x != x` による NaN 判定は、最適化オプション次第で壊れることがある。
- マスク用の定数をシフトと引き算で組み立てると、意図がそのまま式に現れる。
