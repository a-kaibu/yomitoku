---
title: "文字列を、引用符で囲んだ表示用の形に直す"
description: "io_lib:write_string/2 は、文字列を指定の引用符で囲み、中の特別な文字を \\ で逃がして表示用の文字列を作る。引用符そのものは最初に確かめる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/io_lib.erl
lines: [1383, 1391]
function: "io_lib:write_string/2"
difficulty: 3
format: 2
tags: ["文字列処理", "パース", "標準ライブラリ"]
---
## ひとことで

`io_lib:write_string/2` は、文字列をプログラムの中の文字列リテラルと同じ形に直します。
外側を指定の引用符（たとえば `"`）で囲み、中の引用符や `\` は、前に `\` を付けて逃がします。表示やログ出力で、文字列の境界を分かりやすくするために使います。

## コード

::: code-group

```erlang:line-numbers=1383 [日本語訳]
write_string1(_,[], Q) ->
    [Q];
write_string1(Enc,[C|Cs], Q) when is_integer(C) ->
    string_char(Enc,C, Q, write_string1(Enc,Cs, Q)).

string_char(_,Q, Q, Tail) -> [$\\,Q|Tail];	%引用符と同じ文字は、最初に確かめて逃がす
string_char(_,$\\, _, Tail) -> [$\\,$\\|Tail];
string_char(_,C, _, Tail) when C >= $\s, C =< $~ ->
    [C|Tail];
```

```erlang:line-numbers=1383 [原文]
write_string1(_,[], Q) ->
    [Q];
write_string1(Enc,[C|Cs], Q) when is_integer(C) ->
    string_char(Enc,C, Q, write_string1(Enc,Cs, Q)).

string_char(_,Q, Q, Tail) -> [$\\,Q|Tail];	%Must check these first!
string_char(_,$\\, _, Tail) -> [$\\,$\\|Tail];
string_char(_,C, _, Tail) when C >= $\s, C =< $~ ->
    [C|Tail];
```

:::

## 前提知識

- **引用符での囲み**: `write_string/2` の第二引数 `Q` が、外側を囲む文字です。`"` を渡すのが一般的です。
- **エスケープ**: 特別な意味を持つ文字の前に `\` を付けて、普通の文字として扱わせる書き方です。
- **`string_char/4`**: 一文字を、表示用の形に直す補助関数です。
- **`write_string1/3`**: 文字のリストを、一文字ずつ `string_char` に渡して進める関数です。

## 何をしているか

### 1. 文字列の終わりで、引用符を閉じる

```erlang:line-numbers=1383
write_string1(_,[], Q) ->
    [Q];
```

文字のリストが空になったら、引用符 `Q` だけを残します。外側の囲みは、ここで閉じられます。

### 2. 一文字ずつ、表示用の形に直す

```erlang:line-numbers=1385
write_string1(Enc,[C|Cs], Q) when is_integer(C) ->
    string_char(Enc,C, Q, write_string1(Enc,Cs, Q)).
```

先頭の文字 `C` を、残りの文字列の変換結果の前に付けるように、`string_char` に渡します。文字の順番は、そのまま保たれます。

### 3. 引用符と同じ文字は、最初に逃がす

```erlang:line-numbers=1388
string_char(_,Q, Q, Tail) -> [$\\,Q|Tail];	%Must check these first!
```

文字が囲みと同じ引用符 `Q` なら、前に `\` を付けて、`\"` の形にします。この節を最初に書くのは、引用符の判定を先にするためです。

### 4. バックスラッシュも逃がす

```erlang:line-numbers=1389
string_char(_,$\\, _, Tail) -> [$\\,$\\|Tail];
```

文字が `\` なら、`\\` の二文字にします。そうしないと、後ろの文字と合わさって、別の意味になってしまいます。

### 5. 表示できる文字は、そのまま

```erlang:line-numbers=1390
string_char(_,C, _, Tail) when C >= $\s, C =< $~ ->
    [C|Tail];
```

空白から `~` までの印字できる文字は、そのまま残します。

## ここがすごい

### 順番の決まった節で、逃がし方を決める

同じ文字に当たる節が複数あるとき、どれを先に試すかで結果が変わります。
引用符の節を先頭に置くことで、引用符として扱うべき文字が、確実にそちらに当たります。節の並びが、文字の意味の優先順位を表しています。

### 逃がす文字を、一文字ずつ判断する

文字列全体を、特別な関数で一度に変換するのではありません。
一文字ずつ、節で「どう表すか」を決めています。新しい特別な文字を扱うときは、節を一つ足すだけで済みます。

### 再帰で、後ろから組み立てる

`write_string1` は、一文字の結果を、残りの変換結果の前に付けていきます。
結果のリストは、元の文字列の順番を保ったままです。表示用の文字列が、先頭から正しく並びます。

## まとめ

`io_lib:write_string("a\"b", $")` は、外側に引用符を付け、中の引用符を `\"` にした表示用の形を返します。
表示したとき、文字列の範囲が、はっきり見えるようになります。
