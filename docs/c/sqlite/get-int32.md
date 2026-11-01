---
title: "文字列を 32 ビット整数に変換し、あふれを「v-neg」で見抜く"
description: "10 進数と 16 進数の文字列を int に変換する関数。64 ビットで計算してから範囲を確かめ、負の側が 1 つ広い非対称さを v-neg という 1 つの式で処理する。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [1307, 1370]
function: "sqlite3GetInt32"
difficulty: 2
format: 2
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`sqlite3GetInt32` は、文字列が 32 ビットの `int` に収まる整数を表していれば、その値を `*pValue` に入れて真（1）を返す関数です。収まらなければ偽（0）を返します。
`"-2147483648"` は成功し、`"2147483648"` は失敗します。`"0x1F"` のような 16 進数も受け付け、数字の後ろの余計な文字は無視します。

## コード

::: code-group

```c:line-numbers=1307 [日本語訳]
/*
** zNum が 32 ビットに収まる整数を表しているなら、*pValue に
** その整数を入れて真を返す。そうでなければ偽を返す。
**
** この関数は整数の 10 進表記と 16 進表記の両方を受け付ける。
**
** zNum の後ろに続く数字以外の文字は無視する。
** この点は、入力の数が 0 で終わっていることを求める
** sqlite3Atoi64() とは違う。
*/
int sqlite3GetInt32(const char *zNum, int *pValue){
  sqlite_int64 v = 0;
  int i, c;
  int neg = 0;
  if( zNum[0]=='-' ){
    neg = 1;
    zNum++;
  }else if( zNum[0]=='+' ){
    zNum++;
  }
#ifndef SQLITE_OMIT_HEX_INTEGER
  else if( zNum[0]=='0'
        && (zNum[1]=='x' || zNum[1]=='X')
        && sqlite3Isxdigit(zNum[2])
  ){
    u32 u = 0;
    zNum += 2;
    while( zNum[0]=='0' ) zNum++;
    for(i=0; i<8 && sqlite3Isxdigit(zNum[i]); i++){
      u = u*16 + sqlite3HexToInt(zNum[i]);
    }
    if( (u&0x80000000)==0 && sqlite3Isxdigit(zNum[i])==0 ){
      memcpy(pValue, &u, 4);
      return 1;
    }else{
      return 0;
    }
  }
#endif
  if( !sqlite3Isdigit(zNum[0]) ) return 0;
  while( zNum[0]=='0' ) zNum++;
  for(i=0; i<11 && (c = zNum[i] - '0')>=0 && c<=9; i++){
    v = v*10 + c;
  }

  /* 32 ビット整数の 10 進表記でいちばん長いものは 10 桁:
  **
  **             1234567890
  **     2^31 -> 2147483648
  */
  testcase( i==10 );
  if( i>10 ){
    return 0;
  }
  testcase( v-neg==2147483647 );
  if( v-neg>2147483647 ){
    return 0;
  }
  if( neg ){
    v = -v;
  }
  *pValue = (int)v;
  return 1;
}
```

