---
title: "補完の前に、Git のリポジトリの中かを確かめる"
description: "補完の途中で直前の命令が失敗していないかを調べ、失敗していれば「git リポジトリではない」と表示して戻る関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "etc/git-extras-completion.zsh"
lines: [31, 37]
function: "__gitex_command_successful"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`__gitex_command_successful` は、**補完の途中で、直前の命令が成功したかを確かめる** 関数です。Git のリポジトリの外で補完を試したとき、その事実を利用者に伝えます。

zsh の補完は、候補を集めるために、Git のコマンドを裏で呼びます。その命令が失敗していれば、候補は出せません。この関数は、その失敗を見つけて、理由を表示します。

## コード

```zsh:line-numbers=31
__gitex_command_successful () {
  if (( ${#*:#0} > 0 )); then
    _message 'not a git repository'
    return 1
  fi
  return 0
}
```

## 前提知識

- **補完の仕組み**: zsh では、Tab を押したときに、候補を計算する関数が呼ばれます。
- **`_message`**: 補完の画面に、メッセージを表示する zsh の関数です。候補の代わりに、説明を出せます。
- **`${#*:#0}`**: 引数の中で、値が 0 でないものを数える書き方です。0 以外の戻り値（失敗）がいくつあるかを調べます。
- **戻り値**: 命令が成功したかどうかを表す数です。0 なら成功です。

## 何をしているか

### 1. 失敗の戻り値があるか調べる

```zsh:line-numbers=32
  if (( ${#*:#0} > 0 )); then
```

引数の中に、0 以外の値（失敗）があるかを数えます。1 つでも失敗があれば、次へ進みます。

### 2. 失敗なら理由を表示して戻る

```zsh:line-numbers=33
    _message 'not a git repository'
    return 1
  fi
```

「git リポジトリではない」というメッセージを表示し、失敗の戻り値 1 を返します。

### 3. 成功なら 0 を返す

```zsh:line-numbers=36
  return 0
}
```

失敗が無ければ、成功として 0 を返します。呼び出し側は、この値を見て続きを行うかを決めます。

## ここがすごい

- **失敗を補完の画面で伝える**: 候補が出ない理由を、補完のメッセージとして表示するので、利用者は何が起きたかを理解できます。
- **戻り値で流れを制御する**: 呼び出し側は、この関数が成功したら続き、失敗したら戻る、という形で書けます。
- **引数をまとめて調べる**: 複数の命令の結果を、1 つの関数でまとめて判定できます。

## まとめ

- 補完の途中の失敗は、理由をメッセージとして見せると分かりやすい。
- 成功と失敗を戻り値で返すと、呼び出し側の流れが簡潔になる。
- 複数の結果は、まとめて判定する関数を作ると重複を減らせる。
