---
title: "1 行読めれば十分：read で git status を途中で打ち切る"
description: "プロンプトに「変更あり」マークを出すための関数。git status --porcelain の出力を全部ではなく 1 行だけ read で読み、空かどうかだけを判定する。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/git.zsh"
lines: [239, 265]
function: "parse_git_dirty"
difficulty: 2
format: 2
tags: [最適化, 入出力]
---
## ひとことで

`parse_git_dirty` は、今いる git リポジトリに **コミットしていない変更があるか** を調べ、プロンプト用の印（たとえば `✗`）を出す関数です。変更が無ければ「きれい」の印を出します。

プロンプトは Enter を押すたびに表示されるので、速さがとても大切です。この関数は、`git status` の出力を **1 行だけ読んで** 判定しています。

## コード

::: code-group

```zsh:line-numbers=239 [日本語訳]
function parse_git_dirty() {
  local STATUS
  local -a FLAGS
  FLAGS=('--porcelain')
  if [[ "$(__git_prompt_git config --get oh-my-zsh.hide-dirty)" != "1" ]]; then
    if [[ "${DISABLE_UNTRACKED_FILES_DIRTY:-}" == "true" ]]; then
      FLAGS+='--untracked-files=no'
    fi
    case "${GIT_STATUS_IGNORE_SUBMODULES:-}" in
      git)
        # git 自身に決めさせる（.gitmodules の設定に従う）
        ;;
      *)
        # 未設定なら、汚れたサブモジュールは無視する
        # それ以外の値は --ignore-submodules に渡す
        FLAGS+="--ignore-submodules=${GIT_STATUS_IGNORE_SUBMODULES:-dirty}"
        ;;
    esac
    # 空かどうかだけが大事なので、全体ではなく 1 行だけ保持する
    __git_prompt_git status ${FLAGS} 2> /dev/null | read -r STATUS
  fi
  if [[ -n $STATUS ]]; then
    echo "$ZSH_THEME_GIT_PROMPT_DIRTY"
  else
    echo "$ZSH_THEME_GIT_PROMPT_CLEAN"
  fi
}
```

```zsh:line-numbers=239 [原文]
function parse_git_dirty() {
  local STATUS
  local -a FLAGS
  FLAGS=('--porcelain')
  if [[ "$(__git_prompt_git config --get oh-my-zsh.hide-dirty)" != "1" ]]; then
    if [[ "${DISABLE_UNTRACKED_FILES_DIRTY:-}" == "true" ]]; then
      FLAGS+='--untracked-files=no'
    fi
    case "${GIT_STATUS_IGNORE_SUBMODULES:-}" in
      git)
        # let git decide (this respects per-repo config in .gitmodules)
        ;;
      *)
        # if unset: ignore dirty submodules
        # other values are passed to --ignore-submodules
        FLAGS+="--ignore-submodules=${GIT_STATUS_IGNORE_SUBMODULES:-dirty}"
        ;;
    esac
    # only non-emptiness matters, so keep one line instead of the whole list
    __git_prompt_git status ${FLAGS} 2> /dev/null | read -r STATUS
  fi
  if [[ -n $STATUS ]]; then
    echo "$ZSH_THEME_GIT_PROMPT_DIRTY"
  else
    echo "$ZSH_THEME_GIT_PROMPT_CLEAN"
  fi
}
```

:::

## 前提知識

- **`git status --porcelain`**: 変更のあるファイルを 1 行に 1 つ、機械が読みやすい形で出力します。変更が無ければ何も出力しません。
- **`local -a FLAGS`**: 配列のローカル変数を宣言します。
- **`FLAGS+='...'`**: zsh で配列に要素を追加します。
- **`${VAR:-既定値}`**: 変数が空なら既定値を使います。
- **`コマンド | read -r 変数`**: 出力の最初の行を変数に読み込みます。zsh では、パイプの最後のコマンドが **今のシェルで** 実行されるので、読んだ変数がそのまま使えます（bash では別のプロセスで動くため、この書き方では変数が残りません）。
- **`[[ -n $STATUS ]]`**: 変数が空でなければ真です。
- **`__git_prompt_git`**: ユーザーの設定に左右されない形で `git` を実行する Oh My Zsh の関数です。

## 何をしているか

### 1. オプションを組み立てる

```zsh:line-numbers=242
  FLAGS=('--porcelain')
```


基本は `--porcelain` です。

- リポジトリの設定 `oh-my-zsh.hide-dirty` が `1` なら、調べること自体をやめます。大きなリポジトリで遅いときのための逃げ道です。
- `DISABLE_UNTRACKED_FILES_DIRTY=true` なら、新しく作っただけのファイルは無視します。
- サブモジュールの変更をどう扱うかを `GIT_STATUS_IGNORE_SUBMODULES` で決めます。指定が無ければ `dirty`（サブモジュールの中の変更は無視）です。

### 2. 1 行だけ読む

```zsh:line-numbers=240
  local STATUS
```


`git status ... | read -r STATUS` で、出力の最初の行だけを `STATUS` に入れます。コメント「空でないかどうかだけが大事なので、リスト全体ではなく 1 行だけ持つ」のとおりです。

### 3. 印を出す

```zsh:line-numbers=240
  local STATUS
```


`STATUS` が空でなければ変更あり、空なら変更なしの印を表示します。

## ここがすごい

- **必要な情報だけを取る**: 知りたいのは「1 つでも変更があるか」だけです。変更が 1 万ファイルあっても、1 行読めば答えが出ます。`STATUS=$(git status --porcelain)` と書くと、全部の出力を変数にため込むことになります。
- **zsh のパイプの特性を活かす**: `| read` が今のシェルで動くのは zsh（と ksh）の性質です。コマンド置換を使わずに済むので、サブシェルを 1 つ減らせます。
- **遅いときの逃げ道を用意**: 巨大なリポジトリでは `git status` 自体が遅くなります。リポジトリごとにチェックを止められる設定を用意しているのは、プロンプトの関数として大切な配慮です。

## まとめ

- 「あるかないか」だけ知りたいときは、出力を全部読まずに 1 行で判断する。
- zsh ではパイプの最後のコマンドが今のシェルで動くので、`| read var` で変数に読める。
- プロンプトで使う処理は、遅い場合に無効化できるようにしておく。
