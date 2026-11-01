---
title: "「まず同じかだけ見る」大文字小文字を無視した文字列比較"
description: "SQLite 独自の stricmp。等しい文字は表を引かずに素通りし、違うときだけ小文字化表で差を取る。ロケールに左右されない比較と、ヌルポインタの扱いを外側の関数に分けた設計。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [405, 441]
function: "sqlite3_stricmp / sqlite3StrICmp"
difficulty: 1
format: 2
tags: [文字列処理, 最適化, 移植性]
---

## ひとことで

`sqlite3StrICmp` は、2 つの文字列を **大文字と小文字を区別せずに** 比べる関数です。
`sqlite3StrICmp("Select", "SELECT")` は 0（等しい）を返し、`"abc"` と `"ABD"` なら負の値を返します。
SQLite は SQL のキーワードや列名をこの規則で比べています。外側の `sqlite3_stricmp` は公開 API で、ヌルポインタの扱いだけを担当します。

## コード

::: code-group

```c:line-numbers=405 [日本語訳]
/*
** stricmp() を持つシステムもあれば、strcasecmp() を持つシステムもある。
** 一貫性がないので、自前で定義する。
**
** 仕様 R-30243-02494 の実装: sqlite3_stricmp() と
** sqlite3_strnicmp() の API により、アプリケーションや拡張機能は
** UTF-8 文字列を入れた 2 つのバッファの中身を、
** 大文字小文字を区別せずに比較できる。その「大文字小文字の
** 区別なし」の定義は、SQLite が識別子の比較で内部的に使うものと同じ。
*/
int sqlite3_stricmp(const char *zLeft, const char *zRight){
  if( zLeft==0 ){
    return zRight ? -1 : 0;
  }else if( zRight==0 ){
    return 1;
  }
  return sqlite3StrICmp(zLeft, zRight);
}
int sqlite3StrICmp(const char *zLeft, const char *zRight){
  unsigned char *a, *b;
  int c, x;
  a = (unsigned char *)zLeft;
  b = (unsigned char *)zRight;
  for(;;){
    c = *a;
    x = *b;
    if( c==x ){
      if( c==0 ) break;
    }else{
      c = (int)UpperToLower[c] - (int)UpperToLower[x];
      if( c ) break;
    }
    a++;
    b++;
  }
  return c;
}
```

```c:line-numbers=405 [原文]
/*
** Some systems have stricmp().  Others have strcasecmp().  Because
** there is no consistency, we will define our own.
**
** IMPLEMENTATION-OF: R-30243-02494 The sqlite3_stricmp() and
** sqlite3_strnicmp() APIs allow applications and extensions to compare
** the contents of two buffers containing UTF-8 strings in a
** case-independent fashion, using the same definition of "case
** independence" that SQLite uses internally when comparing identifiers.
*/
int sqlite3_stricmp(const char *zLeft, const char *zRight){
  if( zLeft==0 ){
    return zRight ? -1 : 0;
  }else if( zRight==0 ){
    return 1;
  }
  return sqlite3StrICmp(zLeft, zRight);
}
int sqlite3StrICmp(const char *zLeft, const char *zRight){
  unsigned char *a, *b;
  int c, x;
  a = (unsigned char *)zLeft;
  b = (unsigned char *)zRight;
  for(;;){
    c = *a;
    x = *b;
    if( c==x ){
      if( c==0 ) break;
    }else{
      c = (int)UpperToLower[c] - (int)UpperToLower[x];
      if( c ) break;
    }
    a++;
    b++;
  }
  return c;
}
```

:::

`UpperToLower` は `sqlite3UpperToLower` の別名として定義されています。これは `src/global.c` にある 256 要素の表で、`'A'`〜`'Z'`（65〜90）の位置に `'a'`〜`'z'`（97〜122）が入り、それ以外は自分自身の値が入っています。

```c:line-numbers=403
#define UpperToLower sqlite3UpperToLower
```

## 前提知識

