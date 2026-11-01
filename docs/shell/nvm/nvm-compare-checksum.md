---
title: "失敗の理由ごとに違う終了ステータスを返す検証関数"
description: "計算したチェックサムと期待する値を比べる関数。引数の不足、ファイルの不在、不一致をそれぞれ別の番号で返し、計算できない環境では警告して続行する。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [2863, 2893]
function: "nvm_compare_checksum"
difficulty: 1
format: 2
tags: [エラー処理, セキュリティ, ハッシュ]
---
## ひとことで

`nvm_compare_checksum FILE 期待値` は、ファイルのチェックサムを計算し、**期待値と一致するか** を確かめる関数です。一致すれば `Checksums matched!` と表示して成功を返します。

注目したいのは、失敗の **理由ごとに別々の終了ステータス**（1〜4）を返している点と、チェックサムを計算できない環境では警告を出して先に進む、という割り切りです。

## コード

::: code-group

```sh:line-numbers=2863 [日本語訳]
nvm_compare_checksum() {
  local FILE
  FILE="${1-}"
  if [ -z "${FILE}" ]; then
    nvm_err 'Provided file to checksum is empty.'
    return 4
  elif ! [ -f "${FILE}" ]; then
    nvm_err 'Provided file to checksum does not exist.'
    return 3
  fi

  local COMPUTED_SUM
  COMPUTED_SUM="$(nvm_compute_checksum "${FILE}")"

  local CHECKSUM
  CHECKSUM="${2-}"
  if [ -z "${CHECKSUM}" ]; then
    nvm_err 'Provided checksum to compare to is empty.'
    return 2
  fi

  if [ -z "${COMPUTED_SUM}" ]; then
    nvm_err "Computed checksum of '${FILE}' is empty." # Raspberry Pi 用のバイナリでは欠けている
    nvm_err 'WARNING: Continuing *without checksum verification*'
    return
  elif [ "${COMPUTED_SUM}" != "${CHECKSUM}" ] && [ "${COMPUTED_SUM}" != "\\${CHECKSUM}" ]; then
    nvm_err "Checksums do not match: '${COMPUTED_SUM}' found, '${CHECKSUM}' expected."
    return 1
  fi
  nvm_err 'Checksums matched!'
}
```

```sh:line-numbers=2863 [原文]
nvm_compare_checksum() {
  local FILE
  FILE="${1-}"
  if [ -z "${FILE}" ]; then
    nvm_err 'Provided file to checksum is empty.'
    return 4
  elif ! [ -f "${FILE}" ]; then
    nvm_err 'Provided file to checksum does not exist.'
    return 3
  fi

  local COMPUTED_SUM
  COMPUTED_SUM="$(nvm_compute_checksum "${FILE}")"

  local CHECKSUM
  CHECKSUM="${2-}"
  if [ -z "${CHECKSUM}" ]; then
    nvm_err 'Provided checksum to compare to is empty.'
    return 2
  fi

  if [ -z "${COMPUTED_SUM}" ]; then
    nvm_err "Computed checksum of '${FILE}' is empty." # missing in raspberry pi binary
    nvm_err 'WARNING: Continuing *without checksum verification*'
    return
  elif [ "${COMPUTED_SUM}" != "${CHECKSUM}" ] && [ "${COMPUTED_SUM}" != "\\${CHECKSUM}" ]; then
    nvm_err "Checksums do not match: '${COMPUTED_SUM}' found, '${CHECKSUM}' expected."
    return 1
  fi
  nvm_err 'Checksums matched!'
}
```

:::

## 前提知識

- **終了ステータス**: コマンドや関数が返す 0〜255 の数です。0 が成功、それ以外が失敗です。数を変えることで「どんな失敗か」を伝えられます。
- **`return`**: 関数を終わらせます。数を省略すると、直前のコマンドの終了ステータスを返します。
- **`[ -z 文字列 ]`**: 空なら真です。
- **`! [ -f ファイル ]`**: 通常のファイルが **無ければ** 真です。
- **`nvm_compute_checksum`**: SHA-256 などを計算する nvm の関数です（別記事で解説）。
- **`"\\${CHECKSUM}"`**: ダブルクォートの中の `\\` は `\` 1 文字になります。つまり「先頭に `\` が付いた期待値」です。

## 何をしているか

### 1. 引数とファイルを確認

ファイル名が空なら `4`、ファイルが無ければ `3` を返します。

### 2. 計算する

```sh:line-numbers=2875
  COMPUTED_SUM="$(nvm_compute_checksum "${FILE}")"
```


`nvm_compute_checksum` でハッシュ値を計算して `COMPUTED_SUM` に入れます。

### 3. 期待値の確認

比べる相手の値が空なら `2` を返します。

### 4. 計算できなかったとき

計算結果が空、つまりこの環境にハッシュを計算できるコマンドが無かった場合は、警告を 2 行出して **成功として先に進みます**。コメントによると、Raspberry Pi 用のある環境でハッシュ用のコマンドが無かったことへの対応です。

### 5. 比べる

計算結果が期待値と違えば、両方の値を表示して `1` を返します。ただし、計算結果が「`\` + 期待値」の場合も一致とみなします。GNU の `sha256sum` は、ファイル名に `\` や改行などの特殊な文字が含まれていると、出力の先頭に `\` を付ける仕様があるためと考えられます。

### 6. 一致

```sh:line-numbers=2892
  nvm_err 'Checksums matched!'
```


`Checksums matched!` を表示して終わります。

## ここがすごい

- **終了ステータスで原因を伝える**: 呼び出し側は `$?` を見れば「ファイルが無い」のか「値が違う」のかを区別できます。テストでも、どの分岐を通ったかを数字で確認できます。
- **安全と使いやすさの割り切りを明示**: 検証できない環境でインストールを完全に止めるのも 1 つの考え方ですが、nvm は「検証なしで続行する」ことを **大きく警告したうえで** 選んでいます。黙って続けないところが大切です。
- **ツールの癖まで吸収**: 一部の `sha256sum` が付ける先頭の `\` を許すことで、正しいファイルを「不一致」と誤判定しないようにしています。

## まとめ

- 失敗の原因が複数あるときは、終了ステータスを分けると呼び出し側が判断しやすい。
- 安全確認を省くときは、黙らずにはっきり警告する。
- 外部コマンドの出力の癖は、比較する側で吸収できる。
