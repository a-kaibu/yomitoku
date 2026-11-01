---
title: "マスクせずに XOR で消す、可変長整数の高速な読み取り"
description: "SQLite の可変長整数を読み出す関数。各バイトのフラグビットを 1 つずつ & で消す代わりに、シフトしたまま積み上げて最後に定数との XOR でまとめて消すという技を使う。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [1633, 1671]
function: "sqlite3GetVarint"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, ハック]
---

## ひとことで

`sqlite3GetVarint` は、SQLite の **可変長整数（varint）** をメモリから読み取り、値を `*v` に入れて、読んだバイト数（1〜9）を返す関数です。
varint は各バイトの最上位ビットを「次のバイトに続く」という目印にし、残りの 7 ビットにデータを入れる形式です。
この関数は目印のビットを毎回消すのではなく、**最後に XOR でまとめて消す** という珍しい書き方をしています。

## コード

::: code-group

```c:line-numbers=1633 [日本語訳]
/*
** p[0] から始まるメモリから 64 ビットの可変長整数を読む。
** 読んだバイト数を返す。値は *v に格納する。
*/
u8 sqlite3GetVarint(const unsigned char *p, u64 *v){
  u64 iKey = p[0];
  const u8 *pStart = p;
  if( iKey>=0x80 ){
    u8 x;
    iKey = (iKey<<7) ^ (x = *++p);
    if( x>=0x80 ){
      iKey = (iKey<<7) ^ (x = *++p);
      if( x>=0x80 ){
        iKey = (iKey<<7) ^ 0x10204000 ^ (x = *++p);
        if( x>=0x80 ){
          iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
          if( x>=0x80 ){
            iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
            if( x>=0x80 ){
              iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
              if( x>=0x80 ){
                iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
                if( x>=0x80 ){
                  iKey = (iKey<<8) ^ 0x8000 ^ (*++p);
                }
              }
            }
          }
        }
      }else{
        iKey ^= 0x204000;
      }
    }else{
      iKey ^= 0x4000;
    }
  }
  *v = iKey;
  return (u8)(p - pStart) + 1;
}
```

```c:line-numbers=1633 [原文]
/*
** Read a 64-bit variable-length integer from memory starting at p[0].
** Return the number of bytes read.  The value is stored in *v.
*/
u8 sqlite3GetVarint(const unsigned char *p, u64 *v){
  u64 iKey = p[0];
  const u8 *pStart = p;
  if( iKey>=0x80 ){
    u8 x;
    iKey = (iKey<<7) ^ (x = *++p);
    if( x>=0x80 ){
      iKey = (iKey<<7) ^ (x = *++p);
      if( x>=0x80 ){
        iKey = (iKey<<7) ^ 0x10204000 ^ (x = *++p);
        if( x>=0x80 ){
          iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
          if( x>=0x80 ){
            iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
            if( x>=0x80 ){
              iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
              if( x>=0x80 ){
                iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
                if( x>=0x80 ){
                  iKey = (iKey<<8) ^ 0x8000 ^ (*++p);
                }
              }
            }
          }
        }
      }else{
        iKey ^= 0x204000;
      }
    }else{
      iKey ^= 0x4000;
    }
  }
  *v = iKey;
  return (u8)(p - pStart) + 1;
}
```

:::

形式は同じファイルの、可変長整数の書き込み関数の前にあるコメントで説明されています。上位の 7 ビットから順に並び、9 バイト目だけは 8 ビットすべてがデータです。

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

- **`const unsigned char *p`**: 読み取るバイト列を指すポインタです。`p[0]` が先頭のバイトです。
- **`*++p`**: ポインタ `p` を 1 つ進めてから、その位置のバイトを読みます。
- **`(x = *++p)`**: 読んだバイトを `x` に代入し、その値を式の値としても使います。代入しながら計算に使う書き方です。
- **`<<`（左シフト）**: ビットを左にずらします。`iKey << 7` は 128 倍と同じで、下に 7 ビットの空きを作ります。
- **`^`（XOR、排他的論理和）**: 同じビット同士なら 0、違えば 1 です。重要な性質は、**同じ値で 2 回 XOR すると元に戻る** ことと、**重なっていないビット同士なら XOR は OR（足し合わせ）と同じ** になることです。
- **`u64 *v`**: 結果の書き込み先です。戻り値はバイト数に使うので、値はポインタで返します。
- **`p - pStart`**: ポインタ同士の引き算で、その間に何個の要素があるかがわかります。

## 何をしているか

### 1. 1 バイトだけの場合

