---
title: "OS とバージョンの組み合わせで「xz で配布されているか」を決める"
description: "ダウンロードに小さな xz 圧縮のファイルを使えるかを判定する関数。OS 側に展開する力があるかと、そのバージョンに xz 版があるかの両方を確かめる。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [6583, 6635]
function: "nvm_supports_xz"
difficulty: 1
format: 2
tags: [移植性, ファイル]
---
## ひとことで

`nvm_supports_xz VERSION` は、そのバージョンの Node.js を **xz 形式の圧縮ファイルでダウンロードしてよいか** を判定する関数です。

xz は gzip よりよく縮むので、ダウンロードが速くなります。ただし、使えるのは「このマシンで xz を展開できる」かつ「そのバージョンに xz 版が用意されている」ときだけです。この関数はその両方を確かめます。

## コード

::: code-group

```sh:line-numbers=6583 [日本語訳]
nvm_supports_xz() {
  if [ -z "${1-}" ]; then
    return 1
  fi

  local NVM_OS
  NVM_OS="$(nvm_get_os)"
  if [ "_${NVM_OS}" = '_darwin' ]; then
    local MACOS_VERSION
    MACOS_VERSION="$(sw_vers -productVersion)"
    if nvm_version_greater "10.9.0" "${MACOS_VERSION}"; then
      # macOS 10.8 以前の tar は xz 圧縮の tar ファイルを展開できない
      return 1
    fi
  elif [ "_${NVM_OS}" = '_freebsd' ]; then
    if ! [ -e '/usr/lib/liblzma.so' ]; then
      # /usr/lib/liblzma.so の無い FreeBSD の tar は xz 圧縮の tar ファイルを展開できない
      return 1
    fi
  else
    if ! command which xz >/dev/null 2>&1; then
      # PATH に xz が無いほとんどの OS では、tar で xz 圧縮の tar ファイルを展開できない
      # （Linux、SmartOS などで正しく動くはず）
      return 1
    fi
  fi

  # v4.0.0 以降の node はすべて xz 版がある
  if nvm_is_merged_node_version "${1}"; then
    return 0
  fi

  # 0.12 系: node v0.12.10 以降には xz 版がある
  if nvm_version_greater_than_or_equal_to "${1}" "0.12.10" && nvm_version_greater "0.13.0" "${1}"; then
    return 0
  fi

  # 0.10 系: node v0.10.42 以降には xz 版がある
  if nvm_version_greater_than_or_equal_to "${1}" "0.10.42" && nvm_version_greater "0.11.0" "${1}"; then
    return 0
  fi

  case "${NVM_OS}" in
    darwin)
      # darwin では io.js v2.3.2 以降にしか xz 版が無い
      nvm_version_greater_than_or_equal_to "${1}" "2.3.2"
    ;;
    *)
      nvm_version_greater_than_or_equal_to "${1}" "1.0.0"
    ;;
  esac
  return $?
}
```

```sh:line-numbers=6583 [原文]
nvm_supports_xz() {
  if [ -z "${1-}" ]; then
    return 1
  fi

  local NVM_OS
  NVM_OS="$(nvm_get_os)"
  if [ "_${NVM_OS}" = '_darwin' ]; then
    local MACOS_VERSION
    MACOS_VERSION="$(sw_vers -productVersion)"
    if nvm_version_greater "10.9.0" "${MACOS_VERSION}"; then
      # macOS 10.8 and earlier doesn't support extracting xz-compressed tarballs with tar
      return 1
    fi
  elif [ "_${NVM_OS}" = '_freebsd' ]; then
    if ! [ -e '/usr/lib/liblzma.so' ]; then
      # FreeBSD without /usr/lib/liblzma.so doesn't support extracting xz-compressed tarballs with tar
      return 1
    fi
  else
    if ! command which xz >/dev/null 2>&1; then
      # Most OSes without xz on the PATH don't support extracting xz-compressed tarballs with tar
      # (Should correctly handle Linux, SmartOS, maybe more)
      return 1
    fi
  fi

  # all node versions v4.0.0 and later have xz
  if nvm_is_merged_node_version "${1}"; then
    return 0
  fi

  # 0.12x: node v0.12.10 and later have xz
  if nvm_version_greater_than_or_equal_to "${1}" "0.12.10" && nvm_version_greater "0.13.0" "${1}"; then
    return 0
  fi

  # 0.10x: node v0.10.42 and later have xz
  if nvm_version_greater_than_or_equal_to "${1}" "0.10.42" && nvm_version_greater "0.11.0" "${1}"; then
    return 0
  fi

  case "${NVM_OS}" in
    darwin)
      # darwin only has xz for io.js v2.3.2 and later
      nvm_version_greater_than_or_equal_to "${1}" "2.3.2"
    ;;
    *)
      nvm_version_greater_than_or_equal_to "${1}" "1.0.0"
    ;;
  esac
  return $?
}
```

:::

## 前提知識

- **xz / gzip**: どちらもファイルの圧縮形式です。Node.js は `.tar.gz` と `.tar.xz` の両方で配布されています。
- **`sw_vers -productVersion`**: macOS のバージョン（`14.2.1` など）を表示するコマンドです。
- **`nvm_version_greater A B`**: A が B より新しければ成功を返す nvm の関数です。
- **`nvm_is_merged_node_version`**: Node.js と io.js が統合された後（v4.0.0 以降）のバージョンかを判定する nvm の関数です。
- **`command which xz`**: `xz` コマンドが PATH 上にあるかを調べます。
- **`return $?`**: 直前のコマンドの終了ステータスをそのまま返します。

## 何をしているか

### 1. このマシンで展開できるか

```sh:line-numbers=6598
    if ! [ -e '/usr/lib/liblzma.so' ]; then
```


OS ごとに確かめ方が違います。

- **macOS**: 10.8 以前の `tar` は xz を展開できないので、バージョンが 10.9.0 より古ければ失敗。
- **FreeBSD**: xz のライブラリ `/usr/lib/liblzma.so` が無ければ失敗。
- **それ以外**: `xz` コマンドが無ければ失敗。

### 2. そのバージョンに xz 版があるか

Node.js の歴史に沿って判定します。

- v4.0.0 以降はすべて xz 版がある。
- v0.12 系は v0.12.10 以降にある。
- v0.10 系は v0.10.42 以降にある。
- それ以外（io.js の時代）は、macOS では v2.3.2 以降、その他の OS では v1.0.0 以降にある。

「v0.12.10 以上 かつ v0.13.0 未満」のように、範囲を 2 つの比較の `&&` で表しています。

## ここがすごい

- **能力と在庫を分けて考える**: 「展開できるか（クライアント側）」と「配布されているか（サーバー側）」を順に確認しています。どちらかが欠けると失敗するので、両方のチェックが必要です。
- **歴史をコードに残す**: どのバージョンから xz 版があるかは、Node.js の配布の歴史そのものです。コメントで根拠が書かれているので、なぜこの数字なのかがわかります。
- **安全側の既定**: 判定できないときは失敗（gzip を使う）になります。gzip はほぼどこでも使えるので、ダウンロードが少し遅くなるだけで、インストール自体は失敗しません。

## まとめ

- より良い形式を使うときは、「使える環境か」と「用意されているか」の両方を確かめる。
- バージョンの範囲は `以上 && 未満` の 2 つの比較で表せる。
- 判定に迷うときは、どこでも動く安全な選択肢に倒す。
