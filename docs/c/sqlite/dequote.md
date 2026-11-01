---
title: "2 つの添字で、引用符をその場ではがす"
description: "SQL の 'it''s' や \"col\" や [name] から引用符を取り除く関数。読む位置と書く位置を別々の添字で持ち、新しいメモリを確保せずに文字列を詰めていく。"
language: c
project: SQLite
repo: https://github.com/sqlite/sqlite
license: blessing
copyright: "The author disclaims copyright to this source code."
commit: "3044c8b3b2be8f2fff54bb8357aa5377c01570c6"
file: src/util.c
lines: [288, 326]
function: "sqlite3Dequote"
difficulty: 1
format: 2
tags: [文字列処理, パース, イディオム]
---

## ひとことで

`sqlite3Dequote` は、SQL で引用符に囲まれた文字列から **引用符を取り除く** 関数です。
たとえば `'it''s'` は `it's` に、`"my col"` は `my col` に、`[a-b-c]` は `a-b-c` になります。
新しいメモリを確保せず、**元の文字列を上書きしながら** 結果を作るのが特徴です。

## コード

::: code-group

```c:line-numbers=288 [日本語訳]
/*
** SQL 風の引用符付き文字列から引用符を取り除いて、ふつうの文字列に
** 変換する。変換はその場で行う。入力が引用符で始まって
** いなければ、この関数は何もしない。
** （何もしない）
**
** 入力文字列は 0 で終わっていなければならない。引用符を外した文字列にも
** 新しく終端の 0 が付けられる。
**
** 戻り値は、引用符を外さなかったときは -1、外したときは
** 外した後の文字列の長さ（終端の 0 は含まない）。
** （となる）
**
** 2002-02-14: MS-Access 風に識別子を囲む角かっこも取り除くよう
** 拡張した。たとえば "[a-b-c]" は
** "a-b-c" になる。
*/
void sqlite3Dequote(char *z){
  char quote;
  int i, j;
  if( z==0 ) return;
  quote = z[0];
  if( !sqlite3Isquote(quote) ) return;
  if( quote=='[' ) quote = ']';
  for(i=1, j=0;; i++){
    assert( z[i] );
    if( z[i]==quote ){
      if( z[i+1]==quote ){
        z[j++] = quote;
        i++;
      }else{
        break;
      }
    }else{
      z[j++] = z[i];
    }
  }
  z[j] = 0;
}
```

```c:line-numbers=288 [原文]
/*
** Convert an SQL-style quoted string into a normal string by removing
** the quote characters.  The conversion is done in-place.  If the
** input does not begin with a quote character, then this routine
** is a no-op.
**
** The input string must be zero-terminated.  A new zero-terminator
** is added to the dequoted string.
**
** The return value is -1 if no dequoting occurs or the length of the
** dequoted string, exclusive of the zero terminator, if dequoting does
** occur.
**
** 2002-02-14: This routine is extended to remove MS-Access style
** brackets from around identifiers.  For example:  "[a-b-c]" becomes
** "a-b-c".
*/
void sqlite3Dequote(char *z){
  char quote;
  int i, j;
  if( z==0 ) return;
  quote = z[0];
  if( !sqlite3Isquote(quote) ) return;
  if( quote=='[' ) quote = ']';
  for(i=1, j=0;; i++){
    assert( z[i] );
    if( z[i]==quote ){
      if( z[i+1]==quote ){
        z[j++] = quote;
        i++;
      }else{
        break;
      }
    }else{
      z[j++] = z[i];
    }
  }
  z[j] = 0;
}
```

:::

`sqlite3Isquote` は `src/sqliteInt.h` で、文字の種類を引く表 `sqlite3CtypeMap` を使って定義されています。`"` `'` `[` `` ` `` の 4 文字でビット `0x80` が立っています。

<!-- source: src/sqliteInt.h -->
```c:line-numbers=4797
# define sqlite3Isquote(x)   (sqlite3CtypeMap[(unsigned char)(x)]&0x80)
```

## 前提知識

- **`char *z`**: 文字の並び（文字列）の先頭を指すポインタです。`z[i]` で `i` 番目の文字を読み書きできます。C の文字列は最後に値 `0` の文字（終端文字）を置いて終わりを示します。
- **その場で書き換える（in-place）**: 結果を新しい場所に作るのではなく、入力の文字列そのものを書き換える方法です。メモリ確保が要らず、速くて失敗しません。
- **SQL の引用符**: SQL では `'...'` が文字列、`"..."` が列名などの識別子です。中に同じ引用符を入れたいときは `''` のように 2 つ重ねます。SQLite は互換性のため、MS Access 風の `[...]` や MySQL 風の `` `...` `` も識別子として受け付けます。
- **`for(i=1, j=0;; i++)`**: 初期化で 2 つの変数を同時に設定し、終了条件を空にした無限ループです。抜けるときは中の `break` を使います。
- **`z[j++] = quote;`**: `z[j]` に代入してから `j` を 1 増やします。後置の `++` は「使ってから増やす」です。
- **`assert`**: 条件が偽ならデバッグビルドでプログラムを止めるマクロです。「ここでは必ずこうなっている」という前提を書いておくものです。

## 何をしているか

### 1. 引用符で始まっていなければ何もしない

```c:line-numbers=307
  int i, j;
  if( z==0 ) return;
  quote = z[0];
  if( !sqlite3Isquote(quote) ) return;
