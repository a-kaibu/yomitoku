---
title: "OS ごとに CPU の数を数えて、1 つ残して並列ビルド"
description: "ソースから Node.js をビルドするときの並列数を決める関数。OS ごとに違う方法で CPU コア数を調べ、コア数から 1 を引いた数を使う。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [3887, 3938]
function: "nvm_get_make_jobs"
difficulty: 2
format: 2
tags: [移植性, 並行処理, CLI]
---
## ひとことで

`nvm_get_make_jobs` は、Node.js をソースからビルドするとき、`make` を **いくつ並列で動かすか** を決める関数です。結果は `NVM_MAKE_JOBS` という変数に入ります。

ユーザーが数を指定していればそれを使い、指定が無ければ CPU のコア数を調べて「コア数 − 1」を使います。CPU の数の調べ方が OS ごとに違うので、それぞれに合わせた方法が並んでいます。

## コード

::: code-group

```sh:line-numbers=3887 [日本語訳]
nvm_get_make_jobs() {
  if nvm_is_natural_num "${1-}"; then
    NVM_MAKE_JOBS="$1"
    nvm_echo "number of \`make\` jobs: ${NVM_MAKE_JOBS}"
    return
  elif [ -n "${1-}" ]; then
    unset NVM_MAKE_JOBS
    nvm_err "$1 is invalid for number of \`make\` jobs, must be a natural number"
  fi
  local NVM_OS
  NVM_OS="$(nvm_get_os)"
  local NVM_CPU_CORES
  case "_${NVM_OS}" in
    "_linux")
      NVM_CPU_CORES="$(nvm_grep -c -E '^processor.+: [0-9]+' /proc/cpuinfo)"
    ;;
    "_freebsd" | "_darwin" | "_openbsd")
      NVM_CPU_CORES="$(sysctl -n hw.ncpu)"
    ;;
    "_sunos")
      # `wc` によっては数の前後に空白を付ける
      NVM_CPU_CORES="$(psrinfo | wc -l | command tr -d '[:space:]')"
    ;;
    "_aix")
      NVM_CPU_CORES="$(pmcycles -m | wc -l | command tr -d '[:space:]')"
    ;;
    *)
      # glibc、FreeBSD、macOS、Cygwin では `_NPROCESSORS_ONLN` という名前。
      # 前置きの無い名前は POSIX.1-2024 で標準化されたもので、NetBSD と
      # Solaris はこちらに答える。Windows のシェルは `NUMBER_OF_PROCESSORS` を受け継ぐ。
      # 最小限の環境には `getconf` も `nproc` も無い。
      NVM_CPU_CORES="$(command getconf _NPROCESSORS_ONLN 2>/dev/null \
        || command getconf NPROCESSORS_ONLN 2>/dev/null \
        || command nproc 2>/dev/null \
        || nvm_echo "${NUMBER_OF_PROCESSORS-}")"
    ;;
  esac
  if ! nvm_is_natural_num "${NVM_CPU_CORES}"; then
    nvm_err 'Can not determine how many core(s) are available, running in single-threaded mode.'
    nvm_err 'Please report an issue on GitHub to help us make nvm run faster on your computer!'
    NVM_MAKE_JOBS=1
  else
    nvm_echo "Detected that you have ${NVM_CPU_CORES} CPU core(s)"
    if [ "${NVM_CPU_CORES}" -gt 2 ]; then
      NVM_MAKE_JOBS=$((NVM_CPU_CORES - 1))
      nvm_echo "Running with ${NVM_MAKE_JOBS} threads to speed up the build"
    else
      NVM_MAKE_JOBS=1
      nvm_echo 'Number of CPU core(s) less than or equal to 2, running in single-threaded mode'
    fi
  fi
}
```

