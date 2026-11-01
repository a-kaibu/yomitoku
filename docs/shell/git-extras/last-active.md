---
title: "最後にコミットされてからの時間を出す"
description: "最新のコミットを 1 件だけ取り出し、その経過時間を相対表記で表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [166, 168]
function: "last_active"
difficulty: 1
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`last_active` は、**最後にコミットされてから、どれくらい経ったかを表示する** 関数です。直近の作業の新しさを示します。

同じ git-summary の中の `repository_age` と対になっています。始まりからの長さと、最近の動きを、並べて見せるための関数です。

## コード

```bash:line-numbers=166
last_active() {
  git log --pretty=oneline --format="%ar" -n 1
}
```

## 前提知識

- **`git log -n 1`**: 最新のコミットを 1 件だけ表示します。
- **`--pretty=oneline --format="%ar"`**: 表示の形を相対表記にする指定です。`--format` が優先されるので、経過時間だけが表示されます。
- **相対表記**: 「2 days ago」のように、今からの差を言葉で示す表示です。

## 何をしているか

### 1. 最新の 1 件を選ぶ

```bash:line-numbers=167
  git log --pretty=oneline --format="%ar" -n 1
```

`git log -n 1` で、最新のコミットを 1 件だけ取り出します。

### 2. その経過時間を表示する

```bash:line-numbers=167
  git log --pretty=oneline --format="%ar" -n 1
```

指定の書式で、そのコミットからの経過時間を表示します。関数の出力は、この 1 行だけです。

## ここがすごい

- **1 行で済む**: 比較や計算をせず、Git の書式機能に任せるので、とても短い関数です。
- **対になる関数との役割分担**: 始まりは `repository_age`、最近は `last_active` と、目的がはっきり分かれています。
- **履歴が無い場合も素直**: 履歴が無ければ、Git の出力がそのまま空になります。余計な処理を足していません。

## まとめ

- 最新の状態を知るには、最新の 1 件だけを取り出すと速い。
- 似た目的の関数は、対にして役割を分けると読みやすい。
- 書式の指定を活かすと、計算を書かずに済む。
