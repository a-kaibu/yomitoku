---
title: "5 文字の設定から色を取り出し、tr で太字版を作る"
description: "NVM_COLORS=\"bygre\" のような 5 文字の設定から、n 番目の文字の色コードを返す関数。6 番目の色は tr で「0;」を「1;」に変えて太字にしている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1623, 1645]
function: "nvm_get_colors"
difficulty: 1
format: 2
tags: [文字列処理, CLI]
---
## ひとことで

`nvm_get_colors N` は、nvm の色設定から **N 番目の用途の色コード** を返す関数です。

nvm では、`nvm ls` などで使う色を `NVM_COLORS` という変数に 5 文字で指定できます。既定は `bygre` で、1 文字目の `b` は「インストール済み」の色（青）、2 文字目の `y` は「LTS とシステム」の色（黄）、という具合です。`nvm_get_colors 1` は `0;34m`（青）を返します。

## コード

```sh:line-numbers=1623
nvm_get_colors() {
  local COLOR
  local SYS_COLOR
  local COLORS
  COLORS="${NVM_COLORS:-bygre}"
  case $1 in
    1) COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 1, 1); }')");;
    2) COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 2, 1); }')");;
    3) COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 3, 1); }')");;
    4) COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 4, 1); }')");;
    5) COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 5, 1); }')");;
    6)
      SYS_COLOR=$(nvm_print_color_code "$(echo "$COLORS" | awk '{ print substr($0, 2, 1); }')")
      COLOR=$(nvm_echo "$SYS_COLOR" | command tr '0;' '1;')
      ;;
    *)
      nvm_err "Invalid color index, ${1-}"
      return 1
    ;;
  esac

  nvm_echo "$COLOR"
}
```

## 前提知識

- **`${NVM_COLORS:-bygre}`**: `NVM_COLORS` が未定義か空なら `bygre` を使います。
- **`case $1 in 1) ...;; esac`**: 引数の値によって分岐します。
- **`awk '{ print substr($0, 2, 1); }'`**: 入力行の 2 文字目から 1 文字を取り出して表示します。
- **`nvm_print_color_code`**: `b` → `0;34m` のように、1 文字の色名を端末の色コードに変換する nvm の関数です。
- **ANSI エスケープシーケンス**: 端末に色を付けるための特殊な文字列です。`\033[0;34m` で「普通の青」、`\033[1;34m` で「太字（明るい）青」になります。`0;` が通常、`1;` が太字です。
- **`tr 'abc' 'xyz'`**: 1 文字ずつ対応する文字に置き換えます。`a` → `x`、`b` → `y` です。

## 何をしているか

### 1. 設定を読む

`COLORS` に `NVM_COLORS` の値、無ければ `bygre` を入れます。

### 2. N 番目の文字を色コードに

引数が `1`〜`5` なら、`awk` で N 文字目を取り出し、`nvm_print_color_code` で色コードに変換します。たとえば `bygre` で `3` なら、3 文字目の `g` → `0;32m`（緑）です。

### 3. 6 番目は太字の LTS 色

`6` は設定の 5 文字には無い用途です。2 番目（LTS とシステム）の色を取り出し、`tr '0;' '1;'` で太字に変えます。

`tr '0;' '1;'` は「`0` を `1` に、`;` を `;` に」という 1 文字ずつの置き換えです。`0;33m` は `1;33m` になります。色番号の `33` に `0` は含まれないので、先頭の `0` だけが変わります。

### 4. それ以外はエラー

範囲外の番号なら、エラーを出して失敗を返します。

## ここがすごい

- **設定を 5 文字に圧縮**: 色の設定を `INSTALLED_COLOR=blue` のように 5 つの変数で持たせる代わりに、5 文字の文字列 1 つにしています。ユーザーは `nvm set-colors cgYmW` のように 1 語で設定できます。
- **太字版は計算で作る**: 6 番目の色を新たに設定させず、既存の色から導き出しています。設定項目が増えず、2 番目の色を変えれば 6 番目も自動で追従します。
- **`tr` を置換に使う小技**: `sed 's/^0;/1;/'` と書いても同じ結果ですが、`tr` は 1 文字単位の単純な置き換えなので、正規表現を考えなくて済みます。

ただし `tr` は文字の位置を見ないので、色コードの中のすべての `0` が `1` に変わります。nvm の色コードで色番号に `0` を含むのは黒（`0;30m`）だけで、黒を 2 番目の色に設定すると `1;31m`（太字の赤）になってしまいます。黒をその用途に選ぶ人はまずいないので、単純さを優先した書き方と読めます。

## まとめ

- 複数の設定を短い文字列にまとめると、ユーザーが扱いやすくなる。
- 派生する設定は、元の設定から計算すると管理が楽になる。
- 端末の色は ANSI エスケープシーケンスで指定し、`0;` と `1;` で通常と太字を切り替える。
