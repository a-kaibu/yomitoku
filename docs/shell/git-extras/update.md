---
title: "git-extras を、最新のインストール用スクリプトで更新する"
description: "現在の git-extras の場所から導入先を求め、インストール用のスクリプトを取得して実行し、更新後のバージョンを表示する関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-extras"
lines: [6, 14]
function: "update"
difficulty: 2
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`update` は、**git-extras を、インストール用のスクリプトで新しいものに入れ替える** 関数です。`git extras update` と打つと、この処理が動きます。

同じ場所に新しい版を入れ直すため、導入先は今の git-extras の場所から決めます。更新が終わったら、新しいバージョンを表示します。

## コード

```bash:line-numbers=6
update() {
  local bin="$(command -v git-extras)"
  local prefix=${bin%/*/*}
  local orig=$PWD

  curl -s $INSTALL_SCRIPT | PREFIX="$prefix" bash /dev/stdin \
    && cd "$orig" \
    && echo "... updated git-extras $VERSION -> $(git extras --version)"
}
```

## 前提知識

- **`command -v`**: コマンドの場所を表示する命令です。見つからなければ何も出ません。
- **`${bin%/*/*}`**: 文字列の末尾から、「/」で区切られた 2 階層分を取り除く書き方です。導入先のディレクトリを求めます。
- **`curl -s`**: 静かにファイルを取得するコマンドです。進行の表示を出しません。
- **`PREFIX`**: インストールの先を指定する環境変数です。
- **`&&` の連なり**: 前の処理が成功したときだけ、次の処理へ進む書き方です。

## 何をしているか

### 1. 導入先を求める

```bash:line-numbers=7
  local bin="$(command -v git-extras)"
  local prefix=${bin%/*/*}
```

git-extras の実行ファイルの場所から、2 階層上を導入先とします。現在のディレクトリも、後で戻るために覚えておきます。

### 2. インストール用スクリプトを取得して実行する

```bash:line-numbers=10

  curl -s $INSTALL_SCRIPT | PREFIX="$prefix" bash /dev/stdin \
```

`INSTALL_SCRIPT` で指定された URL からスクリプトを取得し、`PREFIX` を付けて `bash` に渡します。

### 3. 元のディレクトリに戻り、結果を表示する

```bash:line-numbers=12
    && cd "$orig" \
    && echo "... updated git-extras $VERSION -> $(git extras --version)"
```

成功したら、元のディレクトリに戻り、更新後のバージョンを表示します。途中で失敗すると、後の処理は行いません。

## ここがすごい

- **導入先を自動で決める**: 利用者が場所を指定しなくても、今の git-extras と同じ場所に入れ直せます。
- **失敗で止まる**: `&&` でつないでいるため、取得や実行に失敗すると、中途半端な状態で表示を続けません。
- **元の場所を守る**: 作業の前のディレクトリを覚えて、終わったら戻ります。利用者の作業場所が変わりません。

## まとめ

- 導入先は、今の実行ファイルの場所から決めると、利用者の設定が要らない。
- 取得と実行は `&&` でつなぐと、失敗時に後の処理を止められる。
- 作業の前の場所を覚えて戻ると、利用者の作業を乱さない。