```c:line-numbers=1307 [原文]
/*
** If zNum represents an integer that will fit in 32-bits, then set
** *pValue to that integer and return true.  Otherwise return false.
**
** This routine accepts both decimal and hexadecimal notation for integers.
**
** Any non-numeric characters that following zNum are ignored.
** This is different from sqlite3Atoi64() which requires the
** input number to be zero-terminated.
*/
int sqlite3GetInt32(const char *zNum, int *pValue){
  sqlite_int64 v = 0;
  int i, c;
  int neg = 0;
  if( zNum[0]=='-' ){
    neg = 1;
    zNum++;
  }else if( zNum[0]=='+' ){
    zNum++;
  }
#ifndef SQLITE_OMIT_HEX_INTEGER
  else if( zNum[0]=='0'
        && (zNum[1]=='x' || zNum[1]=='X')
        && sqlite3Isxdigit(zNum[2])
  ){
    u32 u = 0;
    zNum += 2;
    while( zNum[0]=='0' ) zNum++;
    for(i=0; i<8 && sqlite3Isxdigit(zNum[i]); i++){
      u = u*16 + sqlite3HexToInt(zNum[i]);
    }
    if( (u&0x80000000)==0 && sqlite3Isxdigit(zNum[i])==0 ){
      memcpy(pValue, &u, 4);
      return 1;
    }else{
      return 0;
    }
  }
#endif
  if( !sqlite3Isdigit(zNum[0]) ) return 0;
  while( zNum[0]=='0' ) zNum++;
  for(i=0; i<11 && (c = zNum[i] - '0')>=0 && c<=9; i++){
    v = v*10 + c;
  }

  /* The longest decimal representation of a 32 bit integer is 10 digits:
  **
  **             1234567890
  **     2^31 -> 2147483648
  */
  testcase( i==10 );
  if( i>10 ){
    return 0;
  }
  testcase( v-neg==2147483647 );
  if( v-neg>2147483647 ){
    return 0;
  }
  if( neg ){
    v = -v;
  }
  *pValue = (int)v;
  return 1;
}
```

:::

## 前提知識

- **`const char *zNum`**: 変換したい文字列の先頭を指すポインタです。`zNum[0]` が先頭の文字で、`zNum++` でポインタを 1 文字先へ進めます。
- **`int *pValue`**: 結果を書き込む先を指すポインタです。`*pValue = ...` で呼び出し側の変数に値を入れます。成功・失敗を戻り値で、値をポインタで返すのは C でよく使う形です。
- **`sqlite_int64`**: 64 ビットの符号付き整数です。32 ビットに収まるか調べるために、一回り大きい型で計算します。
- **32 ビット `int` の範囲**: `-2147483648`（-2^31）〜 `2147483647`（2^31-1）です。負の側が 1 つ広いのがポイントです。
- **`(c = zNum[i] - '0')>=0 && c<=9`**: 文字から `'0'` を引いて数字の値にし、その結果を `c` に代入しながら、0〜9 の範囲かを調べています。C では代入式そのものが値を持つので、条件の中で代入できます。
- **`sqlite3Isxdigit` / `sqlite3Isdigit`**: それぞれ 16 進数の文字か、10 進数の数字かを判定する SQLite のマクロです。
- **`#ifndef SQLITE_OMIT_HEX_INTEGER`**: このマクロが定義されていなければ、`#endif` までのコードを有効にします。16 進数対応を丸ごと外してビルドできるようにしています。

## 何をしているか

### 1. 符号を読む

```c:line-numbers=1321
  if( zNum[0]=='-' ){
    neg = 1;
    zNum++;
  }else if( zNum[0]=='+' ){
    zNum++;
  }
```

先頭が `-` なら `neg = 1` にして 1 文字進めます。`+` なら読み飛ばすだけです。

### 2. 16 進数の場合

```c:line-numbers=1327
#ifndef SQLITE_OMIT_HEX_INTEGER
  else if( zNum[0]=='0'
        && (zNum[1]=='x' || zNum[1]=='X')
        && sqlite3Isxdigit(zNum[2])
  ){
    u32 u = 0;
    zNum += 2;
    while( zNum[0]=='0' ) zNum++;
    for(i=0; i<8 && sqlite3Isxdigit(zNum[i]); i++){
      u = u*16 + sqlite3HexToInt(zNum[i]);
    }
    if( (u&0x80000000)==0 && sqlite3Isxdigit(zNum[i])==0 ){
      memcpy(pValue, &u, 4);
      return 1;
    }else{
      return 0;
    }
  }
#endif
```

