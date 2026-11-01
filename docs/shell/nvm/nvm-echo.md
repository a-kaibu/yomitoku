---
title: "echo を使わずに「確実に 1 行出力する」関数"
description: "シェルごとに挙動がばらばらな echo を避け、printf で文字列をそのまま 1 行出力する nvm の基本関数。zsh 対策の分岐も入っている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [21, 29]
function: "nvm_echo"
difficulty: 1
format: 2
tags: [移植性, 入出力, イディオム]
---
## ひとことで

`nvm_echo` は、受け取った引数を **そのまま 1 行で表示する** だけの関数です。`nvm_echo hello world` とすれば `hello world` と表示されます。

「それなら `echo` でいいのでは？」と思うかもしれません。ところが `echo` は、シェルの種類によって動きが微妙に違う、意外とやっかいなコマンドです。nvm は bash・zsh・dash・ksh など多くのシェルで動く必要があるため、こうした小さな関数を用意して出力の仕方を統一しています。

## コード

::: code-group

```sh:line-numbers=21 [日本語訳]
nvm_echo() {
  # zsh では `command printf` は組み込みを飛ばして `/usr/bin/printf` を実行してしまう
  if [ -n "${ZSH_VERSION-}" ]; then
    # shellcheck: SC3044 の警告を無効化
    builtin printf %s\\n "$*" 2>/dev/null
  else
    command printf %s\\n "$*" 2>/dev/null
  fi
}
```

```sh:line-numbers=21 [原文]
nvm_echo() {
  # in zsh, `command printf` skips the builtin and runs `/usr/bin/printf`
  if [ -n "${ZSH_VERSION-}" ]; then
    # shellcheck disable=SC3044
    builtin printf %s\\n "$*" 2>/dev/null
  else
    command printf %s\\n "$*" 2>/dev/null
  fi
}
```

:::

## 前提知識

- **関数定義 `名前() { ... }`**: シェルスクリプトでは、このように書くと関数を定義できます。呼び出すときはコマンドと同じように `nvm_echo 引数1 引数2` と書きます。
- **`"$*"`**: 関数に渡されたすべての引数を、スペースでつないだ **1 つの文字列** にしたものです。`nvm_echo a b c` なら `"a b c"` になります。
- **`printf 書式 値`**: C 言語の `printf` に似たコマンドで、書式どおりに値を表示します。`%s` は「文字列をそのまま入れる場所」、`\n` は改行です。
- **`%s\\n` の `\\`**: シェルではクォートしていない `\` が特別な意味を持つため、`\\` と書いて「文字としての `\`」を `printf` に渡しています。`printf` から見ると書式は `%s\n` です。
- **`${ZSH_VERSION-}`**: 変数 `ZSH_VERSION` の値を取り出します。`-` の後ろは「変数が未定義のときに使う値」で、ここでは空です。zsh の中では自動的にバージョン番号が入っているので、**「今 zsh で動いているか」の判定** に使えます。
- **`[ -n 文字列 ]`**: 文字列が空でなければ真になるテストです。
- **`builtin` と `command`**: `builtin printf` は「シェルに組み込まれた printf を使え」、`command printf` は「同名の関数やエイリアスを無視してコマンドを使え」という指示です。
- **`2>/dev/null`**: エラー出力（2 番）を捨てる書き方です。

## 何をしているか

### zsh かどうかで分岐する

```sh:line-numbers=23
  if [ -n "${ZSH_VERSION-}" ]; then
```


まず `ZSH_VERSION` が空でないかを調べ、zsh で動いているかを判定します。

### printf で 1 行出力する

```sh:line-numbers=22
  # in zsh, `command printf` skips the builtin and runs `/usr/bin/printf`
```


どちらの分岐でもやっていることは同じで、`printf %s\n "$*"` を実行します。たとえば `nvm_echo '-n' 'foo'` と呼ぶと、`"$*"` は `-n foo` という 1 つの文字列になり、`%s` の位置にそのまま入って `-n foo` と表示されます。

違いは `builtin` と `command` の使い分けだけです。コメントにあるとおり、zsh では `command printf` と書くと組み込みの printf ではなく `/usr/bin/printf` という外部コマンドが実行されてしまいます。zsh 以外のシェルでは `command printf` で組み込みの printf が選ばれます。どちらのシェルでも「ユーザーが定義したかもしれない `printf` 関数やエイリアスを避けつつ、速い組み込み版を使う」ための分岐です。

## ここがすごい

- **`echo` の落とし穴を避けている**: `echo` は、引数が `-n` や `-e` だと「オプション」と解釈して表示しないことがあります。また `\t` などのバックスラッシュを変換するかどうかもシェルによって違います。`printf %s` は値を一切解釈せずにそのまま出すので、どんな文字列でも同じ結果になります。
- **ユーザーの環境に左右されない**: nvm は `source` してユーザーのシェルの中で動きます。ユーザーが `alias printf=...` のような設定をしていても、`builtin` / `command` を付けることで影響を受けません。
- **zsh の細かい違いまで吸収している**: 「`command` を付ければ安全」という一般的なテクニックが zsh では裏目に出ることを知っていて、そこだけ `builtin` に切り替えています。外部コマンドを起動しないので、何千回呼ばれても速いままです。
- **小さな関数に閉じ込める**: こうした配慮を毎回書くのは大変なので、1 つの関数にまとめて全体で使い回しています。nvm.sh のあちこちで `nvm_echo` が使われているのはそのためです。

## まとめ

- 任意の文字列を安全に出力したいときは、`echo` より `printf '%s\n'` を使う。
- `command` や `builtin` で、ユーザー定義の関数やエイリアスを回避できる。
- 多くのシェルで動かすスクリプトは、違いを吸収する小さなラッパー関数を作っておくと全体がすっきりする。
