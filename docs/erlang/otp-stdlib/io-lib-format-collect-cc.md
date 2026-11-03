---
title: "書式指定子の種類ごとに、必要な引数の数を決める"
description: "io_lib_format:collect_cc/2 は、format の書式指定子（~w や ~x など）ごとに、いくつの引数を取るかを決めて切り出す。引数の数の違いを、リストのパターンだけで表している。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/io_lib_format.erl
lines: [295, 312]
function: "io_lib_format:collect_cc/2"
difficulty: 2
format: 2
tags: ["文字列処理", "パース", "イディオム"]
---
## ひとことで

`io_lib_format:collect_cc/2` は、`io:format` などの書式文字列の中で、`~` の後に続く制御文字（`w`、`p`、`x` など）を 1 つ読み取ります。その指定子が使う引数を、引数リストから必要な分だけ切り出して返します。
引数の数は指定子ごとに違うので、関数の節をそれぞれ書いて、その違いを表しています。

## コード

```erlang:line-numbers=295
collect_cc([$w|Fmt], [A|Args]) -> {$w,[A],Fmt,Args};
collect_cc([$p|Fmt], [A|Args]) -> {$p,[A],Fmt,Args};
collect_cc([$W|Fmt], [A,Depth|Args]) -> {$W,[A,Depth],Fmt,Args};
collect_cc([$P|Fmt], [A,Depth|Args]) -> {$P,[A,Depth],Fmt,Args};
collect_cc([$s|Fmt], [A|Args]) -> {$s,[A],Fmt,Args};
collect_cc([$e|Fmt], [A|Args]) -> {$e,[A],Fmt,Args};
collect_cc([$f|Fmt], [A|Args]) -> {$f,[A],Fmt,Args};
collect_cc([$g|Fmt], [A|Args]) -> {$g,[A],Fmt,Args};
collect_cc([$b|Fmt], [A|Args]) -> {$b,[A],Fmt,Args};
collect_cc([$B|Fmt], [A|Args]) -> {$B,[A],Fmt,Args};
collect_cc([$x|Fmt], [A,Prefix|Args]) -> {$x,[A,Prefix],Fmt,Args};
collect_cc([$X|Fmt], [A,Prefix|Args]) -> {$X,[A,Prefix],Fmt,Args};
collect_cc([$+|Fmt], [A|Args]) -> {$+,[A],Fmt,Args};
collect_cc([$#|Fmt], [A|Args]) -> {$#,[A],Fmt,Args};
collect_cc([$c|Fmt], [A|Args]) -> {$c,[A],Fmt,Args};
collect_cc([$~|Fmt], Args) when is_list(Args) -> {$~,[],Fmt,Args};
collect_cc([$n|Fmt], Args) when is_list(Args) -> {$n,[],Fmt,Args};
collect_cc([$i|Fmt], [A|Args]) -> {$i,[A],Fmt,Args}.
```

## 前提知識

- **書式文字列**: `io:format("~w は ~p~n", [A, B])` のように、`~` で始まる指定子を含む文字列です。指定子ごとに、表示の仕方が決まります。
- **文字コード `$w`**: Erlang では、文字 `w` の文字コードを `$w` と書きます。`$` は文字を表す記号です。
- **`[$w|Fmt]`**: 書式文字列の先頭の文字が `w` で、残りが `Fmt` であることを表すパターンです。
- **`[A|Args]`**: 引数リストの先頭 `A` と、残りの `Args` です。
- **`{...}` の 4 要素**: 指定子、取り出した引数のリスト、書式の残り、引数の残り、の 4 つを返します。
- **`~n` と `~~`**: 改行と、チルダそのものを表す指定子です。引数は使いません。

## 何をしているか

### 1. 引数を 1 つ使う指定子

```erlang:line-numbers=295
collect_cc([$w|Fmt], [A|Args]) -> {$w,[A],Fmt,Args};
collect_cc([$p|Fmt], [A|Args]) -> {$p,[A],Fmt,Args};
```

`~w`（式を読みやすく表示）や `~p`（整形して表示）は、引数を 1 つ使います。`[A|Args]` で先頭の引数を取り出し、`[A]` として返します。残りの引数はそのまま `Args` に残します。

### 2. 引数を 2 つ使う指定子

```erlang:line-numbers=297
collect_cc([$W|Fmt], [A,Depth|Args]) -> {$W,[A,Depth],Fmt,Args};
collect_cc([$P|Fmt], [A,Depth|Args]) -> {$P,[A,Depth],Fmt,Args};
```

`~W` と `~P` は、表示する値のほかに、深さの制限（`Depth`）を取ります。そのため、引数リストから 2 つ取り出します。

### 3. 数値や文字列の指定子

```erlang:line-numbers=299
collect_cc([$s|Fmt], [A|Args]) -> {$s,[A],Fmt,Args};
collect_cc([$e|Fmt], [A|Args]) -> {$e,[A],Fmt,Args};
collect_cc([$f|Fmt], [A|Args]) -> {$f,[A],Fmt,Args};
collect_cc([$g|Fmt], [A|Args]) -> {$g,[A],Fmt,Args};
collect_cc([$b|Fmt], [A|Args]) -> {$b,[A],Fmt,Args};
collect_cc([$B|Fmt], [A|Args]) -> {$B,[A],Fmt,Args};
```

`~s`、`~e`、`~f`、`~g`、`~b`、`~B` は、引数を 1 つ使う指定子です。どれも、表示の形式だけが違い、取り出し方は同じです。

### 4. 接頭辞を取る指定子

```erlang:line-numbers=305
collect_cc([$x|Fmt], [A,Prefix|Args]) -> {$x,[A,Prefix],Fmt,Args};
collect_cc([$X|Fmt], [A,Prefix|Args]) -> {$X,[A,Prefix],Fmt,Args};
```

`~x` と `~X` は、値の後に「接頭辞」（`Prefix`）を取ります。そのため、引数を 2 つ使います。

### 5. 引数を使わない指定子

```erlang:line-numbers=310
collect_cc([$~|Fmt], Args) when is_list(Args) -> {$~,[],Fmt,Args};
collect_cc([$n|Fmt], Args) when is_list(Args) -> {$n,[],Fmt,Args};
```

`~~`（チルダ）と `~n`（改行）は、引数を使いません。`is_list(Args)` の確認だけをして、空のリストを `[]` として返します。
`~i`（無視）は、1 つの引数を読み捨てる指定子です。最後の節で、引数を 1 つ取ります。

## ここがすごい

### 引数の数を、パターンの形で書いている

書式指定子ごとに、必要な引数の数は違います。それを `if` や表で管理するのではなく、`[A, Depth|Args]` のようなリストのパターンで書いています。
どの指定子が何個の引数を使うかは、関数の節を見ればわかります。

### 指定子の種類と引数の取り方を分けている

この関数は、指定子の文字を見て、取り出した引数と残りの書式を返すだけです。実際の文字列を作るのは、別の関数の仕事です。
この分離によって、引数の取り出しを 1 か所で確かめられます。書式の解析と表示の処理を、読みやすく分けています。

## まとめ

- 書式指定子の種類ごとに、必要な引数の数は違います。
- 引数の数をパターンの形で書くと、どの指定子がいくつ引数を取るかが一目でわかります。
- 指定子の解析と、文字列の生成を分けると、それぞれを読みやすくなります。
