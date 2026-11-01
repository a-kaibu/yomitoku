---
title: "追跡しているファイルの、各行の作者を出す"
description: "指定したファイルのうち Git が管理しているものを選び、それぞれの行の作者を一覧にして出す関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [189, 191]
function: "lines"
difficulty: 1
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`lines` は、**Git が管理しているファイルの各行について、作者の名前を一覧にする** 関数です。作者ごとの行数を数える材料になります。

ファイルの名前を引数で受け取り、その中身の作者を調べます。対象を絞れるので、特定のディレクトリだけを集計できます。

## コード

```bash:line-numbers=189
lines() {
  git ls-files -- "$@" | single_file
}
```

## 前提知識

- **`git ls-files --`**: Git が管理しているファイルの一覧を出すコマンドです。`--` の後ろにパスを書き、ファイル名として扱わせます。
- **`"$@"`**: 関数に渡された引数を、そのまま渡す書き方です。
- **パイプ先の関数**: `single_file` は、同じファイル内で定義されていて、ファイル名を受け取って作者を出します。

## 何をしているか

### 1. 管理されているファイルを選ぶ

```bash:line-numbers=190
  git ls-files -- "$@" | single_file
```

引数で指定されたパスの中から、Git が管理しているファイルだけを一覧にします。未登録のファイルは含みません。

### 2. 作者を調べて出す

```bash:line-numbers=190
  git ls-files -- "$@" | single_file
```

その一覧を `single_file` に渡します。テキストのファイルについて、各行の作者が出力されます。

## ここがすごい

- **対象を Git に決めさせる**: 管理されているファイルの判断を Git に任せるので、ビルドの成果物などを誤って数えません。
- **引数をそのまま流す**: 対象の指定を、この関数は加工しません。呼び出し側が自由に絞れます。
- **一行で完結する**: 一覧作成と作者の抽出を、パイプで続けて書いています。

## まとめ

- 対象ファイルは、Git の一覧を使うと誤りが少ない。
- 引数は加工せず、そのまま次の処理へ渡すと汎用性が保てる。
- 処理の流れは、パイプでつなぐと一目で追える。
