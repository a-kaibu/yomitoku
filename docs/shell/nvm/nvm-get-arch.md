---
title: "実行ファイルの 5 バイト目を読んで 32 ビットかを見抜く"
description: "CPU の種類を x64 や arm64 などの名前で返す関数。64 ビットのカーネルに 32 ビットの環境が載っている場合を、getconf や od による /sbin/init の中身の確認で見抜く。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [3354, 3413]
function: "nvm_get_arch"
difficulty: 3
format: 2
tags: [移植性, 低レイヤ, ハック]
---
## ひとことで

`nvm_get_arch` は、CPU のアーキテクチャ（種類）を `x64`、`x86`、`arm64`、`armv7l` などの Node.js の配布で使われる名前で返す関数です。

基本は `uname -m` の結果を変換するだけですが、「カーネルは 64 ビットなのに、その上の環境は 32 ビット」というややこしい状況を見抜く工夫が入っています。

## コード

::: code-group

```sh:line-numbers=3354 [日本語訳]
nvm_get_arch() {
  local HOST_ARCH
  local NVM_OS
  local EXIT_CODE
  local LONG_BIT

  NVM_OS="$(nvm_get_os)"
  # OS が SunOS なら、まず pkgsrc を使って最も適した
  # アーキテクチャを推測する。使えなければ isainfo で
  # カーネルがサポートする命令セットを
  # 調べる。
  if [ "_${NVM_OS}" = "_sunos" ]; then
    if HOST_ARCH=$(pkg_info -Q MACHINE_ARCH pkg_install); then
      HOST_ARCH=$(nvm_echo "${HOST_ARCH}" | command tail -1)
    else
      HOST_ARCH=$(isainfo -n)
    fi
  elif [ "_${NVM_OS}" = "_aix" ]; then
    HOST_ARCH=ppc64
  else
    HOST_ARCH="$(command uname -m)"
    LONG_BIT="$(getconf LONG_BIT 2>/dev/null)"
  fi

  local NVM_ARCH
  case "${HOST_ARCH}" in
    x86_64 | amd64) NVM_ARCH="x64" ;;
    i*86) NVM_ARCH="x86" ;;
    aarch64 | armv8l) NVM_ARCH="arm64" ;;
    loongarch64) NVM_ARCH="loong64" ;;
    *) NVM_ARCH="${HOST_ARCH}" ;;
  esac

  # 32 ビットの Docker コンテナの中では、カーネルは 64 ビットのままなので
  # LONG_BIT が 32 なら ARCH を 32 ビットに変える
  if [ "_${LONG_BIT}" = "_32" ] && [ "${NVM_ARCH}" = "x64" ]; then
    NVM_ARCH="x86"
  fi

  # 64 ビットの ARM カーネルの上で 32 ビットの ARM ユーザーランドが動いていて、
  # /sbin/init が 32 ビットの実行ファイルなら、ARCH を 32 ビット ARM（armv7l）に変える
  if [ "$(command uname)" = "Linux" ] \
    && [ "${NVM_ARCH}" = arm64 ] \
    && [ "$(command od -An -t x1 -j 4 -N 1 "/sbin/init" 2>/dev/null)" = ' 01' ]\
  ; then
    NVM_ARCH=armv7l
    HOST_ARCH=armv7l
  fi

  if [ -f "/etc/alpine-release" ] && [ "_${NVM_OS}" = "_linux" ]; then
    # Alpine Linux は musl libc を使う。あれば musl 用の版に対応づける
    # 参照: https://unofficial-builds.nodejs.org/download/release/
    case "${NVM_ARCH}" in
      x64) NVM_ARCH=x64-musl ;;
      arm64) NVM_ARCH=arm64-musl ;;
    esac
  fi

  nvm_echo "${NVM_ARCH}"
}
```

```sh:line-numbers=3354 [原文]
nvm_get_arch() {
  local HOST_ARCH
  local NVM_OS
  local EXIT_CODE
  local LONG_BIT

  NVM_OS="$(nvm_get_os)"
  # If the OS is SunOS, first try to use pkgsrc to guess
  # the most appropriate arch. If it's not available, use
  # isainfo to get the instruction set supported by the
  # kernel.
  if [ "_${NVM_OS}" = "_sunos" ]; then
    if HOST_ARCH=$(pkg_info -Q MACHINE_ARCH pkg_install); then
      HOST_ARCH=$(nvm_echo "${HOST_ARCH}" | command tail -1)
    else
      HOST_ARCH=$(isainfo -n)
    fi
  elif [ "_${NVM_OS}" = "_aix" ]; then
    HOST_ARCH=ppc64
  else
    HOST_ARCH="$(command uname -m)"
    LONG_BIT="$(getconf LONG_BIT 2>/dev/null)"
  fi

  local NVM_ARCH
  case "${HOST_ARCH}" in
    x86_64 | amd64) NVM_ARCH="x64" ;;
    i*86) NVM_ARCH="x86" ;;
    aarch64 | armv8l) NVM_ARCH="arm64" ;;
    loongarch64) NVM_ARCH="loong64" ;;
    *) NVM_ARCH="${HOST_ARCH}" ;;
  esac

  # If running inside a 32Bit docker container the kernel still is 64bit
  # change ARCH to 32bit if LONG_BIT is 32
  if [ "_${LONG_BIT}" = "_32" ] && [ "${NVM_ARCH}" = "x64" ]; then
    NVM_ARCH="x86"
  fi

  # If running a 64bit ARM kernel but a 32bit ARM userland,
  # change ARCH to 32bit ARM (armv7l) if /sbin/init is 32bit executable
  if [ "$(command uname)" = "Linux" ] \
    && [ "${NVM_ARCH}" = arm64 ] \
    && [ "$(command od -An -t x1 -j 4 -N 1 "/sbin/init" 2>/dev/null)" = ' 01' ]\
  ; then
    NVM_ARCH=armv7l
    HOST_ARCH=armv7l
  fi

  if [ -f "/etc/alpine-release" ] && [ "_${NVM_OS}" = "_linux" ]; then
    # Alpine Linux uses musl libc; map to musl variants where available
    # See https://unofficial-builds.nodejs.org/download/release/
    case "${NVM_ARCH}" in
      x64) NVM_ARCH=x64-musl ;;
      arm64) NVM_ARCH=arm64-musl ;;
    esac
  fi

  nvm_echo "${NVM_ARCH}"
}
```