`0x` か `0X` の後に 16 進数の文字が続いていれば、16 進数として読みます。
先頭の `0` を飛ばしてから最大 8 桁を読み、`u = u*16 + 桁の値` で組み立てます。
最上位ビット（`0x80000000`）が立っておらず、9 桁目がない場合だけ成功です。
`u` は符号なしなので、`memcpy` で 4 バイトをそのまま `*pValue` に写しています。

### 3. 10 進数を最大 11 桁読む

```c:line-numbers=1346
  if( !sqlite3Isdigit(zNum[0]) ) return 0;
  while( zNum[0]=='0' ) zNum++;
  for(i=0; i<11 && (c = zNum[i] - '0')>=0 && c<=9; i++){
    v = v*10 + c;
  }
```

先頭が数字でなければ失敗です。先頭の `0` を読み飛ばしてから、最大 11 桁を 64 ビットの `v` に積み上げます。
`"00042abc"` なら、`0` を 3 つ飛ばし、`4`、`2` を読んで `v = 42`、`a` で止まります。

### 4. 桁数で大まかに判定

```c:line-numbers=1352
  /* The longest decimal representation of a 32 bit integer is 10 digits:
  **
  **             1234567890
  **     2^31 -> 2147483648
  */
  testcase( i==10 );
  if( i>10 ){
    return 0;
  }
```

32 ビット整数は最大 10 桁なので、11 桁読めてしまったら確実に範囲外で、失敗にします。
11 桁で読むのを止めるのは、どんなに長い数字でも `v` が 64 ビットであふれないようにするためです（11 桁なら最大 99999999999 で余裕で収まります）。

### 5. v-neg で範囲を確かめる

```c:line-numbers=1361
  testcase( v-neg==2147483647 );
  if( v-neg>2147483647 ){
    return 0;
  }
```

`v - neg > 2147483647` なら失敗です。

- 正の数（`neg = 0`）なら、`v > 2147483647` かどうかの判定になります。`2147483648` は失敗です。
- 負の数（`neg = 1`）なら、`v - 1 > 2147483647`、つまり `v > 2147483648` の判定になります。`-2147483648` は `v = 2147483648` なので `v - 1 = 2147483647` で成功します。

最後に負なら符号を反転して `*pValue` に入れ、1 を返します。

## ここがすごい

- **非対称な範囲を 1 本の式で**: 正なら上限 2147483647、負なら上限 2147483648 と、上限が 1 だけ違います。素直に書くと `if(neg) ... else ...` と分岐が増えますが、`neg` が 0 か 1 であることを利用して `v - neg` とするだけで、両方を同じ比較で済ませています。`testcase( v-neg==2147483647 )` はちょうど境界の値がテストされているかを確かめるためのものです。
- **大きい型で計算してから確かめる**: 32 ビットで計算すると、あふれた時点で値が壊れてしまい、範囲外かどうかを判断できません。64 ビットで計算し、さらに桁数を 11 で打ち切ることで、64 ビットでもあふれないことを保証しています。
- **先頭の 0 を飛ばしてから桁数を数える**: `"0000000000042"` のように 0 が多いだけの文字列を、桁数が多いからといって誤って失敗にしないための工夫です。
- **16 進数は「ビット列」として扱う**: 16 進数の `0x7FFFFFFF` は成功しますが、`0x80000000` は失敗します。最上位ビットを見て拒否することで、16 進数で負の数が作られるのを防いでいます。
- **後ろのゴミを許す設計**: 関数の上のコメントにあるとおり、この関数は数字の後に文字が続いても成功します。終端まで数字であることを求める `sqlite3Atoi64` とは使い分けられています。

## まとめ

- 文字列から整数への変換では、あふれる前に「一回り大きい型」と「桁数の上限」で守る。
- 2 の補数の整数は負の側が 1 つ広い。`v - neg` のように 0/1 のフラグを式に混ぜると分岐を減らせる。
- 先頭の 0 は桁数の判定より前に取り除く。
- 成功・失敗を戻り値、値をポインタで返すと、呼び出し側が判定しやすい。
