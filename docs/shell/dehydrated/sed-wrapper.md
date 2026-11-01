---
title: "GNU と BSD で違う sed の拡張正規表現の書き方を吸収する"
description: "Linux と MINGW では sed -r、それ以外では sed -E を使うよう切り替える小さな関数。同じスクリプトを、どの環境でも動かすための工夫。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [900, 906]
function: "_sed"
difficulty: 1
format: 2
tags: [移植性, 正規表現, イディオム]
---
## ひとことで

`_sed` は、`sed` の **拡張正規表現** を使うときのオプションを、環境に合わせて切り替える関数です。Linux と MINGW（Windows 上の Unix 環境）では `sed -r`、それ以外では `sed -E` を使います。

拡張正規表現は、`(` や `+` などを、エスケープなしで書ける形式です。ところが、GNU の sed は `-r` を、BSD の sed は `-E` を使うのが一般的で、どちらか一方だけでは動かない環境があります。この関数が、その違いを 1 か所で吸収しています。

## コード

```bash:line-numbers=900
_sed() {
  if [[ "${OSTYPE}" = "Linux" || "${OSTYPE:0:5}" = "MINGW" ]]; then
    sed -r "${@}"
  else
    sed -E "${@}"
  fi
}
```

## 前提知識

- **`sed -r` と `sed -E`**: どちらも拡張正規表現を有効にするオプションです。`-r` は GNU sed、`-E` は BSD sed や POSIX で使われる書き方です。
- **`"${OSTYPE}"`**: シェルが持つ OS の種類を表す変数です。Linux では `linux-gnu` のような値が入ります。
- **`"${@}"`**: 関数に渡されたすべての引数を、1 つずつ別々の引数として渡します。
- **`${OSTYPE:0:5}`**: 変数の先頭から 5 文字を取り出します。
- **`[[ A || B ]]`**: どちらかが真なら真になる条件です。

## 何をしているか

### 1. Linux か MINGW か調べる

```bash:line-numbers=901
  if [[ "${OSTYPE}" = "Linux" || "${OSTYPE:0:5}" = "MINGW" ]]; then
```

`OSTYPE` が `Linux` と等しい、または先頭 5 文字が `MINGW` であれば、GNU 系の書き方を使います。

### 2. GNU 系なら -r を付ける

```bash:line-numbers=902
    sed -r "${@}"
```

条件に当てはまるときは、`sed -r` で、渡された引数をそのまま処理します。

### 3. それ以外は -E を付ける

```bash:line-numbers=904
    sed -E "${@}"
```

それ以外の環境では、`sed -E` で処理します。

どちらの場合も、渡された引数はそのまま `sed` に届きます。呼ぶ側は、環境の違いを気にしなくて済みます。

## ここがすごい

- **呼ぶ側を変えずに済む**: 同じ `_sed` を呼ぶだけで、どの環境でも正しく動きます。違いを関数の中に閉じ込めています。
- **引数を変えずに渡す**: `"${@}"` で、スクリプトや式を一切加工せずに渡しています。
- **判定は 1 回の条件だけ**: 必要な情報は `OSTYPE` だけなので、外部のコマンドを起動せずに済みます。

## まとめ

- 環境による書き方の違いは、ラッパー関数で吸収すると楽になる。
- `OSTYPE` を見れば、大まかな OS の種類が分かる。
- 引数は加工せずに渡すと、呼ぶ側の意図を壊さない。
