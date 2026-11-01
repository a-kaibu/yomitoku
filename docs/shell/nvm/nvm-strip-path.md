---
title: "awk の RS=: で PATH を要素ごとに処理する"
description: "PATH から nvm が追加したディレクトリだけを取り除く。awk のレコード区切りをコロンにして PATH を 1 要素ずつ読む技と、末尾のコロンを守る細かい配慮がある。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1524, 1541]
function: "nvm_strip_path"
difficulty: 3
format: 2
tags: [文字列処理, 移植性, ハック]
---
## ひとことで

`nvm_strip_path "$PATH" /bin` は、`PATH` の中から **nvm が管理するディレクトリの `bin` だけを取り除いた** 新しい `PATH` を返します。

たとえば `PATH=/home/me/.nvm/versions/node/v20/bin:/usr/bin:/bin` なら、結果は `/usr/bin:/bin` です。`nvm deactivate` で nvm の Node.js を使うのをやめるときなどに使われます。

## コード

::: code-group

```sh:line-numbers=1524 [日本語訳]
nvm_strip_path() {
  if [ -z "${NVM_DIR-}" ]; then
    nvm_err '${NVM_DIR} not set!'
    return 1
  fi
  local RESULT
  RESULT="$(command printf %s "${1-}" | command awk -v NVM_DIR="${NVM_DIR}" -v RS=: '
  index($0, NVM_DIR) == 1 {
    path = substr($0, length(NVM_DIR) + 1)
    if (path ~ "^(/versions/[^/]*)?/[^/]*'"${2-}"'.*$") { next }
  }
  { printf "%s%s", sep, $0; sep=RS }')"
  # mawk は RT をサポートしないので、末尾のコロンは手作業で残す
  case "${1-}" in
    *:) command printf '%s:' "${RESULT}" ;;
    *) command printf '%s' "${RESULT}" ;;
  esac
}
```

```sh:line-numbers=1524 [原文]
nvm_strip_path() {
  if [ -z "${NVM_DIR-}" ]; then
    nvm_err '${NVM_DIR} not set!'
    return 1
  fi
  local RESULT
  RESULT="$(command printf %s "${1-}" | command awk -v NVM_DIR="${NVM_DIR}" -v RS=: '
  index($0, NVM_DIR) == 1 {
    path = substr($0, length(NVM_DIR) + 1)
    if (path ~ "^(/versions/[^/]*)?/[^/]*'"${2-}"'.*$") { next }
  }
  { printf "%s%s", sep, $0; sep=RS }')"
  # mawk does not support RT, so preserve trailing colon manually
  case "${1-}" in
    *:) command printf '%s:' "${RESULT}" ;;
    *) command printf '%s' "${RESULT}" ;;
  esac
}
```

:::

## 前提知識

- **`PATH`**: コマンドを探すディレクトリを `:` 区切りで並べた環境変数です。
- **awk のレコード区切り `RS`**: awk は入力を「レコード」に分けて 1 つずつ処理します。普通は 1 行が 1 レコードですが、`-v RS=:` とするとコロンで区切られた部分が 1 レコードになります。
- **`-v 名前=値`**: awk の変数に、シェルから値を渡します。
- **`index(s, t) == 1`**: 文字列 `s` が `t` で **始まっているか** を調べます（`t` が 1 文字目から見つかるか）。
- **`substr(s, n)`**: `s` の n 文字目以降を取り出します。
- **`next`**: 今のレコードの処理をやめて次へ進みます。
- **`'...'"${2-}"'...'`**: シングルクォートを一度閉じて、ダブルクォートの中でシェル変数を展開し、またシングルクォートを開く書き方です。awk のプログラムの中にシェルの値を埋め込んでいます。

## 何をしているか

### 1. `NVM_DIR` を確認

基準になる `NVM_DIR` が無ければエラーにします。

### 2. PATH を要素ごとに処理

`printf %s` で PATH を（改行を付けずに）出力し、`RS=:` の awk に渡します。awk は要素を 1 つずつ受け取ります。

- 要素が `NVM_DIR` で始まっていたら、`NVM_DIR` より後ろの部分を取り出します。
- それが `/versions/<種類>/<名前>/bin...` や `/<名前>/bin...` の形なら `next` で捨てます。
- 捨てなかった要素は、2 つ目以降なら前に区切り（`sep`）を付けて出力します。

`printf "%s%s", sep, $0; sep=RS` という書き方で、最初の要素の前にはコロンを付けず、2 つ目以降にだけ付けています。

### 3. 末尾のコロンを守る

PATH の末尾が `:` で終わっていると、「カレントディレクトリも探す」という意味になります。awk の出力ではこの末尾の空要素が失われるので、元の値が `:` で終わっていたら結果にも `:` を付け直します。コメントにあるとおり、gawk の `RT` という機能を使えば自動で扱えますが、mawk には無いため手作業で補っています。

## ここがすごい

- **区切り文字を RS にする発想**: `:` 区切りの値を、`tr ':' '\n'` で改行に変えてから処理して戻す、という手順を省き、awk に直接要素として読ませています。
- **前方一致を正規表現でなく `index` で**: `NVM_DIR` に `.` などの正規表現の記号が含まれていても、`index` は文字列としてそのまま比べるので誤動作しません。
- **区切りの付け方のイディオム**: `printf sep $0; sep=RS` は「最初だけ区切りを付けない」ための定番テクニックで、どの言語でも使えます。
- **awk の実装差まで考慮**: gawk 前提で書けば短くなるところを、mawk でも同じ結果になるよう、末尾のコロンを自分で補っています。

## まとめ

- `awk -v RS=:` で、コロン区切りの値を要素ごとに処理できる。
- 「最初の要素の前だけ区切りを付けない」には、区切り変数を後から設定する。
- PATH の末尾の `:` には意味があるので、加工するときは消さないよう注意する。
