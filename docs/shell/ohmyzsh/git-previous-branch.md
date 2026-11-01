---
title: "@{-1} で「さっきまでいたブランチ」を得る"
description: "1 つ前にチェックアウトしていたブランチ名を返す関数。git の @{-1} 記法と rev-parse --symbolic-full-name を組み合わせ、ブランチ以外なら何も返さない。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/git.zsh"
lines: [314, 322]
function: "git_previous_branch"
difficulty: 1
tags: [CLI, イディオム]
---
## ひとことで

`git_previous_branch` は、**1 つ前にいたブランチの名前** を返す関数です。`main` から `feature` に移ってきたなら、`main` を返します。

```sh
git merge $(git_previous_branch)
```

のように、さっきのブランチを相手に何かしたいときに便利です。

## コード

```zsh:line-numbers=314
function git_previous_branch() {
  local ref
  ref=$(__git_prompt_git rev-parse --quiet --symbolic-full-name @{-1} 2> /dev/null)
  local ret=$?
  if [[ $ret != 0 ]] || [[ -z $ref ]]; then
    return  # no git repo or non-branch previous ref
  fi
  echo ${ref#refs/heads/}
}
```

## 前提知識

- **`@{-1}`**: git の特別な書き方で、「1 つ前にチェックアウトしたもの」を表します。`@{-2}` なら 2 つ前です。`git checkout -` はこれを使った省略形です。
- **`git rev-parse --symbolic-full-name 名前`**: 名前を `refs/heads/main` のような完全な形で表示します。名前がブランチを指していないとき（コミット ID を直接チェックアウトしていた場合など）は、何も表示しません。
- **`--quiet`**: エラーメッセージを出さないオプションです。
- **`$?`**: 直前のコマンドの終了ステータスです。
- **`[[ -z $ref ]]`**: 変数が空なら真です。
- **`${ref#refs/heads/}`**: 先頭の `refs/heads/` を取り除きます。

## 何をしているか

### 1. 1 つ前の場所を完全な名前で得る（316〜317 行目）

`git rev-parse --quiet --symbolic-full-name @{-1}` を実行し、結果と終了ステータスを保存します。

### 2. 使えないなら終わる（318〜320 行目）

次のどちらかなら、何も表示せずに終わります。

- コマンドが失敗した（リポジトリの外、まだ一度も移動していない、など）
- 結果が空（1 つ前がブランチではなかった）

313 行目のコメント「`rev-parse --symbolic-full-name @{-1}` は、それがブランチのときだけ出力する」がこの判定の根拠です。

### 3. ブランチ名だけを表示（321 行目）

`refs/heads/main` → `main` にして表示します。

## ここがすごい

- **git の記法をそのまま活かす**: 「前にいたブランチ」の情報は、git が reflog（移動の記録）に持っています。それを自分で解析せず、`@{-1}` という git の機能に任せています。
- **ブランチだけを返すことを保証**: `git rev-parse @{-1}` だけだとコミット ID が返りますが、`--symbolic-full-name` を付けると「ブランチの名前があるときだけ」名前が返ります。この関数を使う側は、返ってきたものが必ずブランチ名だと信頼できます。
- **失敗と空の両方を確認**: 終了ステータスだけでなく、出力が空かどうかも見ています。コマンドが成功しても目的の情報が無いことがあるからです。

## まとめ

- git の `@{-N}` で、N 回前にいたブランチやコミットを指せる。
- `--symbolic-full-name` を付けると、ブランチのときだけ名前が得られる。
- コマンドが成功しても出力が空のことがあるので、両方を確認する。
