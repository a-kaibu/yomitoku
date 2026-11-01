---
title: "概要を、利用者が選んだ形式で表示する"
description: "リポジトリの年齢、最終更新、作業日数、コミット数などをまとめ、表形式、1 行形式、詳しい形式のどれかで表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [223, 253]
function: "print_summary"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`print_summary` は、**リポジトリの概要を、利用者が選んだ形式で表示する** 関数です。年齢、最終更新、作業日数、コミット数、未コミットの数、作者などをまとめます。

同じ情報でも、一覧の表にするか、1 行にするか、詳しく並べるかで見やすさが変わります。この関数は、形式ごとに表示を分けています。

## コード

::: code-group

```bash:line-numbers=223 [日本語訳]
print_summary() {
  if [ "$OUTPUT_STYLE" = "tabular" ]; then
    tabular_headers="# Repo $SP Age $SP Last active $SP Active on $SP Commits $SP Uncommitted $SP Branch"
    echo -e "$tabular_headers\n$project $SP $(repository_age) $SP $(last_active) $SP $(active_days "$commit") days $SP $(commit_count "$commit") $SP $(uncommitted_changes_count) $SP $(current_branch_name)" | column -t -s "$COLUMN_CMD_DELIMTER"
  elif [ "$OUTPUT_STYLE" = "oneline" ]; then
    echo "$project / age: $(repository_age) / last active: $(last_active) / active on $(active_days "$commit") days / commits: $(commit_count "$commit") / uncommitted: $(uncommitted_changes_count) / branch: $(current_branch_name)"
  else
    echo
    echo " project     : $project"
    echo " repo age    : $(repository_age)"
    echo " branch:     : $(current_branch_name)"
    echo " last active : $(last_active)"
    echo " active on   : $(active_days "$commit") days"
    echo " commits     : $(commit_count "$commit")"

    # ファイル数は、Git の参照を渡せないので、参照が指定されたら無視します。
    if [ "$commit" = "HEAD" ]; then
      echo " files       : $(file_count)"
    fi
    echo " uncommitted : $(uncommitted_changes_count)"
    echo " authors     : "
    if [ -n "$DEDUP_BY_EMAIL" ]; then
      # $commit は空でもかまいません。
      # shellcheck の警告を抑える指定です。
      git shortlog $MERGES_ARG -n -s -e "$commit" | dedup_by_email | format_authors
    else
      # shellcheck の警告を抑える指定です。
      git shortlog $MERGES_ARG -n -s "$commit" | format_authors
    fi
  fi
}
```

```bash:line-numbers=223 [原文]
print_summary() {
  if [ "$OUTPUT_STYLE" = "tabular" ]; then
    tabular_headers="# Repo $SP Age $SP Last active $SP Active on $SP Commits $SP Uncommitted $SP Branch"
    echo -e "$tabular_headers\n$project $SP $(repository_age) $SP $(last_active) $SP $(active_days "$commit") days $SP $(commit_count "$commit") $SP $(uncommitted_changes_count) $SP $(current_branch_name)" | column -t -s "$COLUMN_CMD_DELIMTER"
  elif [ "$OUTPUT_STYLE" = "oneline" ]; then
    echo "$project / age: $(repository_age) / last active: $(last_active) / active on $(active_days "$commit") days / commits: $(commit_count "$commit") / uncommitted: $(uncommitted_changes_count) / branch: $(current_branch_name)"
  else
    echo
    echo " project     : $project"
    echo " repo age    : $(repository_age)"
    echo " branch:     : $(current_branch_name)"
    echo " last active : $(last_active)"
    echo " active on   : $(active_days "$commit") days"
    echo " commits     : $(commit_count "$commit")"

    # The file count doesn't support passing a git ref so ignore it if a ref is given
    if [ "$commit" = "HEAD" ]; then
      echo " files       : $(file_count)"
    fi
    echo " uncommitted : $(uncommitted_changes_count)"
    echo " authors     : "
    if [ -n "$DEDUP_BY_EMAIL" ]; then
      # the $commit can be empty
      # shellcheck disable=SC2086
      git shortlog $MERGES_ARG -n -s -e "$commit" | dedup_by_email | format_authors
    else
      # shellcheck disable=SC2086
      git shortlog $MERGES_ARG -n -s "$commit" | format_authors
    fi
  fi
}
```

