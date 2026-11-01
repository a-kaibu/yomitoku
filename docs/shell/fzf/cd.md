---
title: "fzf でディレクトリを選んで、そこへ移動するコマンドを作る"
description: "fzf でディレクトリの一覧から 1 つ選び、その場所へ移動するための cd コマンドの文字列を返す関数。移動先は絶対パスに直してから渡す。"
language: shell
project: "fzf"
repo: https://github.com/junegunn/fzf
license: "MIT"
copyright: "Copyright (c) 2013-2026 Junegunn Choi"
commit: "26ff936df038b6a62ec42cf18db27b2ea2bb8ec3"
file: "shell/key-bindings.bash"
lines: [70, 77]
function: "__fzf_cd__"
difficulty: 3
format: 2
tags: [CLI, ファイル, イディオム]
---
## ひとことで

`__fzf_cd__` は、fzf でディレクトリを 1 つ選ばせ、**選んだ場所へ移動するための `cd` コマンドの文字列** を作る関数です。`Alt+C` のようなキーに割り当てると、ディレクトリ名を打たずに移動できます。

この関数は移動そのものは行いません。移動するコマンドを文字列として作り、それを入力行に差し込む役割です。移動を入力行に書き込む形にしているので、ユーザーは Enter を押して確かめてから移動できます。

## コード

```bash:line-numbers=70
__fzf_cd__() {
  local dir
  dir=$(
    FZF_DEFAULT_COMMAND=${FZF_ALT_C_COMMAND:-} \
      FZF_DEFAULT_OPTS=$(__fzf_defaults "--reverse --walker=dir,follow,hidden --scheme=path" "${FZF_ALT_C_OPTS-} +m") \
      FZF_DEFAULT_OPTS_FILE='' $(__fzfcmd)
  ) && printf 'builtin cd -- %q' "$(builtin unset CDPATH && builtin cd -- "$dir" && builtin pwd)"
}
```

## 前提知識

- **`cd` は関数と同じ働き**: シェルの場所を変えるコマンドは、子のプロセスではなく、今のシェルの中で実行しなければなりません。そのため、文字列として返して、入力行で実行させる方法がとられています。
- **`%q`**: `printf` の書式で、シェルの中で安全に使える形に文字列をクォートします。空白や特殊記号を含むパスでも、壊れません。
- **`builtin cd`**: 関数やエイリアスを飛ばして、組み込みの `cd` を実行します。
- **`builtin pwd`**: 今いるディレクトリを、絶対パスで表示します。
- **`CDPATH`**: `cd` が検索する場所の一覧です。選んだ場所を正確に移動するため、一時的に空にしています。
- **`__fzf_defaults`**: fzf の既定の設定に、この機能用の設定を足した文字列を作る関数です。

## 何をしているか

### 1. fzf の設定を組み立てて、ディレクトリを選ぶ

```bash:line-numbers=72
  dir=$(
    FZF_DEFAULT_COMMAND=${FZF_ALT_C_COMMAND:-} \
      FZF_DEFAULT_OPTS=$(__fzf_defaults "--reverse --walker=dir,follow,hidden --scheme=path" "${FZF_ALT_C_OPTS-} +m") \
      FZF_DEFAULT_OPTS_FILE='' $(__fzfcmd)
```

`FZF_ALT_C_COMMAND` で一覧を作るコマンドを指定し、ディレクトリだけを見る設定や隠しファイルの扱いを足します。その状態で fzf を起動し、選んだ結果を `dir` に入れます。

### 2. 絶対パスに直して、cd の文字列を作る

```bash:line-numbers=76
  ) && printf 'builtin cd -- %q' "$(builtin unset CDPATH && builtin cd -- "$dir" && builtin pwd)"
```

選んだ `dir` の中に移動し、そこで `pwd` を実行して絶対パスを得ます。`CDPATH` を空にしているのは、同じ名前のディレクトリが別の場所にあっても、選んだ場所に正確に行くためです。最後に `printf` で、`builtin cd -- パス` という文字列を作ります。

## ここがすごい

- **移動の準備と実行を分けている**: 関数は移動の文字列を作るだけなので、移動の結果を入力行で確認できます。
- **絶対パスに直してから渡す**: 相対パスで渡すと、ほかの場所で同じ名前が使われたときに誤移動します。絶対パスに直すことで、この危険を防いでいます。
- **`%q` で安全に書く**: 空白や記号を含むパスでも、入力行に書いたときに正しく解釈されます。

## まとめ

- シェルの場所を変える処理は、文字列として返して実行させる方法もある。
- 文字列を入力行に書くときは、`%q` で安全にクォートする。
- 移動先は絶対パスに直すと、誤移動を防げる。