```sh:line-numbers=3887 [原文]
nvm_get_make_jobs() {
  if nvm_is_natural_num "${1-}"; then
    NVM_MAKE_JOBS="$1"
    nvm_echo "number of \`make\` jobs: ${NVM_MAKE_JOBS}"
    return
  elif [ -n "${1-}" ]; then
    unset NVM_MAKE_JOBS
    nvm_err "$1 is invalid for number of \`make\` jobs, must be a natural number"
  fi
  local NVM_OS
  NVM_OS="$(nvm_get_os)"
  local NVM_CPU_CORES
  case "_${NVM_OS}" in
    "_linux")
      NVM_CPU_CORES="$(nvm_grep -c -E '^processor.+: [0-9]+' /proc/cpuinfo)"
    ;;
    "_freebsd" | "_darwin" | "_openbsd")
      NVM_CPU_CORES="$(sysctl -n hw.ncpu)"
    ;;
    "_sunos")
      # some `wc`s pad the count with whitespace
      NVM_CPU_CORES="$(psrinfo | wc -l | command tr -d '[:space:]')"
    ;;
    "_aix")
      NVM_CPU_CORES="$(pmcycles -m | wc -l | command tr -d '[:space:]')"
    ;;
    *)
      # `_NPROCESSORS_ONLN` is how glibc, FreeBSD, macOS, and Cygwin spell it;
      # the unprefixed name is what POSIX.1-2024 standardizes, and what NetBSD
      # and Solaris answer to. Windows shells inherit `NUMBER_OF_PROCESSORS`;
      # the smallest ones ship neither `getconf` nor `nproc`.
      NVM_CPU_CORES="$(command getconf _NPROCESSORS_ONLN 2>/dev/null \
        || command getconf NPROCESSORS_ONLN 2>/dev/null \
        || command nproc 2>/dev/null \
        || nvm_echo "${NUMBER_OF_PROCESSORS-}")"
    ;;
  esac
  if ! nvm_is_natural_num "${NVM_CPU_CORES}"; then
    nvm_err 'Can not determine how many core(s) are available, running in single-threaded mode.'
    nvm_err 'Please report an issue on GitHub to help us make nvm run faster on your computer!'
    NVM_MAKE_JOBS=1
  else
    nvm_echo "Detected that you have ${NVM_CPU_CORES} CPU core(s)"
    if [ "${NVM_CPU_CORES}" -gt 2 ]; then
      NVM_MAKE_JOBS=$((NVM_CPU_CORES - 1))
      nvm_echo "Running with ${NVM_MAKE_JOBS} threads to speed up the build"
    else
      NVM_MAKE_JOBS=1
      nvm_echo 'Number of CPU core(s) less than or equal to 2, running in single-threaded mode'
    fi
  fi
}
```

:::

## 前提知識

- **`make -j N`**: ビルドを N 個並列で実行するオプションです。CPU のコア数に合わせると速くなります。
- **`nvm_is_natural_num`**: 引数が 1 以上の整数かを判定する nvm の関数です。
- **`unset 変数`**: 変数を削除します。
- **`/proc/cpuinfo`**: Linux で CPU の情報が書かれた特殊なファイルです。コア 1 つにつき `processor : 0` のような行があります。
- **`grep -c`**: 一致した行の **数** を表示します。
- **`sysctl -n hw.ncpu`**: macOS や BSD で CPU の数を表示します。
- **`getconf _NPROCESSORS_ONLN`**: 使える CPU の数を表示します。
- **`A || B || C`**: A が失敗したら B、B も失敗したら C を実行します。最初に成功したものの出力が使われます。
- **`wc -l`**: 行数を数えます。実装によっては数字の前に空白が付きます。

## 何をしているか

### 1. ユーザーの指定

引数が正しい数ならそれを使って終わります。数以外が渡されたらエラーを表示し、自動判定に進みます。

### 2. OS ごとにコア数を数える

```sh:line-numbers=3901
      NVM_CPU_CORES="$(nvm_grep -c -E '^processor.+: [0-9]+' /proc/cpuinfo)"
```


- **Linux**: `/proc/cpuinfo` の `processor : 数字` の行を数えます。
- **FreeBSD・macOS・OpenBSD**: `sysctl -n hw.ncpu` を使います。
- **Solaris**: `psrinfo` の出力行数を数えます。`wc` が付ける空白は `tr` で消します。
- **AIX**: `pmcycles -m` の行数を数えます。
- **それ以外**: `getconf` の 2 種類の名前、`nproc`、Windows の環境変数 `NUMBER_OF_PROCESSORS` を順に試します。

### 3. 並列数を決める

数えられなければ 1 にします。3 コア以上なら「コア数 − 1」、2 コア以下なら 1 です。

## ここがすごい

- **1 つ残す配慮**: 全コアを使うとビルドは最速ですが、その間マシン全体が重くなります。1 つ空けておくことで、ビルド中も端末やエディタを操作できます。
- **`||` の連鎖でフォールバック**: 「この方法がだめなら次」を `||` で 1 行にまとめています。どれか 1 つでも成功すればその出力が使われます。
- **細かい実装差を知っている**: `getconf` の名前に `_` が付くかどうか（コメント）や、`wc` の空白など、OS ごとの細かい違いまで押さえています。
- **うまくいかなくても止まらない**: コア数がわからなくても、1 並列で確実にビルドを続けます。さらに「issue を報告してください」と伝え、改善につなげています。

## まとめ

- CPU のコア数の調べ方は OS によって違う。
- `A || B || C` で、使える方法を順に試せる。
- 並列数は「コア数 − 1」にすると、マシンの操作性を保てる。
