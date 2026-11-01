---
title: "隠しファイルまで漏らさない 3 つのグロブ"
description: "ディレクトリの中を再帰的にたどり、書き込めないファイルがないかを調べる関数。\"$1\"/* と .[!.]* と ..?* の 3 つで、. と .. を除く全ファイルを列挙する。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [4382, 4399]
function: "nvm_check_file_permissions"
difficulty: 2
format: 2
tags: [ファイル, 再帰, 移植性]
---
## ひとことで

`nvm_check_file_permissions DIR` は、ディレクトリの中のファイルを **奥まで全部たどって**、自分が書き込めない（しかも自分のものでもない）ファイルがないかを調べる関数です。問題があれば、そのファイル名を表示して失敗を返します。

nvm は、Node.js のディレクトリを削除する前などにこれを使い、途中で「削除できないファイル」にぶつかって中途半端な状態になるのを防いでいます。

## コード

::: code-group

```sh:line-numbers=4382 [日本語訳]
nvm_check_file_permissions() {
  nvm_is_zsh && setopt local_options nonomatch
  for FILE in "$1"/* "$1"/.[!.]* "$1"/..?* ; do
    if [ -d "$FILE" ]; then
      if [ -n "${NVM_DEBUG-}" ]; then
        nvm_err "${FILE}"
      fi
      if [ ! -L "${FILE}" ] && ! nvm_check_file_permissions "${FILE}"; then
        return 2
      fi
    elif [ -e "$FILE" ] && [ ! -w "$FILE" ] && [ -z "$(command find "${FILE}" -prune -user "$(command id -u)")" ]; then
      # ^ ファイルの持ち主の確認方法は https://www.shellcheck.net/wiki/SC3067 による
      nvm_err "file is not writable or self-owned: $(nvm_sanitize_path "$FILE")"
      return 1
    fi
  done
  return 0
}
```

```sh:line-numbers=4382 [原文]
nvm_check_file_permissions() {
  nvm_is_zsh && setopt local_options nonomatch
  for FILE in "$1"/* "$1"/.[!.]* "$1"/..?* ; do
    if [ -d "$FILE" ]; then
      if [ -n "${NVM_DEBUG-}" ]; then
        nvm_err "${FILE}"
      fi
      if [ ! -L "${FILE}" ] && ! nvm_check_file_permissions "${FILE}"; then
        return 2
      fi
    elif [ -e "$FILE" ] && [ ! -w "$FILE" ] && [ -z "$(command find "${FILE}" -prune -user "$(command id -u)")" ]; then
      # ^ file ownership check from https://www.shellcheck.net/wiki/SC3067
      nvm_err "file is not writable or self-owned: $(nvm_sanitize_path "$FILE")"
      return 1
    fi
  done
  return 0
}
```

:::

## 前提知識

- **グロブ（ワイルドカード）**: `*` は「任意の文字列」、`?` は「任意の 1 文字」、`[!.]` は「`.` 以外の 1 文字」です。シェルがファイル名に展開します。
- **`*` は隠しファイルに一致しない**: `.` で始まるファイル（`.bashrc` など）は、`*` では展開されません。
- **一致するファイルが無いとき**: 多くのシェルでは、パターンがそのまま文字列として残ります（`dir/.[!.]*` のまま）。zsh では既定でエラーになります。
- **`setopt local_options nonomatch`**: zsh で「一致しなければパターンをそのまま残す」設定を、この関数の中だけで有効にします。
- **`[ -d ]` / `[ -L ]` / `[ -e ]` / `[ -w ]`**: ディレクトリか、シンボリックリンクか、存在するか、書き込めるか、の判定です。
- **`find ファイル -prune -user UID`**: そのファイルの持ち主が UID なら、名前を表示します。`-prune` で中に入らないようにしています。
- **`id -u`**: 自分のユーザー ID を表示します。

## 何をしているか

### 1. zsh の設定

zsh なら、一致しないグロブがエラーにならないようにします。

### 2. 全ファイルを列挙

次の 3 つのパターンで、`.` と `..` を除くすべての名前を列挙します。

| パターン | 一致するもの | 例 |
| --- | --- | --- |
| `"$1"/*` | 普通のファイル | `bin`、`lib` |
| `"$1"/.[!.]*` | `.` の次が `.` 以外 | `.npmrc`、`.a` |
| `"$1"/..?*` | `..` の後に 1 文字以上 | `..foo` |

`.*` と書くと `.` と `..`（自分自身と親ディレクトリ）にも一致してしまい、親へさかのぼって無限にたどることになります。3 つに分けることで、それを避けつつ隠しファイルを全部拾っています。

### 3. ディレクトリなら再帰

ディレクトリなら、自分自身を呼び出して中を調べます。ただしシンボリックリンクは追いかけません。リンク先が別の場所だったり、ループしていたりするかもしれないからです。

### 4. ファイルの検査

存在していて、書き込めず、持ち主も自分でなければ、問題のあるファイルです。`nvm_sanitize_path` でホームディレクトリなどを `${HOME}` に置き換えて表示し、失敗を返します。

一致しなかったパターンが文字列のまま残った場合は、`[ -e ]` が偽になるので無視されます。

## ここがすごい

- **3 つのグロブの定番テクニック**: bash の `dotglob` のようなシェル固有の機能を使わずに、POSIX シェルで隠しファイルを含む全ファイルを列挙する方法です。知っておくと応用が利きます。
- **シェルの違いを 1 行で吸収**: zsh だけ `nonomatch` を設定し、ほかのシェルの既定の動きに合わせています。`local_options` で、この関数を出たら元の設定に戻ります。
- **リンクを追わない**: 再帰的にたどる処理でシンボリックリンクを追うと、無限ループや意図しない場所の検査につながります。

## まとめ

- `*`、`.[!.]*`、`..?*` の 3 つで、`.` と `..` を除く全ファイルを列挙できる。
- 再帰でディレクトリをたどるときは、シンボリックリンクを追わないようにする。
- 一致しないグロブの扱いはシェルごとに違うので、存在チェックと組み合わせる。
