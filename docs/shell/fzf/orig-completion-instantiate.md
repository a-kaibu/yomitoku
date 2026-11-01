---
title: "元の補完関数の書式に、fzf の関数名を差し込む"
description: "既存の補完の設定に含まれる %s の場所へ、fzf の補完関数の名前を埋め込み、あとで実行できる形を作る関数。"
language: shell
project: "fzf"
repo: https://github.com/junegunn/fzf
license: "MIT"
copyright: "Copyright (c) 2013-2026 Junegunn Choi"
commit: "26ff936df038b6a62ec42cf18db27b2ea2bb8ec3"
file: "shell/completion.bash"
lines: [104, 113]
function: "__fzf_orig_completion_instantiate"
difficulty: 3
format: 2
tags: [文字列処理, 設計パターン, 防御的プログラミング]
---
## ひとことで

`__fzf_orig_completion_instantiate` は、もともとの補完の設定（`complete` で登録された補完の仕組み）を **ほかの補完関数で差し替えられる形** に作り直す関数です。`%s` と書かれた場所に、fzf の補完関数の名前を埋め込みます。

fzf は、既存の補完の前に fzf の補完を割り込ませます。元の補完をどう呼ぶかを、この関数が決めています。

## コード

```bash:line-numbers=104
__fzf_orig_completion_instantiate() {
  local cmd func orig_var orig
  cmd=$1
  func=$2
  orig_var="_fzf_orig_completion_${cmd//[^A-Za-z0-9_]/_}"
  orig="${!orig_var-}"
  orig="${orig%#*}"
  [[ $orig == *' %s '* ]] || return 1
  builtin printf -v REPLY "$orig" "$func"
}
```

## 前提知識

- **`complete`**: コマンドごとに補完の設定を登録する bash の組み込みコマンドです。
- **`_fzf_orig_completion_...` という変数**: 元の補完の設定を、コマンド名ごとに覚えておくための変数です。
- **`${cmd//[^A-Za-z0-9_]/_}`**: コマンド名の中で、英数字とアンダースコア以外の文字を `_` に置き換えます。変数名として使える形にするためです。
- **`${!変数名}`**: 変数名を間接的に参照し、その値を取り出します。
- **`${orig%#*}`**: 末尾から `#` 以降を取り除きます。元の設定に付いていた、コメントのような部分を消すためです。
- **`printf -v REPLY 書式 値`**: 書式に値を埋め込み、結果を `REPLY` という変数に入れます。

## 何をしているか

### 1. 元の補完の設定を探す

```bash:line-numbers=105
  local cmd func orig_var orig
  cmd=$1
  func=$2
  orig_var="_fzf_orig_completion_${cmd//[^A-Za-z0-9_]/_}"
  orig="${!orig_var-}"
```

コマンド名から、覚えておいた元の設定の変数名を作り、その値を取り出します。値が無ければ空のままです。

### 2. 余計な部分を取り除く

```bash:line-numbers=110
  orig="${orig%#*}"
```

設定の末尾にある `#` 以降を取り除き、中身だけにします。

### 3. %s を関数名に差し替える

```bash:line-numbers=111
  [[ $orig == *' %s '* ]] || return 1
  builtin printf -v REPLY "$orig" "$func"
```

設定の中に `' %s '` という形がなければ、失敗を返して終わります。あれば、`printf -v` で `%s` の場所に fzf の関数名を埋め込み、結果を `REPLY` に入れます。

## ここがすごい

- **形が無ければ何もしない**: `%s` の場所が無い設定は、安全に扱えないと判断して失敗を返します。無理に書き換えず、元の動きを守っています。
- **変数名を安全に作る**: コマンド名に記号が含まれても、変数名として壊れないように置き換えています。
- **結果を REPLY に入れる**: bash の慣習に従って、結果を `REPLY` に返すので、呼ぶ側が扱いやすくなっています。

## まとめ

- 既存の設定を書き換える前に、書式が想定どおりかを確かめる。
- コマンド名などの外部の値は、変数名に使う前に安全な形にする。
- 結果を決まった変数に入れると、関数の呼び出しを統一できる。
