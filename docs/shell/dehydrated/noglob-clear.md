---
title: "ファイル名の展開（glob）を元に戻す"
description: "noglob_set で止めた、ワイルドカードの展開を再び有効にする関数。使っているシェルに合わせて、zsh と bash の方法を使い分ける。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [42, 48]
function: "noglob_clear"
difficulty: 1
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`noglob_clear` は、**一時的に止めていたワイルドカードの展開を、元に戻す** 関数です。`noglob_set` と対になっています。

シェルは、`*` のような記号を、ファイル名の一覧に置き換えます。その動きを、必要な間だけ止めて、終わったら戻す。それがこの関数の役目です。

## コード

```bash:line-numbers=42
noglob_clear() {
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    set -o noglob
  else
    set -f
  fi
}
```

## 前提知識

- **ワイルドカード（glob）**: `*` や `?` を、ファイル名のパターンとして扱う仕組みです。
- **`set -o noglob` と `set -f`**: どちらも、ワイルドカードの展開を止める命令です。zsh は前者、bash や sh は後者を使います。
- **`${ZSH_VERSION:-}`**: zsh のときだけ値が入る変数です。値があるかどうかで、シェルを判別します。
- **対になる関数**: `noglob_set` で止め、この関数で戻す組み合わせです。

## 何をしているか

### 1. zsh かどうかを調べる

```bash:line-numbers=43
  if [[ -n "${ZSH_VERSION:-}" ]]; then
```

`ZSH_VERSION` に値があれば、実行しているのは zsh です。

### 2. zsh なら noglob を解除する

```bash:line-numbers=44
    set -o noglob
```

zsh では、`set -o noglob` の設定を解除して、ワイルドカードの展開を戻します。

### 3. それ以外なら set -f を解除する

```bash:line-numbers=46
    set -f
```

zsh 以外では、`set -f` の設定を解除します。どちらの場合も、元の展開の動きに戻ります。

## ここがすごい

- **シェルの違いを吸収する**: 同じ目的の命令が、シェルによって違うので、判別して使い分けています。
- **止めた設定を正確に戻す**: 対応する `noglob_set` と同じ判定を使うので、止めたものと戻すものが一致します。
- **副作用を最小にする**: 解除するのは、この関数で止めた設定だけです。ほかのオプションは変えません。

## まとめ

- 複数のシェルで動く道具は、シェルを判別して命令を使い分ける。
- 一時的な設定変更は、必ず対になる関数で元に戻す。
- 同じ判定を使うと、止めた設定と戻す設定が必ず一致する。
