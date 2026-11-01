---
title: "小さい数ほど短く書く、SQLite の可変長整数エンコード"
description: "64 ビット整数を 1〜9 バイトで書き出す関数。よく出る 1・2 バイトの場合を外側の関数で素早く処理し、9 バイト目だけは 8 ビットをまるごと使う工夫で最大長を 9 バイトに抑える。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [1586, 1631]
function: "sqlite3PutVarint"
difficulty: 2
format: 2
tags: [データ構造, ビット演算, 最適化]
---

## ひとことで

`sqlite3PutVarint` は、64 ビットの整数を **可変長整数（varint）** という形式でメモリに書き込み、使ったバイト数を返す関数です。
小さな数は短く、大きな数は長く書きます。`v = 100` なら 1 バイト、`v = 300` なら 2 バイトです。
SQLite のデータベースファイルでは、行の番号やデータの長さなど、多くの整数がこの形式で保存されています。

## コード

::: code-group

```c:line-numbers=1586 [日本語訳]
/*
** 64 ビットの可変長整数を p[0] から始まるメモリに書く。
** 書き込むデータの長さは 1〜9 バイト。書いたバイト数を
** 返す。
**
** 可変長整数は、第 8 ビットが立っているすべてのバイトの下位 7 ビットと、
** 第 8 ビットが立っていない 1 バイトとでできている。
** ただし 9 バイト目に達した場合は、そのバイトは 8 ビットすべてを
** 保持し、最後のバイトになる。
*/
static int SQLITE_NOINLINE putVarint64(unsigned char *p, u64 v){
  int i, j, n;
  u8 buf[10];
  if( v & (((u64)0xff000000)<<32) ){
    p[8] = (u8)v;
    v >>= 8;
    for(i=7; i>=0; i--){
      p[i] = (u8)((v & 0x7f) | 0x80);
      v >>= 7;
    }
    return 9;
  }   
  n = 0;
  do{
    buf[n++] = (u8)((v & 0x7f) | 0x80);
    v >>= 7;
  }while( v!=0 );
  buf[0] &= 0x7f;
  assert( n<=9 );
  for(i=0, j=n-1; j>=0; j--, i++){
    p[i] = buf[j];
  }
  return n;
}
int sqlite3PutVarint(unsigned char *p, u64 v){
  if( v<=0x7f ){
    p[0] = v&0x7f;
    return 1;
  }
  if( v<=0x3fff ){
    p[0] = ((v>>7)&0x7f)|0x80;
    p[1] = v&0x7f;
    return 2;
  }
  return putVarint64(p,v);
}
```

```c:line-numbers=1586 [原文]
/*
** Write a 64-bit variable-length integer to memory starting at p[0].
** The length of data write will be between 1 and 9 bytes.  The number
** of bytes written is returned.
**
** A variable-length integer consists of the lower 7 bits of each byte
** for all bytes that have the 8th bit set and one byte with the 8th
** bit clear.  Except, if we get to the 9th byte, it stores the full
** 8 bits and is the last byte.
*/
static int SQLITE_NOINLINE putVarint64(unsigned char *p, u64 v){
  int i, j, n;
  u8 buf[10];
  if( v & (((u64)0xff000000)<<32) ){
    p[8] = (u8)v;
    v >>= 8;
    for(i=7; i>=0; i--){
      p[i] = (u8)((v & 0x7f) | 0x80);
      v >>= 7;
    }
    return 9;
  }   
  n = 0;
  do{
    buf[n++] = (u8)((v & 0x7f) | 0x80);
    v >>= 7;
  }while( v!=0 );
  buf[0] &= 0x7f;
  assert( n<=9 );
  for(i=0, j=n-1; j>=0; j--, i++){
    p[i] = buf[j];
  }
  return n;
}
int sqlite3PutVarint(unsigned char *p, u64 v){
  if( v<=0x7f ){
    p[0] = v&0x7f;
    return 1;
  }
  if( v<=0x3fff ){
    p[0] = ((v>>7)&0x7f)|0x80;
    p[1] = v&0x7f;
    return 2;
  }
  return putVarint64(p,v);
}
```

:::

形式はこの関数の直前のコメントで説明されています。

```c:line-numbers=1566

/*
** The variable-length integer encoding is as follows:
**
** KEY:
**         A = 0xxxxxxx    7 bits of data and one flag bit
**         B = 1xxxxxxx    7 bits of data and one flag bit
**         C = xxxxxxxx    8 bits of data
**
**  7 bits - A
** 14 bits - BA
** 21 bits - BBA
** 28 bits - BBBA
** 35 bits - BBBBA
** 42 bits - BBBBBA
** 49 bits - BBBBBBA
** 56 bits - BBBBBBBA
** 64 bits - BBBBBBBBC
*/
```

## 前提知識

