---
title: "ワイルドカード展開を、シェルの種類に合わせて止める"
description: "bash と zsh でワイルドカード（*）の展開を止めるオプションが違う。両方に対応するため、シェルを見分けてから設定を変える小さな関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [34, 40]
function: "noglob_set"
difficulty: 1
format: 2
tags: [移植性, イディオム]
---
## ひとことで

`noglob_set` は、シェルがワイルドカード（`*` や `?` などのパターン）を **ファイル名に展開しないようにする** 設定を入れる関数です。対になる `noglob_clear` は、その設定を元に戻します。

ワイルドカードの展開を止めたい場面は、たとえば JSON の値に `*` が含まれていて、それをそのまま扱いたいときです。ただし、止めるためのオプションは、bash と zsh で名前が違います。この関数はそれを吸収しています。

## コード

```bash:line-numbers=34
noglob_set() {
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    set +o noglob
  else
    set +f
  fi
}
```

## 前提知識

- **ワイルドカード展開**: `*.txt` のように書くと、シェルはそれを現在のディレクトリにあるファイル名の一覧に置き換えます。これを「グロブ展開」とも呼びます。
- **`set -f`**: 名前の展開（ワイルドカード）を一切行わない、という bash と POSIX シェルのオプションです。`set +f` で元に戻ります。
- **`set -o noglob`**: zsh で同じ働きをするオプションです。`set +o noglob` で元に戻ります。
- **`${ZSH_VERSION:-}`**: zsh の中でだけ値が入る変数です。`:-` は、値が無いときに空文字として扱う書き方です。
- **`[[ -n 文字列 ]]`**: 文字列が空でなければ真になる条件式です。

## 何をしているか

### 1. zsh かどうかを調べる

```bash:line-numbers=35
  if [[ -n "${ZSH_VERSION:-}" ]]; then
```

`ZSH_VERSION` に値が入っていれば zsh です。

### 2. zsh のとき

```bash:line-numbers=36
    set +o noglob
```

zsh では `set +o noglob` で、ワイルドカードの展開を止めるオプションを外します。

### 3. それ以外のとき

```bash:line-numbers=38
    set +f
```

bash などでは `set +f` で、ワイルドカードの展開を止めるオプションを外します。

`noglob_clear` は、この逆をします。`set -o noglob` や `set -f` で、展開を止めた状態に戻します。

## ここがすごい

- **シェルごとの違いを 1 か所にまとめている**: 呼ぶ側は `noglob_set` と書くだけで、どのシェルでも同じように動きます。
- **対になる関数を用意している**: 設定を入れる関数と、元に戻す関数をペアで作るのは、後始末を忘れないための基本的な設計です。
- **同じ書き方を 2 回繰り返さない**: 2 つの関数は、オプションの名前だけが違う形になっています。どちらを変えるかは、シェルの判定で決まります。

## まとめ

- シェルの違いは、判定を 1 回書いて分岐させると楽になる。
- 設定を変える関数は、元に戻す関数とセットで用意する。
- ワイルドカードの展開は、bash と zsh で止め方が違うので注意する。
