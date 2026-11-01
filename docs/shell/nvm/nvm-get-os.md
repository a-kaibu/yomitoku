---
title: "/etc/os-release を読んで uname の起動を省く OS 判定"
description: "動いている OS を linux や darwin などの名前で返す関数。まず /etc/os-release を source せずに 1 行ずつ読み、わからないときだけ uname を起動する。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [3282, 3352]
function: "nvm_get_os"
difficulty: 2
format: 2
tags: [移植性, ファイル, 最適化]
---
## ひとことで

`nvm_get_os` は、今動いている OS を `linux`、`darwin`（macOS）、`freebsd`、`win` などの名前で返す関数です。nvm はこの結果を使って、どのビルド済み Node.js をダウンロードするかを決めます。

昔ながらの方法は `uname` コマンドを実行することですが、この関数はまず **`/etc/os-release` というファイルを読んで判定** し、それで決まらないときだけ `uname` を起動します。

## コード

::: code-group

```sh:line-numbers=3282 [日本語訳]
nvm_get_os() {
  # dash の `local` は呼び出し元の値を引き継ぐので、空から始める必要がある
  local NVM_OS
  NVM_OS=''
  local NVM_UNAME
  local NVM_OS_RELEASE_PATH
  local NVM_OS_RELEASE_LINE
  local NVM_OS_RELEASE_ID
  NVM_OS_RELEASE_ID=''
  local NVM_OS_KERNEL_PATH
  local NVM_OS_KERNEL_TYPE
  NVM_OS_KERNEL_TYPE=''

  # `/etc/os-release` は Linux、FreeBSD 13.2 以降、MSYS2 と
  # Cygwin の環境にある。読めるなら、その `ID` で
  # `uname` を起動せずに OS がわかる。ファイルは source せずに読むので、中身は実行されない。
  # このファイルが無いシステム（macOS、OpenBSD など）や `ID` が無いファイルは、
  # 下の `uname -a` に任せる。
  NVM_OS_RELEASE_PATH="${NVM_OS_RELEASE:-/etc/os-release}"
  if [ -r "${NVM_OS_RELEASE_PATH}" ]; then
    while IFS= read -r NVM_OS_RELEASE_LINE || [ -n "${NVM_OS_RELEASE_LINE}" ]; do
      case "${NVM_OS_RELEASE_LINE}" in
        ID=*)
          NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_LINE#ID=}"
          break
        ;;
      esac
    done < "${NVM_OS_RELEASE_PATH}"
    # `ID` は 1 つの単語だが、クォートされていたり、後ろに
    # 空白（CR を含む）やコメントが続いたりすることがある
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID%%[[:space:]#]*}"
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID#[\"\']}"
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID%[\"\']}"
    case "${NVM_OS_RELEASE_ID}" in
      freebsd) NVM_OS=freebsd ;;
      cygwin* | mingw* | msys*) NVM_OS=win ;;
      # illumos 系のディストリビューションと Oracle Solaris は `uname -a` で
      # `SunOS` と答え、GhostBSD は `FreeBSD` と答える。`uname` を起動せずに
      # ここで直接対応づける
      solaris | omnios | openindiana | smartos | illumos) NVM_OS=sunos ;;
      ghostbsd) NVM_OS=freebsd ;;
      # `ID` が無い、または nvm に対応する OS の名前が無い（DragonFly BSD）なら、
      # `uname -a` に決めさせる
      '' | dragonfly) NVM_OS='' ;;
      # それ以外の `ID` は、カーネルが Linux と言うときだけ Linux ディストリビューションとみなす。
      # 一覧に無い BSD や illumos の派生（HardenedBSD、Helios など）は
      # `uname -a` に決めさせる
      *)
        NVM_OS_KERNEL_PATH="${NVM_OS_KERNEL_OSTYPE:-/proc/sys/kernel/ostype}"
        if [ -r "${NVM_OS_KERNEL_PATH}" ] && IFS= read -r NVM_OS_KERNEL_TYPE < "${NVM_OS_KERNEL_PATH}" && [ "${NVM_OS_KERNEL_TYPE}" = 'Linux' ]; then
          NVM_OS=linux
        fi
      ;;
    esac
  fi

  if [ -z "${NVM_OS-}" ]; then
    NVM_UNAME="$(command uname -a)"
    case "${NVM_UNAME}" in
      Linux\ *) NVM_OS=linux ;;
      Darwin\ *) NVM_OS=darwin ;;
      SunOS\ *) NVM_OS=sunos ;;
      FreeBSD\ *) NVM_OS=freebsd ;;
      OpenBSD\ *) NVM_OS=openbsd ;;
      AIX\ *) NVM_OS=aix ;;
      CYGWIN* | MSYS* | MINGW*) NVM_OS=win ;;
    esac
  fi

  nvm_echo "${NVM_OS-}"
}
```

