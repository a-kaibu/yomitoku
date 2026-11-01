---
title: "直前のコミットを、種類と数を指定して取り消す"
description: "最近のコミットを、soft・mixed・hard のどれかの方法で、指定した数だけ戻す関数。取り消せない場合は理由を表示して止める。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-undo"
lines: [8, 24]
function: "_undo"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`_undo` は、**直近のコミットを指定した数だけ取り消す** 関数です。取り消しの方法は、`soft`、`mixed`、`hard` から選べます。

コミットを取り消す操作は、やり方を間違えると作業内容を失いかねません。この関数は、取り消せない場合を先に見つけて、分かりやすいメッセージで止めます。

## コード

```bash:line-numbers=8
function _undo()
{
  type=${1:-soft}
  undo_cnt=${2:-1}
  reset=${3:-""}

  if [ "$undo_cnt" -gt "$ccnt" ]; then
    echo "Only $ccnt $cstr, cannot undo $undo_cnt"
  elif [ "$type" = "hard" ] && [ "$ccnt" -eq "$undo_cnt" ]; then
    echo "Cannot hard undo all commits"
  elif [ "$type" = "soft" ] && [ "$ccnt" -eq 1 ]; then
    git update-ref -d HEAD
  else
    git reset "--$type" "HEAD~$undo_cnt"
  fi
  if [ "$reset" != "" ]; then git reset; fi
}
```

## 前提知識

- **コミット**: 変更をひとまとめに記録したものです。Git の履歴の 1 つの点です。
- **`git reset`**: 履歴の先頭を、指定した位置に戻すコマンドです。`--soft` は変更を残し、`--hard` は変更も捨てます。
- **`HEAD~n`**: 現在のコミットから、さかのぼって n 個前の位置を表す書き方です。
- **`git update-ref -d HEAD`**: 現在の枝の参照を削除します。履歴が 1 つだけのときに使われます。
- **`ccnt`**: 呼び出し元で数えた、コミットの総数です。この関数は、その値を使って判断します。

## 何をしているか

### 1. 指定数が多すぎないか調べる

```bash:line-numbers=13

  if [ "$undo_cnt" -gt "$ccnt" ]; then
```

指定された数が、コミットの総数より大きければ、取り消せないことを表示して止めます。

### 2. すべてを hard で消すのを防ぐ

```bash:line-numbers=15
    echo "Only $ccnt $cstr, cannot undo $undo_cnt"
  elif [ "$type" = "hard" ] && [ "$ccnt" -eq "$undo_cnt" ]; then
```

`hard` で、全コミットをまとめて取り消そうとすると、履歴が無くなります。その場合は、理由を表示して止めます。

### 3. 唯一のコミットを参照から外す

```bash:line-numbers=17
    echo "Cannot hard undo all commits"
  elif [ "$type" = "soft" ] && [ "$ccnt" -eq 1 ]; then
```

`soft` で、コミットが 1 つだけなら、`git update-ref -d HEAD` で参照を消します。`HEAD~1` が存在しないため、この別の書き方が必要です。

### 4. 指定の数だけ reset する

```bash:line-numbers=19
    git update-ref -d HEAD
  else
    git reset "--$type" "HEAD~$undo_cnt"
```

そのほかの場合は、`git reset` に指定の方法と `HEAD~n` を渡して、履歴を戻します。

### 5. 必要ならステージを外す

```bash:line-numbers=22
  fi
  if [ "$reset" != "" ]; then git reset; fi
```

3 つ目の引数が空でなければ、`git reset` を追加で実行して、変更をステージから外します。

## ここがすごい

- **危険な操作の前に確かめる**: 実行する前に、取り消せるかを判断します。思わぬ履歴の消失を防げます。
- **例外的な場合を分ける**: 1 件だけの特殊な場合を、別の経路で扱っています。通常の `reset` が失敗する場面を避けられます。
- **理由をそのまま伝える**: 止める場合は、どの数がなぜ無理かを表示します。利用者が次の操作を判断できます。

## まとめ

- 履歴を書き換える操作は、実行前に取り消せる条件を確かめる。
- 特殊な場合は、通常の経路から分けて扱うと安全。
- 止める理由を表示すると、利用者が次に何をすべきか分かる。
