---
title: "速い mawk があれば選んで、awk の種類を一度だけ決める"
description: "fzf のシェル補完が使う awk を、環境ごとに最も速いものへ切り替える関数。mawk のバージョンを読み取って、確かな版だけを選ぶ。"
language: shell
project: "fzf"
repo: https://github.com/junegunn/fzf
license: "MIT"
copyright: "Copyright (c) 2013-2026 Junegunn Choi"
commit: "26ff936df038b6a62ec42cf18db27b2ea2bb8ec3"
file: "shell/completion.bash"
lines: [44, 59]
function: "__fzf_exec_awk"
difficulty: 3
format: 2
tags: [移植性, 最適化, 文字列処理]
---
## ひとことで

`__fzf_exec_awk` は、fzf の補完で使う **awk のコマンド** を決めて、それを実行する関数です。最初の呼び出しで使う awk を決め、結果を変数 `__fzf_awk` に覚えておきます。2 回目以降は、覚えた awk をそのまま使います。

awk は、名前は同じでも実装が違います。fzf は大量の行を処理するので、速い実装を選べるなら選びたい。一方で、古い mawk には問題がある版もあるため、バージョンを確かめてから選んでいます。

## コード

```bash:line-numbers=44
__fzf_exec_awk() {
  if [[ -z ${__fzf_awk-} ]]; then
    __fzf_awk=awk
    if [[ $OSTYPE == solaris* && -x /usr/xpg4/bin/awk ]]; then
      __fzf_awk=/usr/xpg4/bin/awk
    elif command -v mawk > /dev/null 2>&1; then
      local n x y z d
      IFS=' .' read -r n x y z d <<< $(command mawk -W version 2> /dev/null)
      [[ $n == mawk ]] &&
        (((x * 1000 + y) * 1000 + z >= 1003004)) 2> /dev/null &&
        ((d >= 20230302)) 2> /dev/null &&
        __fzf_awk=mawk
    fi
  fi
  LC_ALL=C exec "$__fzf_awk" "$@"
}
```

## 前提知識

- **awk**: テキストを行ごとに処理する言語です。実装には、mawk、gawk、BSD awk などがあります。
- **mawk**: 高速な awk の実装です。バージョンによっては、特定の処理で問題が出ることがあります。
- **`IFS=' .' read -r n x y z d <<< ...`**: 区切り文字を空白とドットにして、バージョンの各部分を変数に読み込んでいます。
- **`(( ... ))`**: 算術式を評価し、結果が 0 以外なら成功になります。
- **`LC_ALL=C exec "$__fzf_awk" "$@"`**: 文字の扱いをバイト単位の C ロケールにしてから、選んだ awk に置き換わるように実行します。`exec` は、今のシェルを awk に置き換えます。

## 何をしているか

### 1. まだ決めていなければ、既定の awk にする

```bash:line-numbers=45
  if [[ -z ${__fzf_awk-} ]]; then
    __fzf_awk=awk
```

`__fzf_awk` がまだ空なら、まず既定として `awk` を入れます。一度決めたら、以降は再び調べません。

### 2. Solaris では専用の awk を使う

```bash:line-numbers=47
    if [[ $OSTYPE == solaris* && -x /usr/xpg4/bin/awk ]]; then
      __fzf_awk=/usr/xpg4/bin/awk
```

Solaris 系の OS では、POSIX 準拠の awk が別の場所にあるので、そちらを使います。

### 3. mawk のバージョンを確かめる

```bash:line-numbers=49
    elif command -v mawk > /dev/null 2>&1; then
      local n x y z d
      IFS=' .' read -r n x y z d <<< $(command mawk -W version 2> /dev/null)
```

`mawk` があれば、そのバージョンを読み取ります。出力から、名前、主、副、保守の番号と、日付のような数字を取り出します。

### 4. 条件を満たすときだけ mawk を選ぶ

```bash:line-numbers=52
      [[ $n == mawk ]] &&
        (((x * 1000 + y) * 1000 + z >= 1003004)) 2> /dev/null &&
        ((d >= 20230302)) 2> /dev/null &&
        __fzf_awk=mawk
```

名前が `mawk` で、バージョンが 1.3.4 の 20230302 以降の場合だけ、`__fzf_awk` に `mawk` を入れます。条件を満たさない古い版では、既定の awk のままにします。

## ここがすごい

- **一度だけ判定する**: 変数に覚えるので、補完のたびに `mawk -W version` を起動する無駄がありません。
- **安全な版だけ速い道を使う**: 速くても問題のある版は避けています。「速さ」と「正しさ」を、バージョンの条件で両立させています。
- **環境の違いを吸収**: Solaris のような特殊な環境の事情も、ひとまとめに扱っています。

## まとめ

- 外部コマンドの選択は、最初の一回で決めて覚えておくと速い。
- バージョンの比較は、数字を分けて算術で行うと確実。
- 速い実装を使うときも、既知の問題がある版は除外する。