:::

## 前提知識

- **`OUTPUT_STYLE`**: 表示の形式を表す変数です。`tabular` と `oneline` のどちらかで、それ以外は詳しい形式です。
- **`column -t`**: 区切りで分けた行を、列をそろえて表示するコマンドです。
- **`git shortlog`**: 作者ごとのコミット数を集計するコマンドです。
- **`dedup_by_email`** と **`format_authors`**: 同じファイル内で定義された、作者の集計と表示の関数です。

## 何をしているか

### 1. 表形式の場合

```bash:line-numbers=224
  if [ "$OUTPUT_STYLE" = "tabular" ]; then
    tabular_headers="# Repo $SP Age $SP Last active $SP Active on $SP Commits $SP Uncommitted $SP Branch"
    echo -e "$tabular_headers\n$project $SP $(repository_age) $SP $(last_active) $SP $(active_days "$commit") days $SP $(commit_count "$commit") $SP $(uncommitted_changes_count) $SP $(current_branch_name)" | column -t -s "$COLUMN_CMD_DELIMTER"
```

見出しと 1 行の値を並べて、列をそろえて表示します。値は、それぞれの計算の関数から得ます。

### 2. 1 行形式の場合

```bash:line-numbers=227
  elif [ "$OUTPUT_STYLE" = "oneline" ]; then
    echo "$project / age: $(repository_age) / last active: $(last_active) / active on $(active_days "$commit") days / commits: $(commit_count "$commit") / uncommitted: $(uncommitted_changes_count) / branch: $(current_branch_name)"
```

プロジェクト名、年齢、最終更新などを、スラッシュで区切って 1 行に並べます。

### 3. 詳しい形式の場合

```bash:line-numbers=230
    echo
    echo " project     : $project"
    echo " repo age    : $(repository_age)"
    echo " branch:     : $(current_branch_name)"
    echo " last active : $(last_active)"
    echo " active on   : $(active_days "$commit") days"
    echo " commits     : $(commit_count "$commit")"

    # ファイル数は、Git の参照を渡せないので、参照が指定されたら無視します。
    if [ "$commit" = "HEAD" ]; then
```

項目ごとに、名前と値を縦に並べて表示します。ファイル数は、HEAD を対象にしているときだけ出します。

### 4. 作者の一覧を出す

```bash:line-numbers=240
      echo " files       : $(file_count)"
    fi
    echo " uncommitted : $(uncommitted_changes_count)"
    echo " authors     : "
    if [ -n "$DEDUP_BY_EMAIL" ]; then
      # $commit は空でもかまいません。
      # shellcheck の警告を抑える指定です。
      git shortlog $MERGES_ARG -n -s -e "$commit" | dedup_by_email | format_authors
    else
      # shellcheck の警告を抑える指定です。
      git shortlog $MERGES_ARG -n -s "$commit" | format_authors
    fi
  fi
```

重複除去の設定があれば、メールアドレスで同じ人をまとめてから表示します。なければ、そのまま集計します。どちらの場合も、最後に割合の表にそろえます。

## ここがすごい

- **計算と表示を分ける**: 年齢や件数はそれぞれの関数に任せ、この関数は並べることに専念しています。
- **形式を 3 つ持つ**: 同じデータから、用途に合わせた見せ方を選べます。
- **条件付きの項目**: HEAD 以外のときは、ファイル数を出さないように、理由をコメントで残しています。

## まとめ

- 概要の表示は、計算と並べる処理を分けると読みやすい。
- 形式を複数用意すると、用途に合わせた見せ方ができる。
- 対象によって意味のない項目は、条件を付けて出さないようにする。
