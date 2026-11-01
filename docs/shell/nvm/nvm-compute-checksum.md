---
title: "あるものを使う：8 種類のハッシュコマンドを順に試す"
description: "ダウンロードしたファイルのチェックサムを計算する関数。sha256sum、shasum、openssl など、OS ごとに違うコマンドを上から順に探して最初に見つかったものを使う。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [2825, 2861]
function: "nvm_compute_checksum"
difficulty: 1
tags: [移植性, ハッシュ, セキュリティ]
---
## ひとことで

`nvm_compute_checksum FILE` は、ファイルの **SHA-256 ハッシュ値**（チェックサム）を計算して表示する関数です。ダウンロードした Node.js が壊れていないか、改ざんされていないかを確かめるのに使います。

ハッシュを計算するコマンドは OS によって名前も使い方もばらばらです。この関数は 8 種類のコマンドを上から順に探し、**最初に見つかったものを使います**。

## コード

```sh:line-numbers=2825
nvm_compute_checksum() {
  local FILE
  FILE="${1-}"
  if [ -z "${FILE}" ]; then
    nvm_err 'Provided file to checksum is empty.'
    return 2
  elif ! [ -f "${FILE}" ]; then
    nvm_err 'Provided file to checksum does not exist.'
    return 1
  fi

  if nvm_has_non_aliased "sha256sum"; then
    nvm_err 'Computing checksum with sha256sum'
    command sha256sum "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "shasum"; then
    nvm_err 'Computing checksum with shasum -a 256'
    command shasum -a 256 "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "sha256"; then
    nvm_err 'Computing checksum with sha256 -q'
    command sha256 -q "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "gsha256sum"; then
    nvm_err 'Computing checksum with gsha256sum'
    command gsha256sum "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "openssl"; then
    nvm_err 'Computing checksum with openssl dgst -sha256'
    command openssl dgst -sha256 "${FILE}" | command awk '{print $NF}'
  elif nvm_has_non_aliased "bssl"; then
    nvm_err 'Computing checksum with bssl sha256sum'
    command bssl sha256sum "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "sha1sum"; then
    nvm_err 'Computing checksum with sha1sum'
    command sha1sum "${FILE}" | command awk '{print $1}'
  elif nvm_has_non_aliased "sha1"; then
    nvm_err 'Computing checksum with sha1 -q'
    command sha1 -q "${FILE}"
  fi
}
```

## 前提知識

- **ハッシュ値（チェックサム）**: ファイルの中身から計算する短い値です。中身が 1 バイトでも変わると、まったく違う値になります。配布元が公開している値と比べれば、ファイルが正しいかどうかがわかります。
- **SHA-256 / SHA-1**: ハッシュの計算方法の名前です。SHA-1 は古く、今は SHA-256 が推奨されています。
- **`nvm_has_non_aliased`**: コマンドがあり、しかもエイリアスではないかを調べる nvm の関数です。
- **`if ... elif ... elif ... fi`**: 条件を上から順に調べ、最初に成り立ったものだけを実行します。
- **`awk '{print $1}'`**: 行の最初の単語を表示します。`$NF` は最後の単語です。
- **`nvm_err`**: 標準エラーにメッセージを出す nvm の関数です。

## 何をしているか

### 1. 引数のチェック（2828〜2834 行目）

ファイル名が空なら `return 2`、ファイルが無ければ `return 1` で終わります。

### 2. コマンドを順に試す（2836〜2860 行目）

上から順に、次のコマンドを探します。

| コマンド | 主な環境 | ハッシュ値の取り出し方 |
| --- | --- | --- |
| `sha256sum` | Linux（GNU coreutils） | 出力の 1 列目 |
| `shasum -a 256` | macOS（Perl 付属） | 1 列目 |
| `sha256 -q` | FreeBSD | 1 列目 |
| `gsha256sum` | Homebrew で入れた coreutils | 1 列目 |
| `openssl dgst -sha256` | OpenSSL がある環境 | **最後の列** |
| `bssl sha256sum` | BoringSSL | 1 列目 |
| `sha1sum` / `sha1 -q` | SHA-256 が無い古い環境 | 1 列目 |

`sha256sum` の出力は `e3b0c442…  node.tar.gz` のように「ハッシュ値 + ファイル名」です。`awk '{print $1}'` で値だけを取り出します。`openssl` は `SHA256(node.tar.gz)= e3b0c442…` のように値が最後にあるので、`$NF` を使っています。

どのコマンドを使ったかは `nvm_err` で標準エラーに出します。標準出力にはハッシュ値だけを出したいからです。

## ここがすごい

- **「どこにでもあるもの」を探す順番**: よく使われる順、そして安全な SHA-256 を優先する順に並んでいます。SHA-1 は最後の手段です。
- **出力形式の違いを吸収**: コマンドごとに出力の形が違っても、この関数を呼ぶ側は「ハッシュ値の文字列が 1 つ返ってくる」とだけ考えればよくなっています。
- **情報とデータの出し分け**: 「何で計算したか」は標準エラー、結果は標準出力、と分けているので、`$(nvm_compute_checksum file)` で値だけを受け取れます。
- **エイリアスを避ける**: `nvm_has_non_aliased` と `command` で、ユーザーのエイリアスに出力形式を変えられてしまうのを防いでいます。

## まとめ

- 環境によって違うコマンドは、候補を順に試して最初に見つかったものを使う。
- 出力形式の違いはラッパー関数の中で吸収し、呼ぶ側には同じ形で返す。
- 結果は標準出力、ログは標準エラーと分けると、コマンド置換で扱いやすい。
