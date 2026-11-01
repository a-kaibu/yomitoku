---
title: "まだ指定していないブランチ名だけを補完する"
description: "全てのブランチの名前を集め、すでにコマンドに書かれた名前を除いたものを、補完の候補として出す関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "etc/git-extras-completion.zsh"
lines: [75, 82]
function: "__gitex_branch_names_unique"
difficulty: 3
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`__gitex_branch_names_unique` は、**ブランチ名の候補から、すでに入力済みのものを除いて出す** 関数です。同じ名前を 2 回指定してしまうのを防ぎます。

コマンドに複数のブランチを渡す場面では、既に書いた名前が、また候補に出ると邪魔です。この関数は、その重複を補完の段階で取り除きます。

## コード

```zsh:line-numbers=75
__gitex_branch_names_unique() {
    local expl
    declare -a branch_names already_specified
    branch_names=(${${(f)"$(_call_program branchrefs git for-each-ref --format='"%(refname)"' refs/heads 2>/dev/null)"}#refs/heads/})
    __gitex_command_successful || return
    already_specified=(${words[2,-1]})
    _wanted branch-names expl branch-name compadd -F already_specified $* - $branch_names
}
```

## 前提知識

- **`for-each-ref`**: Git の参照（ブランチなど）を、指定した形式で一覧にするコマンドです。
- **`refs/heads`**: Git のブランチの参照が置かれている場所です。
- **`words`**: zsh の補完で、今入力されているコマンドの単語の一覧です。
- **`compadd -F`**: 補完の候補を追加する命令です。`-F` で、除外する候補の配列を渡せます。
- **`_wanted`**: 補完の種類を宣言して、候補を出す zsh の関数です。

## 何をしているか

### 1. ブランチ名の一覧を取る

```zsh:line-numbers=76
    local expl
    declare -a branch_names already_specified
    branch_names=(${${(f)"$(_call_program branchrefs git for-each-ref --format='"%(refname)"' refs/heads 2>/dev/null)"}#refs/heads/})
```

`for-each-ref` で、ブランチの名前を取り出し、`refs/heads/` の部分を取り除いて配列に入れます。取得に失敗した場合は、エラーを捨てます。

### 2. Git の中かを確かめる

```zsh:line-numbers=79
    __gitex_command_successful || return
```

直前の命令が失敗していれば、ここで戻ります。Git のリポジトリの外では、候補を出しません。

### 3. 入力済みの名前を集める

```zsh:line-numbers=80
    already_specified=(${words[2,-1]})
```

コマンドの 2 番目以降の単語を、入力済みの名前として配列に入れます。

### 4. 残りの候補を出す

```zsh:line-numbers=81
    _wanted branch-names expl branch-name compadd -F already_specified $* - $branch_names
```

`compadd -F` に入力済みの名前を渡し、それ以外のブランチ名だけを候補にします。

## ここがすごい

- **除外を補完の仕組みに任せる**: 重複の除き方を自分で書かず、`compadd -F` の機能を使っています。
- **先に Git の状態を確かめる**: リポジトリの外で無駄な候補計算をせずに済みます。
- **表示の名前を整える**: 内部の参照の形を、ブランチ名の短い形に直してから出しています。

## まとめ

- 候補の除外は、補完の機能に任せると簡潔に書ける。
- 内部の参照は、使う人に分かりやすい名前に直して出す。
- 失敗しやすい前提は、先に確かめて戻る。
