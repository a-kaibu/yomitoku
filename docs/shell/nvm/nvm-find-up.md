---
title: "親ディレクトリをさかのぼって設定ファイルを探す"
description: "今いる場所から親へ 1 階層ずつ上がり、指定したファイル（.nvmrc など）がある最初のディレクトリを返す。git が .git を探すのと同じ考え方の関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [830, 841]
function: "nvm_find_up"
difficulty: 1
format: 2
tags: [ファイル, 探索, イディオム]
---
## ひとことで

`nvm_find_up FILE` は、カレントディレクトリから **親へ親へとさかのぼりながら**、`FILE` が置いてある最初のディレクトリを探して表示します。

たとえば `/home/me/project/src/app` にいて `/home/me/project/.nvmrc` があるとき、`nvm_find_up .nvmrc` は `/home/me/project` を返します。プロジェクトのどの階層にいても、プロジェクト全体の設定ファイルを見つけられるわけです。

## コード

::: code-group

```sh:line-numbers=830 [日本語訳]
nvm_find_up() {
  local path_
  local parent_
  path_="${PWD}"
  while [ "${path_}" != "" ] && [ ! -f "${path_}/${1-}" ]; do
    parent_=${path_%/*}
    # これ以上上がれないところで止まる。例: `.` や `C:` のような Windows のドライブのルート
    [ "${parent_}" != "${path_}" ] || break
    path_="${parent_}"
  done
  nvm_echo "${path_}"
}
```

```sh:line-numbers=830 [原文]
nvm_find_up() {
  local path_
  local parent_
  path_="${PWD}"
  while [ "${path_}" != "" ] && [ ! -f "${path_}/${1-}" ]; do
    parent_=${path_%/*}
    # stop when there is nowhere left to go up, e.g. `.` or a Windows drive root like `C:`
    [ "${parent_}" != "${path_}" ] || break
    path_="${parent_}"
  done
  nvm_echo "${path_}"
}
```

:::

## 前提知識

- **`$PWD`**: シェルが自動で用意する変数で、カレントディレクトリの絶対パスが入っています。
- **`local`**: 関数内だけの変数を宣言します。`path_` のように末尾に `_` を付けているのは、zsh の特殊変数 `path` などとぶつからないようにするためと考えられます。
- **`[ -f パス ]`**: そのパスに通常のファイルがあれば真です。`!` を前に付けると否定になります。
- **`${path_%/*}`**: 値の末尾から「最後の `/` 以降」を取り除きます。`/a/b/c` なら `/a/b` になり、**1 つ上のディレクトリ** が得られます。
- **`A || B`**: A が失敗したときだけ B を実行します。`[ 条件 ] || break` は「条件が成り立たなければループを抜ける」という意味です。
- **`while 条件; do ... done`**: 条件が成功している間、繰り返します。

## 何をしているか

`PWD=/home/me/project/src/app`、探すファイルを `.nvmrc` として追います。

### 1. スタート地点

```sh:line-numbers=831
  local path_
```


`path_` に `/home/me/project/src/app` を入れます。

### 2. 見つかるまで上へ

ループの条件は「`path_` が空でない」かつ「`path_/.nvmrc` が無い」ことです。ファイルが無ければ、`parent_=${path_%/*}` で親ディレクトリを計算します。

```
/home/me/project/src/app/.nvmrc  … 無い → 親へ
/home/me/project/src/.nvmrc      … 無い → 親へ
/home/me/project/.nvmrc          … ある → ループ終了
```

### 3. 行き止まりの検出

```sh:line-numbers=835
    parent_=${path_%/*}
```


`/home` の親を `${path_%/*}` で計算すると空文字 `""` になります。すると次のループ条件 `"${path_}" != ""` で止まります。つまり、どこにもファイルが無ければ空文字が返ります。

一方、`.` や Windows のドライブ（`C:`）のように `/` を含まない値だと、`${path_%/*}` は何も削れず同じ値のままです。そのままだと無限ループになるので、`[ "${parent_}" != "${path_}" ] || break` で「親が自分と同じなら抜ける」としています。

### 4. 結果を表示

見つかったディレクトリ（または空文字）を表示します。呼び出し側の `nvm_find_nvmrc` は、この結果に `/.nvmrc` を付けて実際にファイルがあるかを確かめています。

## ここがすごい

- **外部コマンドを使わずに親をたどる**: `dirname` コマンドを呼べば親ディレクトリは簡単に求まりますが、毎回プロセスが起動します。`${path_%/*}` ならシェルの中だけで完結するので、深い階層でも速いです。
- **無限ループの罠をつぶしている**: 「親が自分と同じなら止まる」という 1 行のおかげで、想定外の値が来ても止まります。コメントで、どんなときに必要なのかがはっきり書かれています。
- **よく知られたパターン**: git が `.git` を、Node.js が `node_modules` を、多くのツールが設定ファイルを探すのと同じ「上へ探す（find up）」アルゴリズムです。これを数行で書けることを知っておくと、自作ツールでもすぐ応用できます。
- **探す名前を引数にした**: すぐ上の `nvm_find_project_dir` は同じ形のループで `package.json` を探しています。`nvm_find_up` は探す名前を引数にした汎用版で、`.nvmrc` 以外にも使えます。

## まとめ

- `${dir%/*}` を繰り返すと、外部コマンドなしで親ディレクトリをたどれる。
- 「値が変わらなくなったら止める」条件を入れて、無限ループを防ぐ。
- 設定ファイルを上へ探すパターンは、多くの開発ツールで使われている。
