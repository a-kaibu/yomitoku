---
title: "2 桁ずつ表から写して、整数を速く文字列にする"
description: "64 ビット整数を 10 進数の文字列に変換する関数。100 で割った余りを「00」〜「99」の表で 2 文字まとめて書き込み、割り算の回数を半分にする。最小値の符号反転の罠もきちんと避けている。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [1087, 1131]
function: "sqlite3Int64ToText"
difficulty: 2
format: 2
tags: [数値計算, 最適化, 文字列処理]
---

## ひとことで

`sqlite3Int64ToText` は、64 ビットの符号付き整数を **10 進数の文字列** に変換する関数です。
`v = -1234` なら `zOut` に `"-1234"` を書き、長さ 5 を返します。
普通は 10 で割りながら 1 桁ずつ作りますが、この関数は **100 で割って 2 桁ずつ** 作ります。

## コード

::: code-group

```c:line-numbers=1087 [日本語訳]
/*
** 符号付き 64 ビット整数を文字列にする。結果を zOut[] に書き、
** 書いた文字列の長さをバイト数で返す。返す値には、
** 出力文字列の最後にある終端の 0 は
** 含まない。
**
** 呼び出し側は zOut[] が 21 バイト以上あることを保証すること。
*/
int sqlite3Int64ToText(i64 v, char *zOut){
  int i;
  u64 x;
  union {
    char a[SQLITE_U64_DIGITS+1];
    u16 forceAlignment;
  } u;
  if( v>0 ){
    x = v;
  }else if( v==0 ){
    zOut[0] = '0';
    zOut[1] = 0;
    return 1;
  }else{
    x = (v==SMALLEST_INT64) ? ((u64)1)<<63 : (u64)-v;
  }
#ifdef SQLITE_AVOID_U64_DIVIDE
  i = sqlite3UInt64ToText(x, u.a);
#else
  i = sizeof(u.a)-1;
  u.a[i] = 0;
  while( x>=10 ){
    int kk = (x%100)*2;
    assert( TWO_BYTE_ALIGNMENT(&sqlite3DigitPairs.a[kk]) );
    assert( TWO_BYTE_ALIGNMENT(&u.a[i-2]) );
    *(u16*)(&u.a[i-2]) = *(u16*)&sqlite3DigitPairs.a[kk];
    i -= 2;
    x /= 100;
  }
  if( x ){
    u.a[--i] = x + '0';
  }
#endif /* SQLITE_AVOID_U64_DIVIDE */
  if( v<0 ) u.a[--i] = '-';
  memcpy(zOut, &u.a[i], sizeof(u.a)-i);
  return sizeof(u.a)-1-i;
}
```

```c:line-numbers=1087 [原文]
/*
** Render an signed 64-bit integer as text.  Store the result in zOut[] and
** return the length of the string that was stored, in bytes.  The value
** returned does not include the zero terminator at the end of the output
** string.
**
** The caller must ensure that zOut[] is at least 21 bytes in size.
*/
int sqlite3Int64ToText(i64 v, char *zOut){
  int i;
  u64 x;
  union {
    char a[SQLITE_U64_DIGITS+1];
    u16 forceAlignment;
  } u;
  if( v>0 ){
    x = v;
  }else if( v==0 ){
    zOut[0] = '0';
    zOut[1] = 0;
    return 1;
  }else{
    x = (v==SMALLEST_INT64) ? ((u64)1)<<63 : (u64)-v;
  }
#ifdef SQLITE_AVOID_U64_DIVIDE
  i = sqlite3UInt64ToText(x, u.a);
#else
  i = sizeof(u.a)-1;
  u.a[i] = 0;
  while( x>=10 ){
    int kk = (x%100)*2;
    assert( TWO_BYTE_ALIGNMENT(&sqlite3DigitPairs.a[kk]) );
    assert( TWO_BYTE_ALIGNMENT(&u.a[i-2]) );
    *(u16*)(&u.a[i-2]) = *(u16*)&sqlite3DigitPairs.a[kk];
    i -= 2;
    x /= 100;
  }
  if( x ){
    u.a[--i] = x + '0';
  }
#endif /* SQLITE_AVOID_U64_DIVIDE */
  if( v<0 ) u.a[--i] = '-';
  memcpy(zOut, &u.a[i], sizeof(u.a)-i);
  return sizeof(u.a)-1-i;
}
```

:::

2 桁の文字を引く表 `sqlite3DigitPairs` は、同じ `src/util.c` の少し上で定義されています。

```c:line-numbers=1007
static const union {
  char a[201];
  short int forceAlignment;
} sqlite3DigitPairs = {
  "00010203040506070809"
  "10111213141516171819"
  "20212223242526272829"
  "30313233343536373839"
  "40414243444546474849"
  "50515253545556575859"
  "60616263646566676869"
  "70717273747576777879"
  "80818283848586878889"
  "90919293949596979899"
};

```

`SQLITE_U64_DIGITS` は `src/sqliteInt.h` で `20`（64 ビット符号なし整数の最大桁数）と定義されています。

<!-- source: src/sqliteInt.h -->
```c:line-numbers=4949
#define SQLITE_U64_DIGITS 20
```

## 前提知識