```sh:line-numbers=3282 [原文]
nvm_get_os() {
  # dash's `local` keeps the caller's value, so these must start empty
  local NVM_OS
  NVM_OS=''
  local NVM_UNAME
  local NVM_OS_RELEASE_PATH
  local NVM_OS_RELEASE_LINE
  local NVM_OS_RELEASE_ID
  NVM_OS_RELEASE_ID=''
  local NVM_OS_KERNEL_PATH
  local NVM_OS_KERNEL_TYPE
  NVM_OS_KERNEL_TYPE=''

  # `/etc/os-release` is available on Linux, FreeBSD 13.2+, and the MSYS2 and
  # Cygwin runtimes; where it is readable, its `ID` names the OS without
  # spawning `uname`. The file is read, not sourced, so nothing in it runs.
  # systems without the file (macOS, OpenBSD, ...) and files without an `ID`
  # fall through to `uname -a` below.
  NVM_OS_RELEASE_PATH="${NVM_OS_RELEASE:-/etc/os-release}"
  if [ -r "${NVM_OS_RELEASE_PATH}" ]; then
    while IFS= read -r NVM_OS_RELEASE_LINE || [ -n "${NVM_OS_RELEASE_LINE}" ]; do
      case "${NVM_OS_RELEASE_LINE}" in
        ID=*)
          NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_LINE#ID=}"
          break
        ;;
      esac
    done < "${NVM_OS_RELEASE_PATH}"
    # an `ID` is a single word, which may be quoted and followed by
    # whitespace (including a CR) or a comment
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID%%[[:space:]#]*}"
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID#[\"\']}"
    NVM_OS_RELEASE_ID="${NVM_OS_RELEASE_ID%[\"\']}"
    case "${NVM_OS_RELEASE_ID}" in
      freebsd) NVM_OS=freebsd ;;
      cygwin* | mingw* | msys*) NVM_OS=win ;;
      # illumos distributions and Oracle Solaris report `SunOS` from
      # `uname -a`, and GhostBSD reports `FreeBSD`; map these directly instead
      # of forking `uname`
      solaris | omnios | openindiana | smartos | illumos) NVM_OS=sunos ;;
      ghostbsd) NVM_OS=freebsd ;;
      # no `ID`, or one with no `nvm` OS of its own (DragonFly BSD): let
      # `uname -a` decide
      '' | dragonfly) NVM_OS='' ;;
      # any other `ID` is a Linux distribution's only if the kernel says so;
      # unlisted BSD and illumos derivatives (e.g. HardenedBSD, Helios) let
      # `uname -a` decide
      *)
        NVM_OS_KERNEL_PATH="${NVM_OS_KERNEL_OSTYPE:-/proc/sys/kernel/ostype}"
        if [ -r "${NVM_OS_KERNEL_PATH}" ] && IFS= read -r NVM_OS_KERNEL_TYPE < "${NVM_OS_KERNEL_PATH}" && [ "${NVM_OS_KERNEL_TYPE}" = 'Linux' ]; then
          NVM_OS=linux
        fi
      ;;
    esac
  fi

  if [ -z "${NVM_OS-}" ]; then
    NVM_UNAME="$(command uname -a)"
    case "${NVM_UNAME}" in
      Linux\ *) NVM_OS=linux ;;
      Darwin\ *) NVM_OS=darwin ;;
      SunOS\ *) NVM_OS=sunos ;;
      FreeBSD\ *) NVM_OS=freebsd ;;
      OpenBSD\ *) NVM_OS=openbsd ;;
      AIX\ *) NVM_OS=aix ;;
      CYGWIN* | MSYS* | MINGW*) NVM_OS=win ;;
    esac
  fi

  nvm_echo "${NVM_OS-}"
}
```

