---
title: "シンボリックリンクをたどって、実体のパスを求める"
description: "シェルには無い readlink -f の代わりに、リンクを順にたどって、最終的な実体のパスを表示する関数。"
language: shell
project: "tfenv"
repo: https://github.com/tfutils/tfenv
license: "MIT"
copyright: "Copyright (c) 2016 Shinichi Ishimura"
commit: "de6ce2e809c155cbc5e2cfeb3b1bef151244e045"
file: "libexec/tfenv-list"
lines: [16, 27]
function: "readlink_f"
difficulty: 3
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`readlink_f` は、**シンボリックリンク（別の場所を指すファイル）を順にたどって、本当の場所のパスを求める** 関数です。tfenv は、この結果をもとに自分の置き場所を決めます。

GNU の `readlink -f` という便利なコマンドは、すべての環境にあるわけではありません。この関数は、標準のコマンドだけで同じ働きを実現するための代わりです。

## コード

```bash:line-numbers=16
  readlink_f() {
    local target_file="${1}";
    local file_name;

    while [ "${target_file}" != "" ]; do
      cd "$(dirname ${target_file})" || early_death "Failed to 'cd \$(dirname ${target_file})' while trying to determine TFENV_ROOT";
      file_name="$(basename "${target_file}")" || early_death "Failed to 'basename \"${target_file}\"' while trying to determine TFENV_ROOT";
      target_file="$(readlink "${file_name}")";
    done;

    echo "$(pwd -P)/${file_name}";
  };
```

## 前提知識

- **シンボリックリンク**: 別のファイルやディレクトリを指す、目印のようなファイルです。
- **`readlink`**: リンクが指す先を表示するコマンドです。リンクでなければ何も表示しません。
- **`dirname` と `basename`**: パスを、ディレクトリの部分と名前の部分に分けるコマンドです。
- **`pwd -P`**: 現在のディレクトリを、リンクをすべて解決した物理的な場所で表示します。

## 何をしているか

### 1. リンクが続く限り、たどる

```bash:line-numbers=18
    local file_name;

    while [ "${target_file}" != "" ]; do
      cd "$(dirname ${target_file})" || early_death "Failed to 'cd \$(dirname ${target_file})' while trying to determine TFENV_ROOT";
      file_name="$(basename "${target_file}")" || early_death "Failed to 'basename \"${target_file}\"' while trying to determine TFENV_ROOT";
      target_file="$(readlink "${file_name}")";
```

目標のファイルが空でない間、そのファイルがあるディレクトリへ移動します。そして、名前とリンク先を取り出して、次の目標にします。リンクでなくなると、リンク先が空になり、ループが終わります。

### 2. 実体の場所を表示する

```bash:line-numbers=25

    echo "$(pwd -P)/${file_name}";
```

最後に、今いる場所を `pwd -P` で物理的に表示し、最後のファイル名を付けて返します。

## ここがすごい

- **外部の道具に頼らない**: `readlink -f` が無い環境でも、標準の命令だけで同じ結果が得られます。
- **相対のリンクに対応する**: 各段階で必ずそのリンクのあるディレクトリへ移動してから調べるので、相対パスのリンクも正しくたどれます。
- **`pwd -P` で締める**: 途中の経路にリンクが含まれていても、最後に物理的な場所へ直せます。

## まとめ

- 環境差がある道具は、標準の命令の組み合わせで代わりを作れる。
- リンクは相対パスで書かれることがあるので、そのディレクトリに移動してから読む。
- 最終結果は、物理的な場所に直して返すと安定する。