:::

## 前提知識

- **アーキテクチャ**: CPU の命令の種類です。`x86_64`（64 ビットの Intel/AMD）、`aarch64`（64 ビットの ARM）などがあります。
- **`uname -m`**: カーネルが認識しているマシンの種類を表示します。
- **`getconf LONG_BIT`**: C 言語の `long` 型のビット数を表示します。今の実行環境（ユーザーランド）が 32 ビットか 64 ビットかがわかります。
- **ユーザーランド**: カーネル以外の部分、つまり普段使うプログラムやライブラリのことです。
- **`od -An -t x1 -j 4 -N 1 ファイル`**: ファイルの中身を 16 進数で表示するコマンドです。`-j 4` で 4 バイト飛ばし、`-N 1` で 1 バイトだけ、`-t x1` で 1 バイトずつ 16 進数で、`-An` で位置の表示なし、という指定です。
- **ELF**: Linux の実行ファイルの形式です。ファイルの 5 バイト目（0 から数えて 4 番目）は「32 ビットなら `01`、64 ビットなら `02`」と決まっています。
- **musl**: 軽量な C ライブラリで、Alpine Linux が使っています。普通の Linux（glibc）用の Node.js は動かないことがあります。

## 何をしているか

### 1. 生の名前を得る

```sh:line-numbers=3366
    if HOST_ARCH=$(pkg_info -Q MACHINE_ARCH pkg_install); then
```


Solaris 系では `pkg_info` か `isainfo`、AIX では固定で `ppc64`、それ以外は `uname -m` を使います。あわせて `getconf LONG_BIT` も調べます。

### 2. Node.js の名前に変換

```sh:line-numbers=3380
    x86_64 | amd64) NVM_ARCH="x64" ;;
```


`x86_64`/`amd64` → `x64`、`i386`〜`i686` → `x86`、`aarch64` → `arm64` のように変換します。`i*86` というパターン 1 つで `i386`、`i486`、`i586`、`i686` をまとめて扱っています。

### 3. 32 ビットのコンテナ

```sh:line-numbers=3374
    HOST_ARCH="$(command uname -m)"
```


64 ビットのホストで 32 ビットの Docker コンテナを動かすと、`uname -m` はホストのカーネルの `x86_64` を返します。そこで `LONG_BIT` が 32 なら `x86` に直します。

### 4. 32 ビット ARM の環境

```sh:line-numbers=3394
  # change ARCH to 32bit ARM (armv7l) if /sbin/init is 32bit executable
```


Raspberry Pi などでは、カーネルは 64 ビット ARM でも、OS は 32 ビットのことがあります。ここでは `/sbin/init`（最初に起動するプログラム）の 5 バイト目を読み、`01`（32 ビット）なら `armv7l` にします。`od` の出力は先頭に空白が付くので、比較する値は `' 01'` です。

### 5. Alpine

```sh:line-numbers=3407
      x64) NVM_ARCH=x64-musl ;;
```


Alpine Linux なら musl 用のビルドの名前（`x64-musl` など）に変えます。

## ここがすごい

- **カーネルの言うことを鵜呑みにしない**: `uname -m` はカーネルの情報なので、その上の環境とずれることがあります。実際に動くのはユーザーランドのプログラムなので、そちらの情報で確かめています。
- **ファイル形式の知識を使う**: 実行ファイルの 1 バイトを読むだけで 32/64 ビットを判定するのは、ELF 形式の仕様を知っているからこそできる技です。`file` コマンドのような追加ツールも要りません。
- **現実の困りごとに 1 つずつ対応**: Docker、Raspberry Pi、Alpine と、ユーザーが実際にぶつかった問題への対処がコメントとともに積み重なっています。

## まとめ

- `uname -m` はカーネルの種類で、ユーザーランドとは違うことがある。
- `od` を使えば、ファイルの特定のバイトをシェルから読める。
- 実行ファイルのヘッダには、32/64 ビットなどの情報が決まった位置に入っている。