- **`const char *`**: 書き換えない文字列の先頭を指すポインタです。C の文字列は値 0 の文字で終わります。
- **比較関数の戻り値**: C の `strcmp` などは、左が小さければ負、等しければ 0、左が大きければ正を返す約束です。並べ替えにそのまま使えます。
- **`zRight ? -1 : 0`**: 条件演算子です。`zRight` が 0（ヌル）でなければ -1、ヌルなら 0 になります。
- **`(unsigned char *)` へのキャスト**: `char` は環境によって符号付き（-128〜127）のことがあります。表の添字に使うと負の添字になる危険があるので、0〜255 の `unsigned char` として読みます。
- **`*a`**: ポインタ `a` が指している 1 文字を読みます。`a++` でポインタを次の文字へ進めます。
- **`for(;;)`**: 条件のない無限ループです。`break` で抜けます。
- **ロケール**: 国や言語ごとの設定です。標準の `tolower` はロケールによって結果が変わることがあります。

## 何をしているか

### 1. 公開 API はヌルの扱いだけを決める

```c:line-numbers=415
int sqlite3_stricmp(const char *zLeft, const char *zRight){
  if( zLeft==0 ){
    return zRight ? -1 : 0;
  }else if( zRight==0 ){
    return 1;
  }
  return sqlite3StrICmp(zLeft, zRight);
}
```

`sqlite3_stricmp` は、ヌルポインタを「どの文字列よりも小さい」として扱います。
両方ヌルなら 0、左だけヌルなら -1、右だけヌルなら 1 を返します。
どちらもヌルでなければ、本体の `sqlite3StrICmp` に任せます。

### 2. 1 文字ずつ読み、同じならそのまま進む

```c:line-numbers=428
  for(;;){
    c = *a;
    x = *b;
    if( c==x ){
      if( c==0 ) break;
    }else{
```

`c` と `x` に 1 文字ずつ読み込み、`c==x` なら、それが終端の 0 かどうかだけを見ます。
0 なら両方の文字列が同時に終わったということなので、`break` して `c`（つまり 0）を返します。

### 3. 違うときだけ表を引く

```c:line-numbers=434
      c = (int)UpperToLower[c] - (int)UpperToLower[x];
      if( c ) break;
    }
```

文字が違うときは、表で両方を小文字にしてから引き算します。差が 0 でなければ、それが答えです。

`"Select"` と `"SELECT"` で追ってみます。

- 1 文字目は `'S'` と `'S'` で同じなので、表を引かずに進みます。
- 2 文字目は `'e'`（101）と `'E'`（69）で違います。表を引くと両方 101 になり、差は 0 なので続行します。
- 最後まで同じことが続き、両方の終端 0 に着いたところで 0 を返します。

`"abc"` と `"ABD"` なら、3 文字目で `'c'`（99）と `'d'`（100）の差 -1 が返ります。

## ここがすごい

- **よくある場合を先に片付ける**: 比べる文字列はたいてい大文字小文字まで同じです。`c==x` のときは表を引かないので、メモリの読み込みが 1 回減ります。違うときだけ「本当に違うのか、大文字小文字の違いだけなのか」を表で確かめます。
- **終端の判定がついでに済む**: 片方だけが終わった場合、0 と別の文字は必ず違う値になるので、自然に 3 の分岐に入り、差が負や正になって止まります。終端の判定は「両方同じで、しかも 0」のときだけでよく、ループの条件が単純になっています。
- **ロケールに左右されない**: 標準の `tolower` は環境のロケールで結果が変わる可能性があります。たとえばトルコ語の設定では `I` の小文字が `i` ではなくなることが知られています。SQL のキーワード比較が環境で変わっては困るので、ASCII だけを対象にした自前の表を使っています。表の 128 以上の部分は自分自身なので、UTF-8 の多バイト文字はそのまま比べられます。
- **API と内部関数を分ける**: ヌルを受け付けるのは外向けの `sqlite3_stricmp` だけで、内部の `sqlite3StrICmp` はヌルが来ない前提で速く書かれています。呼び出しの多い内部処理から、不要な検査を外しているのです。
- **移植性の問題を自前で解決**: 冒頭のコメントにあるとおり、`stricmp` と `strcasecmp` のどちらがあるかは環境によって違います。自前で書けば、どの環境でも同じ名前・同じ動作になります。

## まとめ

- 文字が一致するよくある場合を先に処理し、違うときだけ重い処理をすると速くなる。
- 文字を表の添字にするときは `unsigned char` にして負の添字を防ぐ。
- 大文字小文字の変換は、ロケールに依存しない表を自前で持つと動作が安定する。
- ヌルの扱いのような外向けの防御は API の入り口にまとめ、内部関数は軽く保つ。
