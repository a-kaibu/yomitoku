---
title: "A..B の範囲指定で「先に進んだ数・遅れた数」を数える"
description: "リモートのブランチと比べて、自分が何コミット先行・遅延しているかをプロンプト用に表示する関数。rev-list の範囲指定と wc -l で数える。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/git.zsh"
lines: [268, 294]
function: "git_remote_status"
difficulty: 2
format: 2
tags: [CLI, 文字列処理]
---
## ひとことで

`git_remote_status` は、手元のブランチが **リモート（GitHub など）のブランチと比べてどれだけずれているか** をプロンプト用に表示する関数です。

- 自分だけが 3 コミット進んでいる → 「先行」の印（と `3`）
- リモートだけが 2 コミット進んでいる → 「遅延」の印（と `2`）
- 両方が進んでいる → 「分岐」の印
- 同じ → 「一致」の印

push や pull が必要かどうかが、プロンプトを見るだけでわかります。

## コード

```zsh:line-numbers=268
function git_remote_status() {
    local remote ahead behind git_remote_status git_remote_status_detailed
    remote=${$(__git_prompt_git rev-parse --verify ${hook_com[branch]}@{upstream} --symbolic-full-name 2>/dev/null)/refs\/remotes\/}
    if [[ -n ${remote} ]]; then
        ahead=$(__git_prompt_git rev-list ${hook_com[branch]}@{upstream}..HEAD 2>/dev/null | wc -l)
        behind=$(__git_prompt_git rev-list HEAD..${hook_com[branch]}@{upstream} 2>/dev/null | wc -l)

        if [[ $ahead -eq 0 ]] && [[ $behind -eq 0 ]]; then
            git_remote_status="$ZSH_THEME_GIT_PROMPT_EQUAL_REMOTE"
        elif [[ $ahead -gt 0 ]] && [[ $behind -eq 0 ]]; then
            git_remote_status="$ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE"
            git_remote_status_detailed="$ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE_COLOR$ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE$((ahead))%{$reset_color%}"
        elif [[ $behind -gt 0 ]] && [[ $ahead -eq 0 ]]; then
            git_remote_status="$ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE"
            git_remote_status_detailed="$ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE_COLOR$ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE$((behind))%{$reset_color%}"
        elif [[ $ahead -gt 0 ]] && [[ $behind -gt 0 ]]; then
            git_remote_status="$ZSH_THEME_GIT_PROMPT_DIVERGED_REMOTE"
            git_remote_status_detailed="$ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE_COLOR$ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE$((ahead))%{$reset_color%}$ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE_COLOR$ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE$((behind))%{$reset_color%}"
        fi

        if [[ -n $ZSH_THEME_GIT_PROMPT_REMOTE_STATUS_DETAILED ]]; then
            git_remote_status="$ZSH_THEME_GIT_PROMPT_REMOTE_STATUS_PREFIX${remote//\%/%%}$git_remote_status_detailed$ZSH_THEME_GIT_PROMPT_REMOTE_STATUS_SUFFIX"
        fi

        echo $git_remote_status
    fi
}
```

## 前提知識

- **upstream（上流）**: ローカルのブランチが追跡しているリモートのブランチです（`origin/main` など）。`ブランチ@{upstream}` で指せます。
- **`git rev-list A..B`**: 「B からはたどれるが、A からはたどれない」コミットを 1 行に 1 つ表示します。`@{upstream}..HEAD` なら「自分にはあるがリモートには無い」コミット、つまり先行している分です。
- **`wc -l`**: 行数を数えます。コミットの数になります。
- **`${$(コマンド)/A}`**: zsh では、コマンド置換の結果に直接置換をかけられます。`/refs\/remotes\/` で `refs/remotes/` を取り除いています。
- **`$hook_com[branch]`**: zsh の `vcs_info` が用意するブランチ名です。
- **`%{...%}`**: zsh のプロンプトで、表示幅に数えない部分（色の指定など）を囲む記号です。
- **`${remote//\%/%%}`**: 値の中の `%` をすべて `%%` にします。

## 何をしているか

### 1. 追跡しているリモートを調べる

`rev-parse --symbolic-full-name` で `refs/remotes/origin/main` を得て、`refs/remotes/` を取り除き `origin/main` にします。追跡していなければ空になり、何も表示しません。

### 2. 先行と遅延を数える

- `@{upstream}..HEAD` の数 → `ahead`（先行）
- `HEAD..@{upstream}` の数 → `behind`（遅延）

### 3. 4 通りに分ける

`ahead` と `behind` が 0 かどうかで、一致・先行・遅延・分岐のどれかにします。テーマが「詳細表示」を望んでいれば、数と色も付けた文字列も作ります。`$((ahead))` は、`wc -l` が付けることのある空白を取り除いて数だけにする効果もあります。

### 4. 詳細表示

リモート名を含めた形で表示します。リモート名に `%` が含まれていると、プロンプトの特殊記号と解釈されてしまうので、`%%` にエスケープしています。

## ここがすごい

- **2 回の範囲指定で 4 つの状態がわかる**: 「相手に無い自分のコミット」と「自分に無い相手のコミット」の 2 つの数だけで、一致・先行・遅延・分岐のすべてを表せます。集合の差を 2 方向から取る、という考え方です。
- **プロンプトの記号を意識したエスケープ**: プロンプトに出す文字列では `%` が特別な意味を持つので、外から来た値は `%%` にしています。ブランチ名やリモート名はユーザーが自由に付けられるので、大切な配慮です。
- **表示はテーマに任せる**: どんな印や色を使うかは `ZSH_THEME_...` 変数で決まります。ロジックと見た目が分かれているので、テーマごとに自由に表現できます。

## まとめ

- `git rev-list A..B | wc -l` で、A に無く B にあるコミットの数がわかる。
- 先行数と遅延数の 2 つで、ブランチの関係を 4 通りに分類できる。
- プロンプトに外部の値を出すときは、`%` をエスケープする。
