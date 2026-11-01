---
title: "ファイルや URL を「その OS のやり方で」開く"
description: "macOS の open、Linux の xdg-open、WSL の cmd.exe などを OS に応じて使い分ける関数。WSL ではパスの変換と cmd.exe 用のエスケープまで行う。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [16, 44]
function: "open_command"
difficulty: 2
format: 2
tags: [移植性, CLI, 文字列処理]
---
## ひとことで

`open_command ファイルかURL` は、ファイルや URL を **OS の標準のアプリで開く** 関数です。macOS なら `open`、Linux なら `xdg-open`、Windows の WSL なら `cmd.exe /c start` と、OS ごとに違うコマンドを自動で選びます。

Oh My Zsh のほかの機能（Web 検索のプラグインなど）は、この関数を呼ぶだけで、どの OS でもブラウザを開けます。

## コード

::: code-group

```zsh:line-numbers=16 [日本語訳]
function open_command() {
  local open_cmd

  # 開くためのコマンドを決める
  case "$OSTYPE" in
    darwin*)  open_cmd='open' ;;
    cygwin*)  open_cmd='cygstart' ;;
    linux*)   [[ "$(uname -r)" != *icrosoft* ]] && open_cmd='nohup xdg-open' || {
                open_cmd='cmd.exe /c start ""'
                [[ -e "$1" ]] && { 1="$(wslpath -w "${1:a}")" || return 1 }
                [[ "$1" = (http|https)://* ]] && {
                  1="$(echo "$1" | sed -E 's/([&|()<>^])/^\1/g')" || return 1
                }
              } ;;
    msys*)    open_cmd='start ""' ;;
    *)        echo "Platform $OSTYPE not supported"
              return 1
              ;;
  esac

  # URL が渡されたとき、SSH 先などでは $BROWSER に手元のブラウザが設定されていることがある。
  # 参照: https://github.com/ohmyzsh/ohmyzsh/issues/11098
  if [[ -n "$BROWSER" && "$1" = (http|https)://* ]]; then
    "$BROWSER" "$@"
    return
  fi

  ${=open_cmd} "$@" &>/dev/null
}
```

```zsh:line-numbers=16 [原文]
function open_command() {
  local open_cmd

  # define the open command
  case "$OSTYPE" in
    darwin*)  open_cmd='open' ;;
    cygwin*)  open_cmd='cygstart' ;;
    linux*)   [[ "$(uname -r)" != *icrosoft* ]] && open_cmd='nohup xdg-open' || {
                open_cmd='cmd.exe /c start ""'
                [[ -e "$1" ]] && { 1="$(wslpath -w "${1:a}")" || return 1 }
                [[ "$1" = (http|https)://* ]] && {
                  1="$(echo "$1" | sed -E 's/([&|()<>^])/^\1/g')" || return 1
                }
              } ;;
    msys*)    open_cmd='start ""' ;;
    *)        echo "Platform $OSTYPE not supported"
              return 1
              ;;
  esac

  # If a URL is passed, $BROWSER might be set to a local browser within SSH.
  # See https://github.com/ohmyzsh/ohmyzsh/issues/11098
  if [[ -n "$BROWSER" && "$1" = (http|https)://* ]]; then
    "$BROWSER" "$@"
    return
  fi

  ${=open_cmd} "$@" &>/dev/null
}
```

:::

## 前提知識

- **`$OSTYPE`**: zsh が用意する、OS の種類を表す変数です（`darwin23.0`、`linux-gnu` など）。
- **`case ... in darwin*)`**: `darwin` で始まる値に一致します。
- **`[[ A != *icrosoft* ]]`**: zsh の条件式で、文字列が `icrosoft` を含まないかを調べます。WSL では `uname -r` に `Microsoft` か `microsoft` が含まれるので、先頭の 1 文字を省いて両方に一致させています。
- **`A && B || { ... }`**: A が成功すれば B、そうでなければ `{ ... }` の中を実行します。
- **`1="..."`**: zsh では `$1`（1 番目の引数）に直接代入できます。
- **`${1:a}`**: zsh の修飾子で、パスを絶対パスにします。
- **`(http|https)://*`**: zsh のパターンで、`http://` か `https://` で始まる文字列です。
- **`${=open_cmd}`**: zsh では変数を展開しても空白で分割されません。`=` を付けると、空白で分割して複数の単語にします。
- **`&>/dev/null`**: 標準出力と標準エラーの両方を捨てます。

## 何をしているか

### 1. OS ごとにコマンドを決める

```zsh:line-numbers=22
    cygwin*)  open_cmd='cygstart' ;;
```


- **macOS**: `open`
- **Cygwin**: `cygstart`
- **Linux**: 普通は `nohup xdg-open`。`nohup` で、ターミナルを閉じてもアプリが終了しないようにします。
- **WSL**（Linux だが中身は Windows）: `cmd.exe /c start ""` を使います。
  - ファイルなら、`wslpath -w` で `/home/me/a.pdf` を `\\wsl$\...\a.pdf` のような Windows のパスに変換します。
  - URL なら、`&` `|` `(` `)` `<` `>` `^` の前に `^` を付けます。これらは `cmd.exe` で特別な意味を持つ記号で、`^` が cmd.exe のエスケープ文字だからです。
- **MSYS2**: `start ""`
- **それ以外**: 対応していないと表示して失敗します。

### 2. SSH 先でのブラウザ

```zsh:line-numbers=36
  # If a URL is passed, $BROWSER might be set to a local browser within SSH.
```


URL で、しかも `$BROWSER` が設定されていれば、そちらを使います。SSH でつないだ先などでは、`xdg-open` よりユーザーが指定したブラウザのほうが適切だからです。

### 3. 実行

```zsh:line-numbers=43
  ${=open_cmd} "$@" &>/dev/null
```


`${=open_cmd}` で `cmd.exe /c start ""` を単語に分けてから実行します。出力は捨てます。

## ここがすごい

- **呼ぶ側は OS を気にしなくてよい**: OS の違いを 1 か所に閉じ込めているので、プラグインの作者は `open_command "$url"` と書くだけです。
- **WSL の細かい事情まで対応**: WSL では Linux のコマンドから Windows のアプリを開く必要があり、パスの形式も記号の意味も変わります。それを 2 行で吸収しています。
- **zsh の分割規則を理解した書き方**: zsh は安全のため変数を自動で分割しないので、複数の単語からなるコマンドを変数に入れたときは `${=var}` が必要です。

## まとめ

- OS ごとに違う処理は 1 つの関数にまとめ、呼ぶ側から隠す。
- 別のシェル（cmd.exe）に文字列を渡すときは、そのシェルのエスケープ規則に従う。
- zsh で変数の中身を単語に分けたいときは `${=var}` を使う。
