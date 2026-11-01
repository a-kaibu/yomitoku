---
title: "ユーザーが cd を改造していても本物の cd を呼ぶ"
description: "cd を独自関数で上書きしている人の環境でも、組み込みの cd を確実に呼び出すための nvm の小さなラッパー関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [40, 48]
function: "nvm_cd"
difficulty: 1
format: 2
tags: [移植性, 防御的プログラミング, イディオム]
---
## ひとことで

`nvm_cd` は、ディレクトリを移動する `cd` を **確実にシェル本来のものとして** 呼び出すための関数です。`nvm_cd /tmp` と書けば、`cd /tmp` と同じように `/tmp` へ移動します。

シェルの設定ファイルで `cd` を自分好みの関数に置き換えている人は意外と多く（移動のたびに `ls` するなど）、nvm のようにユーザーのシェルの中で動くツールはその影響を受けてしまいます。この関数はそれを防ぎます。

## コード

::: code-group

```sh:line-numbers=40 [日本語訳]
nvm_cd() {
  # `\cd` でもユーザー定義の `cd` 関数は実行される。zsh では `command cd` が組み込みではなく `/usr/bin/cd` を実行する
  if [ -n "${ZSH_VERSION-}" ]; then
    # shellcheck: SC3044 の警告を無効化
    builtin cd "$@"
  else
    command cd "$@"
  fi
}
```

```sh:line-numbers=40 [原文]
nvm_cd() {
  # `\cd` still runs a user-defined `cd` function; in zsh, `command cd` runs `/usr/bin/cd` instead of the builtin
  if [ -n "${ZSH_VERSION-}" ]; then
    # shellcheck disable=SC3044
    builtin cd "$@"
  else
    command cd "$@"
  fi
}
```

:::

## 前提知識

- **`cd`**: カレントディレクトリ（今いる場所）を変えるコマンドです。シェル自身の状態を変えるので、外部プログラムではなく **シェルの組み込みコマンド（builtin）** として実装されています。
- **`"$@"`**: 関数に渡された引数を、1 つずつ別々の引数のまま渡す書き方です。`nvm_cd "my dir"` のように空白を含む引数も壊れずに渡ります。
- **関数・エイリアスによる上書き**: シェルでは `cd() { ... }` と書くと、`cd` という名前の関数を作れます。関数はコマンドより優先されるので、以後 `cd` と打つと関数が呼ばれます。
- **`\cd`**: コマンド名の前に `\` を付けるとエイリアスは無視されますが、**関数は無視されません**。
- **`command`**: 関数とエイリアスを飛ばして、組み込みコマンドか外部コマンドを実行します。
- **`builtin`**: 組み込みコマンドだけを実行します。bash と zsh にはありますが、POSIX（シェルの共通規格）には含まれていません。
- **`${ZSH_VERSION-}`**: zsh の中でだけ値が入る変数です。空でなければ zsh と判断できます。

## 何をしているか

### 1. zsh かどうかを調べる

`[ -n "${ZSH_VERSION-}" ]` で、今動いているシェルが zsh かどうかを判定します。

### 2. zsh なら builtin cd

zsh では `builtin cd "$@"` を使います。コメントによると、zsh で `command cd` と書くと、組み込みの `cd` ではなく `/usr/bin/cd` という外部コマンドが実行されてしまうことがあります。外部コマンドは別プロセスで動くため、そこで移動しても **呼び出したシェルの場所は変わりません**。これでは意味がないので、zsh では `builtin` を使います。

### 3. それ以外は command cd

bash・dash・ksh などでは `command cd "$@"` を使います。`command` は関数とエイリアスを飛ばすので、ユーザーが `cd` を関数で上書きしていても本来の `cd` が実行されます。dash のように `builtin` を持たないシェルもあるため、こちらは POSIX で決められている `command` を使います。

たとえばユーザーが `cd() { builtin cd "$@" && ls; }` と定義していても、`nvm_cd /tmp` は `ls` を実行せずに移動だけします。

## ここがすごい

- **よくある「`\cd` で十分」という誤解を正している**: コメントが指摘するように、`\cd` はエイリアスしか避けられません。関数まで避けるには `command` が必要だ、という正確な知識に基づいています。
- **zsh の例外まで考えている**: 「`command` を付ければ安全」という一般論が zsh では成り立たない場面があることを把握し、zsh だけ `builtin` に切り替えています。
- **POSIX シェルにも配慮**: `builtin` は便利ですが、dash などにはありません。全シェルで `builtin` を使わず、使えるシェル（zsh）でだけ使う形にしたことで、移植性を保っています。
- **`"$@"` で引数をそのまま渡す**: `cd -` や `cd -P dir` のようなオプション、空白入りのパスも壊さずに渡せます。

## まとめ

- 他人のシェル環境で動くスクリプトでは、`cd` などのよく上書きされるコマンドも疑ってかかる。
- `\name` はエイリアスだけ、`command name` は関数とエイリアスの両方を避ける。
- シェルによって `command` / `builtin` の意味が微妙に違うので、必要なら分岐して吸収する。