```c:line-numbers=1638
  u64 iKey = p[0];
  const u8 *pStart = p;
  if( iKey>=0x80 ){
```

先頭のバイトを `iKey` に入れます。`0x80` 未満（フラグが 0）なら、それがそのまま値で、1 を返します。

### 2. 2 バイトの場合

```c:line-numbers=1642
    iKey = (iKey<<7) ^ (x = *++p);
```

```c:line-numbers=1666
      iKey ^= 0x4000;
```

フラグ付きの 1 バイト目を 7 ビット左にずらし、2 バイト目を XOR で下に入れます。
このとき、1 バイト目のフラグ（ビット 7）は 7 ビットずれてビット 14、つまり `0x4000` の位置に残っています。
2 バイト目にフラグがなければ、`iKey ^= 0x4000` でそれを消します。

具体例で、`0x82 0x2C` を読むと、`(0x82 << 7) ^ 0x2C = 0x4100 ^ 0x2C = 0x412C` です。ここから `0x4000` を消して `0x12C` = 300 になります。

### 3. 3 バイトの場合

```c:line-numbers=1644
      iKey = (iKey<<7) ^ (x = *++p);
```

```c:line-numbers=1663
        iKey ^= 0x204000;
```

さらに 7 ビットずらすと、1 バイト目のフラグはビット 21（`0x200000`）、2 バイト目のフラグはビット 14（`0x4000`）に来ます。
3 バイト目で終わるなら、`iKey ^= 0x204000;` で `0x204000` と XOR して、2 つのフラグを同時に消します。

### 4. 4 バイト以上の場合

```c:line-numbers=1646
        iKey = (iKey<<7) ^ 0x10204000 ^ (x = *++p);
        if( x>=0x80 ){
          iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
          if( x>=0x80 ){
            iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
            if( x>=0x80 ){
              iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
              if( x>=0x80 ){
                iKey = (iKey<<7) ^ 0x4000 ^ (x = *++p);
                if( x>=0x80 ){
                  iKey = (iKey<<8) ^ 0x8000 ^ (*++p);
```

4 バイト目を入れるときは、`0x10204000` と XOR しています。これは、それまでの 3 つのフラグ（ビット 28、21、14）を **先に** まとめて消す値です。
この後は、1 バイト進むたびに `0x4000` を XOR して、直前のバイトのフラグだけを消していきます。
9 バイト目（`iKey = (iKey<<8) ^ 0x8000 ^ (*++p);`）は 8 ビットすべてがデータなので、8 ビットずらし、直前のフラグは `0x8000` の位置になります。

### 5. 読んだバイト数を返す

```c:line-numbers=1669
  *v = iKey;
  return (u8)(p - pStart) + 1;
```

`p` は最後に読んだバイトを指しているので、`p - pStart + 1` が読んだバイト数です。

## ここがすごい

- **マスクを毎回しない**: 素直に書くと `iKey = (iKey<<7) | (x & 0x7f)` のように、毎回 AND でフラグを消してから足します。この関数は `& 0x7f` を省き、フラグを入れたまま積み上げます。フラグがどこにずれていくかはバイト数だけで決まるので、終わったときに定数 1 つと XOR すれば全部消せます。1 バイトごとの演算が 1 つ減ります。
- **XOR だから「入れる」と「消す」が同じ演算**: シフトした値の下 7 ビットは必ず空いているので、新しいバイトを XOR で入れても OR と同じ結果になります。そしてフラグを消すときも、同じ XOR が使えます。入れるのも消すのも `^` で統一されています。
- **ネストした `if` で分岐を展開**: ループではなく、バイト数ごとに `if` を入れ子にしています。各段で何ビット目にフラグが残っているかがコンパイル時に決まるので、消すための定数もそれぞれ固定値として書けます。ループのカウンタも要りません。
- **途中で先回りして消す**: 4 バイト目で `0x10204000` を消すのは、それ以上ずらすとフラグが上位にはみ出して 64 ビットからこぼれていくためです。こぼれる前に消しておけば、以降は「直前の 1 つ」だけを消せばよくなります。
- **小さい値ほど速い**: 1 バイトなら比較 1 回で終わります。データベースに保存される値の多くは小さいので、よく通る道が最短になっています。

## まとめ

- 可変長整数の読み取りでは、フラグビットを毎回マスクする代わりに、最後に定数との XOR でまとめて消せる。
- 重なりのないビット同士の XOR は OR と同じ。消すのも同じ XOR でできる。
- 繰り返し回数が小さく固定なら、ループを入れ子の `if` に展開して定数を埋め込める。
- よく出る短い入力ほど早く終わるように、分岐の順番を設計する。
