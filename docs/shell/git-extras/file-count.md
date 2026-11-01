---
title: "管理されているファイルの数を数える"
description: "Git が追跡しているファイルの一覧を数え、その件数を空白を除いて表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [95, 97]
function: "file_count"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`file_count` は、**Git が管理しているファイルの数を数える** 関数です。作業ディレクトリにある全ファイルではなく、Git に登録された分だけを数えます。

git-summary の概要で、プロジェクトの規模を示す数字として使われます。ファイルが多いか少ないかを、ひと目で伝えられます。

## コード

```bash:line-numbers=95
file_count() {
  git ls-files | wc -l | tr -d ' '
}
```

## 前提知識

- **`git ls-files`**: Git が追跡しているファイルの一覧を表示するコマンドです。未登録のファイルは含みません。
- **`wc -l`**: 行の数を数えます。1 行に 1 ファイルなので、件数になります。
- **`tr -d ' '`**: 空白を取り除きます。`wc` の出力は、環境によって前後に空白が付くことがあるためです。

## 何をしているか

### 1. 追跡されているファイルを一覧にする

```bash:line-numbers=96
  git ls-files | wc -l | tr -d ' '
```

`git ls-files` で、Git に登録されたファイルの名前を 1 行ずつ出します。

### 2. 行数を数えて空白を除く

```bash:line-numbers=96
  git ls-files | wc -l | tr -d ' '
```

`wc -l` で行数を数え、`tr` で空白を取り除いて、数だけを表示します。

## ここがすごい

- **Git の情報をそのまま使う**: ファイルの走査を自分で書かず、Git の一覧を使うので、`.gitignore` の除外も自然に反映されます。
- **パイプで短く書く**: 1 行の中で、一覧作成、数え上げ、整形を済ませています。
- **見た目を揃える**: 空白を消すので、他の数字と並べたときに表示が揃います。

## まとめ

- ファイル数は、ファイルを走査せず Git の一覧を数えると速く正確。
- 数の表示は、余計な空白を消して使いやすくする。
- 小さな道具をパイプでつなぐと、一行で目的が果たせる。
