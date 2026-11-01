---
title: "実行ファイルの CPU の種類を、ファイルの情報から判断する"
description: "terraform の実行ファイルの情報を file コマンドで調べ、amd64・arm64・386・arm のどれかを表示する関数。判断できない場合は unknown を表示する。"
language: shell
project: "tfenv"
repo: https://github.com/tfutils/tfenv
license: "MIT"
copyright: "Copyright (c) 2016 Shinichi Ishimura"
commit: "de6ce2e809c155cbc5e2cfeb3b1bef151244e045"
file: "libexec/tfenv-list"
lines: [87, 102]
function: "detect_arch"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`detect_arch` は、**実行ファイルがどの CPU の種類向けかを、file コマンドの出力から判断する** 関数です。結果は `amd64` などの名前で返します。

tfenv は、インストールした terraform の種類を一覧に表示します。そのとき、どの CPU 用かを一緒に示すために、この関数を使います。

## コード

```bash:line-numbers=87
detect_arch() {
  local binary="${1}";
  if [ ! -f "${binary}" ]; then
    echo 'unknown';
    return;
  fi;
  local file_output;
  file_output="$(file -b "${binary}" 2>/dev/null)" || { echo 'unknown'; return; };
  case "${file_output}" in
    *x86-64*|*x86_64*)  echo 'amd64';;
    *aarch64*|*arm64*)   echo 'arm64';;
    *386*|*i386*|*80386*) echo '386';;
    *ARM,*)              echo 'arm';;
    *)                   echo 'unknown';;
  esac;
};
```

## 前提知識

- **`file -b`**: ファイルの種類を説明する文字列を、説明の見出しなしで表示するコマンドです。
- **CPU アーキテクチャ**: コンピュータの処理装置の種類です。`x86-64` や `aarch64` などがあります。
- **`case` 文**: 文字列のパターンによって処理を分ける、シェルの書き方です。
- **`2>/dev/null`**: 標準エラーを捨てる指定です。失敗しても、画面に余計な表示を出しません。

## 何をしているか

### 1. ファイルがなければ unknown

```bash:line-numbers=89
  if [ ! -f "${binary}" ]; then
    echo 'unknown';
    return;
  fi;
```

指定されたファイルが存在しないときは、`unknown` を表示して戻ります。

### 2. file コマンドの出力を取る

```bash:line-numbers=93
  local file_output;
  file_output="$(file -b "${binary}" 2>/dev/null)" || { echo 'unknown'; return; };
```

`file -b` で、ファイルの種類の説明を取ります。失敗したら、やはり `unknown` を返します。

### 3. 説明の文字列で CPU を判断する

```bash:line-numbers=95
  case "${file_output}" in
    *x86-64*|*x86_64*)  echo 'amd64';;
    *aarch64*|*arm64*)   echo 'arm64';;
    *386*|*i386*|*80386*) echo '386';;
    *ARM,*)              echo 'arm';;
    *)                   echo 'unknown';;
  esac;
```

`case` で、説明の文字列に含まれる CPU の名前を調べます。`x86-64` と `x86_64` は `amd64`、`aarch64` と `arm64` は `arm64` として扱います。どれにも当たらなければ `unknown` です。

## ここがすごい

- **外部の情報だけで判断する**: 実行ファイルを動かさずに、種類を調べられます。安全に確認できます。
- **表記の揺れを吸収する**: `x86-64` と `x86_64` の両方に対応しています。file の出力は、環境で違うことがあるためです。
- **判断できない場合の逃げ道**: 不明なときは `unknown` を返すので、失敗が表示の上で分かります。

## まとめ

- 外部ツールの出力は、表記の揺れを想定して判断する。
- 動かさずに調べられるなら、安全に確認できる。
- 判断できないときの値を決めておくと、後の処理が壊れにくい。
