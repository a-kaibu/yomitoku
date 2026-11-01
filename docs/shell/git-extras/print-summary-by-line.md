---
title: "行数と作者の割合を、出力の形式に合わせて表示する"
description: "表示形式の設定に応じて、表形式、1 行形式、詳しい形式のどれかで、行数と作者ごとの割合を表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [208, 221]
function: "print_summary_by_line"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`print_summary_by_line` は、**行数と作者の割合を、利用者が選んだ形式で表示する** 関数です。表形式、1 行形式、詳しい形式の 3 つから選べます。

同じ情報でも、用途によって見やすい形は違います。この関数は、表示の形だけを切り替えて、中身の計算は他の関数に任せています。

## コード

```bash:line-numbers=208
print_summary_by_line() {
  if [ "$OUTPUT_STYLE" = "tabular" ]; then
    tabular_headers="# Repo $SP Lines"
    echo -e "$tabular_headers\n$project $SP $(line_count "${paths[@]}")" | column -t -s "$COLUMN_CMD_DELIMTER"
  elif [ "$OUTPUT_STYLE" = "oneline" ]; then
    echo "$project / lines: $(line_count "${paths[@]}")"
  elif [ -n "$SUMMARY_BY_LINE" ]; then
    echo
    echo " project     : $project"
    echo " lines       : $(line_count "${paths[@]}")"
    echo " authors     :"
    lines "${paths[@]}" | sort | uniq -c | sort -rn | format_authors
  fi
}
```

## 前提知識

- **`OUTPUT_STYLE`**: 表示の形式を表す、利用者が指定する変数です。`tabular` と `oneline` のどちらか、または空です。
- **`column -t`**: 区切りで分けた行を、列をそろえて表示するコマンドです。
- **`lines`**: 行数と作者を取り出す関数です。`sort | uniq -c` の材料を作ります。
- **`format_authors`**: 作者ごとの割合を表の形にする関数です。同じファイルに定義されています。

## 何をしているか

### 1. 表形式なら、ヘッダと一緒に並べる

```bash:line-numbers=209
  if [ "$OUTPUT_STYLE" = "tabular" ]; then
    tabular_headers="# Repo $SP Lines"
    echo -e "$tabular_headers\n$project $SP $(line_count "${paths[@]}")" | column -t -s "$COLUMN_CMD_DELIMTER"
```

`tabular` のときは、見出しとプロジェクトの行数を並べて、列をそろえて表示します。

### 2. 1 行形式なら、要点だけを出す

```bash:line-numbers=212
  elif [ "$OUTPUT_STYLE" = "oneline" ]; then
    echo "$project / lines: $(line_count "${paths[@]}")"
  elif [ -n "$SUMMARY_BY_LINE" ]; then
```

`oneline` のときは、プロジェクト名と行数を 1 行で表示します。

### 3. 詳しい形式なら、作者ごとに出す

```bash:line-numbers=215
    echo
    echo " project     : $project"
    echo " lines       : $(line_count "${paths[@]}")"
    echo " authors     :"
    lines "${paths[@]}" | sort | uniq -c | sort -rn | format_authors
  fi
```

`SUMMARY_BY_LINE` が設定されていれば、プロジェクト名、行数、作者の一覧を順に表示します。作者は、行数の多い順に並べます。

## ここがすごい

- **表示の形と計算を分ける**: この関数は、どこに何を出すかだけを決めます。数の計算は、別の関数に任せています。
- **同じ材料から 3 つの形を作る**: 利用者の好みに応じて、見せ方を変えられます。計算を繰り返さずに済みます。
- **並べ替えを最後に行う**: 作者の多い順に並べる処理を、表示の直前に置いています。

## まとめ

- 表示の形式は、分岐で切り替えると利用者が選べる。
- 計算と表示を分けると、形式を増やしても計算は変わらない。
- 一覧は、表示の直前にまとめて並べ替えると分かりやすい。