```

ヌルポインタなら即座に戻ります。先頭の文字 `z[0]` を `quote` に入れ、それが引用符でなければ戻ります。
先頭が `[` の場合は、閉じ側の文字は `]` なので、`if( quote=='[' ) quote = ']';` で `quote` を `]` に置き換えます。
これ以降は「`quote` が来たら終わり」というルールだけで、4 種類の引用符を同じように扱えます。

### 2. 読む添字 i と書く添字 j

```c:line-numbers=311
  if( quote=='[' ) quote = ']';
  for(i=1, j=0;; i++){
    assert( z[i] );
    if( z[i]==quote ){
      if( z[i+1]==quote ){
        z[j++] = quote;
        i++;
      }else{
        break;
      }
    }else{
      z[j++] = z[i];
    }
```

`i` は読む位置で、引用符の次（1）から始まります。`j` は書く位置で、先頭（0）から始まります。
引用符を飛ばして読むので、`j` はいつも `i` 以下です。そのため、まだ読んでいない文字を上書きしてしまう心配がありません。

`'it''s'` で追ってみます（`z` は `' i t ' ' s '` の 7 文字）。

- `i=1` の `i`、`i=2` の `t` は普通の文字なので、`z[0]`、`z[1]` に写します。
- `i=3` の `'` は `quote` と同じです。次の `z[4]` も `'` なので「重ねた引用符」と判断し、`'` を 1 つだけ `z[2]` に書いて、`i++` で 1 つ余分に進みます。
- `i=5` の `s` を `z[3]` に写します。
- `i=6` の `'` は `quote` で、次は終端文字なので `break` します。

### 3. 終端文字を置く

```c:line-numbers=325
  z[j] = 0;
```

最後に `z[j] = 0;` で、詰めた文字列の直後に終端文字を置きます。上の例では `z[4]` が 0 になり、`z` は `it's` という文字列になります。

## ここがすごい

- **2 本の添字で「読みながら詰める」**: 文字を取り除く処理は、取り除くたびに後ろを前へずらすと手間がかかります。読む位置と書く位置を分ければ、1 回なめるだけで済みます。配列から不要な要素を消すときにも使える、汎用的なイディオムです。
- **閉じ文字だけを覚える**: `[` を `]` に置き換えた時点で、あとは「閉じ文字が来たかどうか」だけを考えればよくなります。4 種類の引用符を `if` の分岐なしで同じループに通しています。
- **表引きで判定する**: `sqlite3Isquote` は 4 回の比較ではなく、256 要素の表を 1 回引くだけで判定します。この表には「空白か」「数字か」なども別のビットで入っており、1 つの表で多くの判定をまかなっています。
- **前提を `assert` で明示**: ループには終了条件がなく、閉じ引用符があることを前提にしています。`assert( z[i] )` は「終端文字に出会う前に必ず閉じ引用符がある」という前提をデバッグ時に確かめるためのものです。トークナイザ（字句解析器）が閉じ引用符のある文字列しか渡さないことに依存しています。

なお、関数の上のコメントには「戻り値は -1 か長さ」と書かれていますが、関数は `void` で何も返しません。コメントが古いまま残っている例で、コメントよりコードを信じて読むべき場面もあるとわかります。

## まとめ

- 文字を取り除くときは「読む添字」と「書く添字」を分けると、その場で 1 回の走査で済む。
- 書く位置が読む位置を追い越さなければ、上書きしても安全。
- 開きと閉じが違う括弧は、最初に閉じ側へ変換すると処理を共通化できる。
- 文字の分類は表引き＋ビットマスクにすると、速く、まとめて管理できる。
