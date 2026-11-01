---
title: "指定したコミットまでの件数を数える"
description: "git rev-list で、対象のコミットに至るまでのコミットの数を数えて表示する関数。マージを含めるかは設定で決まる。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [87, 90]
function: "commit_count"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`commit_count` は、**対象のコミットまでに、いくつのコミットがあるかを数える** 関数です。git-summary の概要で、履歴の長さを示すために使われます。

マージのコミットを数えるかどうかは、呼び出し側の設定で決まります。その設定を、そのまま Git に渡しています。

## コード

::: code-group

```bash:line-numbers=87 [日本語訳]
commit_count() {
  # shellcheck の警告を抑える指定です。
  git rev-list $MERGES_ARG --count "$commit"
}
```

```bash:line-numbers=87 [原文]
commit_count() {
  # shellcheck disable=SC2086
  git rev-list $MERGES_ARG --count "$commit"
}
```

:::

## 前提知識

- **`git rev-list`**: コミットの一覧を、指定した条件で出すコマンドです。`--count` を付けると、件数だけを表示します。
- **`$MERGES_ARG`**: マージを含めるかどうかの指定を入れる変数です。呼び出し側が、その値を決めます。
- **`$commit`**: 数える起点になるコミットです。呼び出し側で設定されます。

## 何をしているか

### 1. マージの指定を付けて件数を数える

```bash:line-numbers=89
  git rev-list $MERGES_ARG --count "$commit"
```

`git rev-list` に、マージの指定と `--count`、起点のコミットを渡します。結果は件数の数字として表示されます。

## ここがすごい

- **件数の計算を Git に任せる**: 履歴をたどって数える処理を書かずに済みます。
- **設定を素通しする**: マージを含めるかどうかの判断は、呼び出し側に任せています。この関数は、命令の組み立てだけを担当します。
- **一行で完結する**: 関数の本体は一行です。役割が明確で、読むのが容易です。

## まとめ

- 件数は、履歴を数える専用の機能に任せると簡単で正確。
- 挙動を変える設定は、呼び出し側から渡すと関数を汎用的に保てる。
- 一つの役割だけの関数は、短く書いても分かりやすい。
