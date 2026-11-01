---
title: "必要な道具が揃っているかを、最初に確かめる"
description: "必要なコマンドの存在と実行権限を調べ、openssl と sed の動作、curl のバージョンを確かめる関数。足りなければエラーで止める。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [298, 313]
function: "check_dependencies"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`check_dependencies` は、**処理を始める前に、必要な道具がそろっているかを確かめる** 関数です。足りない道具があれば、理由を示して止めます。

シェルのスクリプトは、外部のコマンドに強く依存します。途中で道具が無いと、中途半端な状態で失敗します。最初に確かめておけば、その混乱を防げます。

## コード

::: code-group

```bash:line-numbers=298 [日本語訳]
check_dependencies() {
  # 必要な実行ファイルを探します。
  for binary in grep mktemp diff sed awk curl cut head tail hexdump; do
    bin_path="$(command -v "${binary}" 2>/dev/null)" || _exiterr "This script requires ${binary}."
    [[ -x "${bin_path}" ]] || _exiterr "${binary} found in PATH but it's not executable"
  done

  # バージョンの表示などを実行して、道具が実際に使えるかも確かめます。
  "${OPENSSL}" version > /dev/null 2>&1 || _exiterr "This script requires an openssl binary."
  _sed "" < /dev/null > /dev/null 2>&1 || _exiterr "This script requires sed with support for extended (modern) regular expressions."

  # 古い curl は、エラーのコードを返すことがあるため、その場合に備えます。
  set +e
  CURL_VERSION="$(curl -V 2>&1 | head -n1 | awk '{print $2}')"
  set -e
}
```

```bash:line-numbers=298 [原文]
check_dependencies() {
  # look for required binaries
  for binary in grep mktemp diff sed awk curl cut head tail hexdump; do
    bin_path="$(command -v "${binary}" 2>/dev/null)" || _exiterr "This script requires ${binary}."
    [[ -x "${bin_path}" ]] || _exiterr "${binary} found in PATH but it's not executable"
  done

  # just execute some dummy and/or version commands to see if required tools are actually usable
  "${OPENSSL}" version > /dev/null 2>&1 || _exiterr "This script requires an openssl binary."
  _sed "" < /dev/null > /dev/null 2>&1 || _exiterr "This script requires sed with support for extended (modern) regular expressions."

  # curl returns with an error code in some ancient versions so we have to catch that
  set +e
  CURL_VERSION="$(curl -V 2>&1 | head -n1 | awk '{print $2}')"
  set -e
}
```

:::

## 前提知識

- **`command -v`**: コマンドの場所を調べる命令です。見つからなければ何も出ません。
- **実行権限**: ファイルを実行できる許可です。`-x` で確かめられます。
- **拡張正規表現**: `sed` の中でも、新しい形式の正規表現に対応しているかは、環境で違います。
- **`set +e` と `set -e`**: 途中の失敗で止まる設定を、一時的に外す命令です。古い curl が、バージョン表示で失敗することに備えています。

## 何をしているか

### 1. 必要なコマンドを 1 つずつ調べる

```bash:line-numbers=301
    bin_path="$(command -v "${binary}" 2>/dev/null)" || _exiterr "This script requires ${binary}."
    [[ -x "${bin_path}" ]] || _exiterr "${binary} found in PATH but it's not executable"
  done

  # バージョンの表示などを実行して、道具が実際に使えるかも確かめます。
  "${OPENSSL}" version > /dev/null 2>&1 || _exiterr "This script requires an openssl binary."
```

grep、mktemp、diff など必要なコマンドを順に調べます。見つからない、または実行できないものがあれば、エラーで止めます。

### 2. openssl と sed を試す

```bash:line-numbers=309
  # 古い curl は、エラーのコードを返すことがあるため、その場合に備えます。
  set +e
```

openssl のバージョンを表示させ、sed が拡張正規表現を読めるかを試します。失敗したら、必要な道具の説明を出して止めます。

### 3. curl のバージョンを取る

```bash:line-numbers=312
  set -e
}

store_configvars() {
```

古い curl が、バージョン表示で失敗することがあるため、一時的に失敗で止まる設定を外します。バージョンを取り出したあと、設定を元に戻します。

## ここがすごい

- **問題を早く見つける**: 処理の途中で道具が無いことに気づくより、最初に確かめるほうが原因を特定しやすいです。
- **動くかまで確かめる**: 存在だけでなく、実際に実行して動作を試しています。見た目は揃っていても壊れている道具を見逃しません。
- **例外的な環境に備える**: 古い curl の挙動を考えて、設定を一時的に変えています。

## まとめ

- 外部の道具への依存は、最初にまとめて確かめると混乱が減る。
- 存在だけでなく、実際に動くかも確かめると安心。
- 古い環境の挙動に備えて、確かめる範囲を調整する。