:::

## 前提知識

- **`/etc/os-release`**: Linux などで OS の情報が書かれたファイルです。`ID=ubuntu` のような `キー=値` の行が並んでいます。
- **`uname -a`**: OS やカーネルの情報を表示するコマンドです。Linux なら `Linux ホスト名 6.x ...` のような 1 行が出ます。
- **`while IFS= read -r 変数`**: ファイルを 1 行ずつ変数に読み込む定番の書き方です。`IFS=` で前後の空白を残し、`-r` で `\` を特別扱いしません。
- **`|| [ -n "$変数" ]`**: 最終行に改行が無いと `read` は失敗しますが、内容は読めています。それも処理するための書き方です。
- **`done < ファイル`**: ループの入力をファイルにします。
- **`${X%%[[:space:]#]*}`**: 最初の空白か `#` から後ろを全部取り除きます。
- **`${X#[\"\']}` / `${X%[\"\']}`**: 先頭・末尾の `"` か `'` を 1 つ取り除きます。
- **`Linux\ *`**: `case` のパターンで、`\ ` は空白そのものです。「`Linux ` で始まる」という意味になります。

## 何をしているか

### 1. 変数を空で初期化

コメントのとおり、dash の `local` は呼び出し元の値を引き継ぐため、明示的に空にしています。

### 2. os-release から ID を読む

ファイルを 1 行ずつ読み、`ID=` で始まる行を見つけたら値を取り出して `break` します。ファイルは **`source` せずに読む** ので、中に何が書かれていても実行されません。

値は `"ubuntu"` のようにクォートされていたり、後ろにコメントや `\r` が付いていたりするので、順に取り除きます。

### 3. ID から OS を決める

`freebsd`、`cygwin` などの既知の ID はそのまま対応する名前にします。それ以外の ID（`ubuntu`、`fedora` など）は、Linux の可能性が高いですが、念のため `/proc/sys/kernel/ostype` を読んで `Linux` と書かれているときだけ `linux` にします。

### 4. 決まらなければ uname

macOS など os-release が無い環境では、`uname -a` の出力の先頭で判定します。

## ここがすごい

- **プロセスを起動しない**: `uname` は外部コマンドなので、実行するたびにプロセスが作られます。ファイルを読むのはシェルの組み込み機能だけで済むので、多くの Linux 環境で速くなります。
- **`source` しない安全な読み方**: os-release はシェルの変数定義の形をしているので `. /etc/os-release` と読み込むのが簡単ですが、それだと中身がコマンドとして実行されます。1 行ずつ文字列として読めば、その心配がありません。
- **思い込みを確かめる**: 「知らない ID なら Linux だろう」と決めつけず、カーネルの情報で裏を取っています。BSD の派生 OS などを誤判定しないためです。
- **環境変数で差し替え可能**: `NVM_OS_RELEASE` や `NVM_OS_KERNEL_OSTYPE` でファイルの場所を変えられるので、テストで別の OS を再現できます。

## まとめ

- 設定ファイルは `source` せず、1 行ずつ読んで値を取り出すと安全。
- 外部コマンドの代わりにファイルを読むと、速くなることがある。
- 推測で判定するときは、別の情報源で裏を取る。
