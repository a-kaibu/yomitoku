---
title: "テキストのファイルごとに、作者を取り出す"
description: "一覧に渡されたファイルのうち、テキストのものだけを選び、git blame で各行の作者を取り出す関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [173, 180]
function: "single_file"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`single_file` は、**渡されたファイルの 1 行ごとの作者を、git blame で取り出す** 関数です。バイナリのファイルは飛ばして、テキストだけを対象にします。

作者ごとの行数を数えるための、材料を作る関数です。どの行が誰の変更かを、1 行ずつ取り出します。

## コード

```bash:line-numbers=173
single_file() {
  while read -r data
  do
    if [[ $(file "$data") = *text* ]]; then
      git blame --line-porcelain "$data" 2>/dev/null | grep "^author " | LC_ALL=C sed -n 's/^author //p';
    fi
  done
}
```

## 前提知識

- **`git blame`**: ファイルの各行を、最後に変更した作者と共に表示するコマンドです。
- **`--line-porcelain`**: 各行の情報を、機械が読める形で出す指定です。作者の行が含まれます。
- **`file`**: ファイルの種類を調べるコマンドです。テキストかどうかを判断します。
- **`while read -r`**: 行ごとに読み取る、シェルの繰り返しの書き方です。`-r` は、バックスラッシュを解釈しません。

## 何をしているか

### 1. ファイル名を 1 つずつ読む

```bash:line-numbers=174
  while read -r data
  do
```

標準入力から、ファイルの名前を 1 行ずつ読み取ります。

### 2. テキストのファイルだけを選ぶ

```bash:line-numbers=176
    if [[ $(file "$data") = *text* ]]; then
      git blame --line-porcelain "$data" 2>/dev/null | grep "^author " | LC_ALL=C sed -n 's/^author //p';
```

`file` の結果に `text` が含まれるファイルだけを対象にします。画像などの中身は、行として数えられないためです。

### 3. 作者の行を取り出す

```bash:line-numbers=178
    fi
```

`git blame` の出力から、`author` で始まる行だけを選び、作者名だけを表示します。

## ここがすごい

- **対象を絞る**: テキストかどうかを先に判断するので、バイナリの読み込みで結果が乱れません。
- **機械向けの形式を使う**: `--line-porcelain` は、1 行ごとの情報が明確なので、抜き出しが単純になります。
- **エラーを捨てる**: `2>/dev/null` で、blame の失敗を表示しません。対象外のファイルで、画面が汚れないようにしています。

## まとめ

- ファイルの種類は、中身を見て判断してから処理する。
- 機械向けの出力を使うと、抜き出しが安定する。
- 補助的な失敗は、表示せず静かに捨てるとノイズが減る。
