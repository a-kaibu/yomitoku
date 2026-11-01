---
title: "終了ステータス 128 で「リポジトリの外」を見分ける"
description: "今のブランチ名を返す関数。symbolic-ref の終了ステータスを見て、リポジトリ外なら何も返さず、ブランチでない状態ならコミットの短い ID を返す。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/git.zsh"
lines: [300, 309]
function: "git_current_branch"
difficulty: 1
format: 2
tags: [エラー処理, CLI]
---
## ひとことで

`git_current_branch` は、今チェックアウトしている **ブランチの名前** を返す関数です。`main` にいれば `main` を返します。

```sh
git pull origin $(git_current_branch)
```

のように、ブランチ名を打たずに済ませるために使われます。ブランチではなく特定のコミットを直接見ている状態（detached HEAD）なら、代わりに短いコミット ID（`a1b2c3d`）を返します。

## コード

::: code-group

```zsh:line-numbers=300 [日本語訳]
function git_current_branch() {
  local ref
  ref=$(__git_prompt_git symbolic-ref --quiet HEAD 2> /dev/null)
  local ret=$?
  if [[ $ret != 0 ]]; then
    [[ $ret == 128 ]] && return  # git リポジトリの外なら何も返さずに終わる
    ref=$(__git_prompt_git rev-parse --short HEAD 2> /dev/null) || return
  fi
  echo ${ref#refs/heads/}
}
```

```zsh:line-numbers=300 [原文]
function git_current_branch() {
  local ref
  ref=$(__git_prompt_git symbolic-ref --quiet HEAD 2> /dev/null)
  local ret=$?
  if [[ $ret != 0 ]]; then
    [[ $ret == 128 ]] && return  # no git repo.
    ref=$(__git_prompt_git rev-parse --short HEAD 2> /dev/null) || return
  fi
  echo ${ref#refs/heads/}
}
```

:::

## 前提知識

- **HEAD**: git で「今いる場所」を表すものです。普通はブランチを指していて、その中身は `refs/heads/main` のような文字列です。
- **`git symbolic-ref --quiet HEAD`**: HEAD がブランチを指していれば `refs/heads/main` を表示します。ブランチを指していなければ（detached HEAD）、何も表示せずに終了ステータス 1 を返します。git のリポジトリの外で実行すると、終了ステータス 128 を返します。
- **`git rev-parse --short HEAD`**: 今のコミットの短い ID を表示します。
- **`$?`**: 直前のコマンドの終了ステータスです。
- **`local ret=$?`**: 終了ステータスをすぐに変数に保存しています。
- **`${ref#refs/heads/}`**: 先頭の `refs/heads/` を取り除きます。

## 何をしているか

### 1. HEAD が指すものを調べる

`git symbolic-ref --quiet HEAD` の結果を `ref` に、終了ステータスを `ret` に入れます。

### 2. 失敗したときの場合分け

- `ret` が 128 なら、git のリポジトリの外です。何も表示せずに終わります。
- それ以外の失敗（detached HEAD）なら、`git rev-parse --short HEAD` で短いコミット ID を `ref` に入れます。これも失敗したら終わります。

### 3. 表示する

`refs/heads/main` なら先頭を取って `main` を表示します。コミット ID には `refs/heads/` が付いていないので、そのまま表示されます。

| 状態 | 表示 |
| --- | --- |
| `main` ブランチにいる | `main` |
| `feature/login` ブランチ | `feature/login` |
| detached HEAD | `a1b2c3d` |
| リポジトリの外 | （何も出ない） |

## ここがすごい

- **終了ステータスの番号で原因を区別**: git は「リポジトリではない」という致命的なエラーのときに 128 を返します。それ以外の失敗と分けることで、余計なコマンドを実行せずに済みます。
- **`--quiet` の効果**: コメントのとおり、`--quiet` を付けると、detached HEAD でも致命的なエラー（128）にはならず、静かに 1 を返します。これで 128 を「リポジトリの外」の意味だけに使えるようになっています。
- **`ret` をすぐ保存**: `$?` は次のコマンドで上書きされるので、`local ret=$?` で直後に保存しています。
- **2 段構えで必ず何かを返す**: ブランチ名が取れなければコミット ID、という順で、使う側は「今いる場所を表す文字列」が手に入ります。

## まとめ

- コマンドの終了ステータスの番号で、失敗の理由を見分けられることがある。
- `$?` は使う前に変数へ保存する。
- 第一候補が取れないときの代わりの値を用意すると、使う側が楽になる。
