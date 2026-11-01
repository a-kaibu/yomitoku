---
title: "補完用に、最近のコミットの一覧を出す"
description: "直近 15 件のコミットを、短いハッシュ付きの一覧にして、補完の候補として表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "etc/git-extras-completion.zsh"
lines: [39, 48]
function: "__gitex_commits"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`__gitex_commits` は、**最近のコミットを、補完の候補として一覧にする** 関数です。候補の中身は、短いハッシュと説明の文です。

コミットを指定する場面で、ハッシュを覚えて打つのは大変です。Tab を押すと、最近の 15 件から選べるようにしています。

## コード

```zsh:line-numbers=39
__gitex_commits() {
    declare -A commits
    git log --oneline -15 | sed 's/\([[:alnum:]]\{7\}\) /\1:/' | while read commit
    do
        hash=$(echo $commit | cut -d':' -f1)
        commits[$hash]="$commit"
    done
    local ret=1
    _describe -t commits commit commits && ret=0
}
```

## 前提知識

- **連想配列**: 文字の鍵に値を結びつける型です。ここでは、ハッシュを鍵にして、コミットの説明を入れています。
- **`git log --oneline -15`**: 直近 15 件のコミットを、1 行ずつ短い形で表示するコマンドです。
- **`sed`**: 文字列を置き換える道具です。ハッシュの後ろの空白を、コロンに変えています。
- **`_describe`**: 補完の候補を、説明付きで表示する zsh の関数です。

## 何をしているか

### 1. 直近のコミットを 1 行ずつ整える

```zsh:line-numbers=40
    declare -A commits
```

`git log` の出力を、7 文字のハッシュの後ろの空白を、コロンに変えて整えます。読み取った 1 行ずつを、後の処理へ渡します。

### 2. ハッシュを鍵にして登録する

```zsh:line-numbers=41
    git log --oneline -15 | sed 's/\([[:alnum:]]\{7\}\) /\1:/' | while read commit
    do
        hash=$(echo $commit | cut -d':' -f1)
        commits[$hash]="$commit"
```

行からハッシュを取り出し、連想配列の鍵にします。値には、行全体の説明を入れます。

### 3. 候補として表示する

```zsh:line-numbers=45
    done
    local ret=1
    _describe -t commits commit commits && ret=0
```

`_describe` に連想配列の中身を渡して、候補として表示します。候補が出せたら、戻り値を 0 にします。

## ここがすごい

- **候補に説明を付ける**: ハッシュだけでなく、コミットの説明も一緒に見せるので、どれを選ぶかが分かります。
- **鍵で重複を避ける**: 同じハッシュは 1 つにまとまります。候補が重ならずに出ます。
- **一覧の件数を絞る**: 直近 15 件に限るので、候補が多すぎず、探しやすくなります。

## まとめ

- 補完の候補は、説明付きで出すと選びやすい。
- 連想配列の鍵を使うと、重複を自然に除ける。
- 候補の件数は、探しやすい上限を決めておく。