- **`i64` / `u64` / `u16`**: SQLite が定義している整数型で、それぞれ符号付き 64 ビット、符号なし 64 ビット、符号なし 16 ビットです。
- **`union`（共用体）**: 複数のメンバーが **同じメモリを共有する** 型です。ここでは文字の配列 `a` と 16 ビット整数 `forceAlignment` を重ねています。`forceAlignment` は使われませんが、これがあることで `union` 全体が 16 ビット整数と同じ境界（偶数アドレス）に置かれます。
- **アラインメント**: CPU は 2 バイトの値を偶数アドレスから読むのが得意で、環境によっては奇数アドレスから読むと遅いかエラーになります。
- **`*(u16*)(&u.a[i-2])`**: `&u.a[i-2]` は配列の `i-2` 番目の場所（アドレス）です。それを「`u16` を指すポインタ」に変換して `*` で読み書きすると、**2 バイトを 1 回で** 扱えます。
- **`%` と `/`**: 整数の割り算の余りと商です。`1234 % 100` は 34、`1234 / 100` は 12 です。
- **`'0'` を足す**: 数字 `x`（0〜9）に文字 `'0'` の文字コードを足すと、その数字の文字になります。
- **`--i`**: `i` を 1 減らしてから使う、前置のデクリメントです。

## 何をしているか

### 1. 符号を外して絶対値を求める

```c:line-numbers=1102
  if( v>0 ){
    x = v;
  }else if( v==0 ){
    zOut[0] = '0';
    zOut[1] = 0;
    return 1;
  }else{
    x = (v==SMALLEST_INT64) ? ((u64)1)<<63 : (u64)-v;
  }
```

正ならそのまま `x` に入れます。0 なら `"0"` を書いてすぐ返します。
負のときは `-v` で絶対値にしますが、`v` が最小値 `-9223372036854775808` のときだけは特別です。この値の符号を反転した `9223372036854775808` は `i64` に収まらないので、`((u64)1)<<63` で直接その値を作ります。

### 2. 後ろから 2 桁ずつ書く

```c:line-numbers=1114
  i = sizeof(u.a)-1;
  u.a[i] = 0;
  while( x>=10 ){
    int kk = (x%100)*2;
    assert( TWO_BYTE_ALIGNMENT(&sqlite3DigitPairs.a[kk]) );
    assert( TWO_BYTE_ALIGNMENT(&u.a[i-2]) );
    *(u16*)(&u.a[i-2]) = *(u16*)&sqlite3DigitPairs.a[kk];
    i -= 2;
    x /= 100;
```

一時領域 `u.a`（21 バイト）の **末尾から前に向かって** 書いていきます。まず末尾に終端の 0 を置き、`i` をその位置にします。

`x = 1234` で追ってみます。

- `x % 100 = 34` なので `kk = 68`。表の 68 番目からの 2 文字はちょうど `"34"` です。これを `u.a[i-2]` から 2 バイトまとめて写し、`i` を 2 減らし、`x` は 12 になります。
- `x % 100 = 12` なので `kk = 24`。表の 24 番目からは `"12"` です。同じく写して、`x` は 0 になります。

`x>=10` のあいだ続けるので、最後に 1 桁だけ残った場合は `if( x )` の部分で 1 文字書き足します。`x = 567` なら、`"67"` を書いた後に `x = 5` が残り、`'5'` を前に付けます。

### 3. 符号を付けてコピーする

```c:line-numbers=1128
  if( v<0 ) u.a[--i] = '-';
  memcpy(zOut, &u.a[i], sizeof(u.a)-i);
  return sizeof(u.a)-1-i;
```

負なら `'-'` を前に付けます。最後に `u.a[i]` から終端までを `zOut` にコピーし、書いた文字数を返します。

## ここがすごい

- **割り算の回数が半分**: 64 ビットの割り算は、足し算などに比べて時間のかかる命令です。100 で割れば 1 回で 2 桁が決まるので、19 桁の数でも割り算は 10 回ほどで済みます。
- **表に「2 桁の文字列」を並べておく**: `"00"` から `"99"` までの 100 通りを 200 文字の表にしておけば、余り `r` に対して `r*2` の位置を見るだけで 2 文字がわかります。2 文字を `u16` として 1 回で写すので、書き込みも半分です。
- **アラインメントを `union` で保証**: 2 バイトまとめて読み書きするには、表も書き込み先も偶数アドレスにある必要があります。どちらも `union` で 16 ビット整数と重ねることで、偶数アドレスに置かれるようにしています。2 つの `assert( TWO_BYTE_ALIGNMENT(...) )` はそれを確かめています。書き込み位置 `i` も 21 バイトの配列の末尾から 2 ずつ動くので、`i-2` は常に偶数です。
- **後ろから書くので桁数を先に数えなくてよい**: 下の桁から順に決まるので、配列の末尾から前へ書いていけば、最後に反転する必要がありません。
- **最小値の罠を避ける**: `-v` は、`v` が最小値のときにあふれて未定義動作（何が起きても文句が言えない状態）になります。`(v==SMALLEST_INT64) ? ((u64)1)<<63 : (u64)-v` と特別扱いするのは、この有名な落とし穴への対策です。
- **割り算を避けたい環境への配慮**: `SQLITE_AVOID_U64_DIVIDE` が定義されていると、64 ビットの割り算を使わない別の関数 `sqlite3UInt64ToText` に切り替わります。

## まとめ

- 10 進数への変換は、100 で割って 2 桁ずつ表から写すと割り算の回数が半分になる。
- 2 バイトをまとめて読み書きするなら、アラインメントを `union` などで保証する。
- 数字は下の桁から決まるので、バッファの末尾から前へ書くと楽。
- 最小の負の整数の符号反転はあふれる。必ず特別扱いする。