- **可変長整数**: 各バイトの最上位ビットを「まだ続くか」の目印（フラグ）にし、残りの 7 ビットにデータを入れる方式です。フラグが 1 なら次のバイトに続き、0 ならそこで終わりです。
- **ビッグエンディアン順**: 上位の桁から順にバイトを並べることです。SQLite の varint は上位の 7 ビットが先頭に来ます。
- **`unsigned char *p`**: 書き込み先のバイト列を指すポインタです。`p[i]` で `i` 番目のバイトに書けます。`u8` は SQLite での `unsigned char`（0〜255）の別名です。
- **`v & 0x7f`**: 下位 7 ビットを取り出します。`| 0x80` は最上位ビット（フラグ）を立てます。
- **`v >>= 7`**: `v` を 7 ビット右にずらして、次の 7 ビットを下に持ってきます。
- **`do { ... } while(条件);`**: 本体を先に 1 回実行してから条件を調べるループです。`v = 0` のときも 1 バイトは書きたいので、この形にしています。
- **`SQLITE_NOINLINE`**: 「この関数をインライン展開（呼び出し元に中身を埋め込む最適化）しないで」とコンパイラに伝える印です。

## 何をしているか

### 1. 1 バイトと 2 バイトの場合

```c:line-numbers=1620
int sqlite3PutVarint(unsigned char *p, u64 v){
  if( v<=0x7f ){
    p[0] = v&0x7f;
    return 1;
  }
  if( v<=0x3fff ){
    p[0] = ((v>>7)&0x7f)|0x80;
    p[1] = v&0x7f;
    return 2;
  }
  return putVarint64(p,v);
}
```

外側の `sqlite3PutVarint` は、よく出る小さな値を先に片付けます。

- `v <= 0x7f`（127 以下）なら 1 バイト。フラグは 0 です。
- `v <= 0x3fff`（16383 以下）なら 2 バイト。1 バイト目に上位 7 ビットとフラグ 1、2 バイト目に下位 7 ビットを書きます。

`v = 300`（2 進数で `10 0101100`）なら、1 バイト目は `0x80 | 2 = 0x82`、2 バイト目は `0x2C` です。
それ以外の大きな値は `putVarint64` に任せます。

### 2. 上位 8 ビットが使われている場合は 9 バイト

```c:line-numbers=1599
  if( v & (((u64)0xff000000)<<32) ){
    p[8] = (u8)v;
    v >>= 8;
    for(i=7; i>=0; i--){
      p[i] = (u8)((v & 0x7f) | 0x80);
      v >>= 7;
    }
    return 9;
  }   
```

`((u64)0xff000000)<<32` は上位 8 ビットのマスクです。ここが 0 でなければ、値は 56 ビットを超えます。
7 ビットずつ 8 バイト使っても 56 ビットしか入らないので、**9 バイト目に残りの 8 ビットをまるごと** 入れます。
まず最下位 8 ビットを `p[8]` に書き、`v` を 8 ビット右にずらし、残り 56 ビットを 7 ビットずつ `p[7]` から `p[0]` へ逆順に書きます。ここではすべてのバイトにフラグを立てます。

### 3. それ以外は下の桁から作って逆順に写す

```c:line-numbers=1608
  n = 0;
  do{
    buf[n++] = (u8)((v & 0x7f) | 0x80);
    v >>= 7;
  }while( v!=0 );
  buf[0] &= 0x7f;
  assert( n<=9 );
  for(i=0, j=n-1; j>=0; j--, i++){
    p[i] = buf[j];
  }
  return n;
```

下位 7 ビットから順に、フラグを立てて `buf` に入れていきます。`v` が 0 になったら終わりです。
`buf[0]` は最下位の 7 ビットで、これが最後のバイトになるので、`buf[0] &= 0x7f;` でフラグを消します。
最後に `buf` を逆順に `p` へ写せば、上位が先頭に来る並びになります。

## ここがすごい

- **最大 9 バイトで 64 ビットを表せる**: 7 ビットずつだと 64 ビットには 10 バイト必要です（7×9 = 63 ビットでは足りない）。SQLite の形式では「9 バイト目は 8 ビット全部がデータ」と決めているので、7×8 + 8 = 64 ビットがちょうど 9 バイトに収まります。9 バイト目のフラグは不要です。9 バイト目が最後だと長さから決まるからです。
- **先頭バイトだけで大小がわかる順番**: 上位の桁を先に書くので、ファイル上でバイトを順に読むだけで値が組み立てられます。
- **よくある場合を外に出す**: 行番号や短い文字列の長さなど、実際の値の多くは 2 バイト以内に収まります。外側の関数をごく短くしてインライン展開されやすくし、重い処理は `SQLITE_NOINLINE` の関数に分けています。よく通る道を短く、まれな道は別の関数へ、という性能の定石です。
- **逆順の問題を一時配列で解く**: 7 ビットの区切りは下の桁からしか決められませんが、書く順番は上の桁からです。いったん `buf` に貯めて逆に写すことで、何バイトになるかを事前に計算しなくて済みます。

## まとめ

- 可変長整数は、各バイトの最上位ビットを「続くか」のフラグにして、小さい数を短く表す。
- 最後のバイトだけ 8 ビットを使うと決めれば、64 ビットを最大 9 バイトに収められる。
- よく出る小さい値は外側の短い関数で処理し、まれな場合を別関数に分けると速くなる。
- 下から決まって上から書く値は、一時配列にためて逆順に写す。
