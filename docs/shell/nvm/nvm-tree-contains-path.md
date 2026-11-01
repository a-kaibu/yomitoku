---
title: "パスを 1 階層ずつ削って「このディレクトリの中か」を調べる"
description: "あるパスが指定したディレクトリの配下にあるかを判定する。末尾スラッシュの除去、親へのさかのぼり、-ef による同一ファイル判定を組み合わせている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [774, 814]
function: "nvm_tree_contains_path"
difficulty: 2
tags: [ファイル, 文字列処理, 防御的プログラミング]
---
## ひとことで

`nvm_tree_contains_path DIR PATH` は、`PATH` が `DIR` の **中（配下）にあるか** を判定する関数です。中にあれば成功、なければ失敗を返します。

たとえば `nvm_tree_contains_path ~/.nvm ~/.nvm/versions/node/v20/bin/node` は成功し、`nvm_tree_contains_path ~/.nvm /usr/bin/node` は失敗します。nvm は、今使っている `node` が自分の管理下のものかどうかを調べるときにこの関数を使います。

## コード

```sh:line-numbers=774
nvm_tree_contains_path() {
  local tree
  tree="${1-}"
  local node_path
  node_path="${2-}"

  if [ "@${tree}@" = "@@" ] || [ "@${node_path}@" = "@@" ]; then
    nvm_err "both the tree and the node path are required"
    return 2
  fi

  local clean_tree
  clean_tree="${tree}"

  # Strip trailing slashes in shell memory (e.g., "dir//" -> "dir")
  while [ "${clean_tree}" != "${clean_tree%/}" ]; do
    clean_tree="${clean_tree%/}"
  done
  if [ -z "${clean_tree}" ]; then
    clean_tree='/'
  fi

  # Keep literal matching for paths that do not exist, including glob characters.
  local pathdir
  pathdir="${node_path}"
  while [ "${pathdir}" != '' ] && [ "${pathdir}" != '.' ] && [ "${pathdir}" != '/' ] &&
      [ "${pathdir}" != "${clean_tree}" ] && ! [ "${pathdir}" -ef "${clean_tree}" ]; do
    case "${pathdir}" in
      */*)
        pathdir="${pathdir%/*}"
        if [ -z "${pathdir}" ]; then
          pathdir='/'
        fi
        ;;
      *)
        break
        ;;
    esac
  done
  [ "${pathdir}" = "${clean_tree}" ] || [ "${pathdir}" -ef "${clean_tree}" ]
}
```

## 前提知識

- **`${1-}` / `${2-}`**: 1 番目・2 番目の引数。無いときは空文字になります。
- **`[ "@${tree}@" = "@@" ]`**: 「`tree` が空か」を調べる古い書き方です。前後に `@` を付けて比べることで、値が `-n` のように `[` コマンドのオプションと紛らわしい文字列でも正しく比較できます。
- **`${var%/}`**: 値の末尾から `/` を 1 文字取り除きます。末尾が `/` でなければ何も変わりません。
- **`${var%/*}`**: 末尾から「最後の `/` 以降」を取り除きます。`/a/b/c` → `/a/b` のように、**1 つ上のディレクトリ** を得られます。
- **`while 条件; do ... done`**: 条件が成功している間、繰り返します。
- **`case 値 in パターン) ...;; esac`**: 値をパターンと照合して分岐します。`*/*` は「途中に `/` を含む文字列」です。
- **`[ A -ef B ]`**: A と B が **同じファイル（またはディレクトリ）を指していれば** 真になります。シンボリックリンクや `..` を含んでいても、実体が同じなら真です。
- **`nvm_err`**: nvm のエラー出力用関数です（標準エラーに表示します）。

## 何をしているか

`tree=/home/me/.nvm/`、`node_path=/home/me/.nvm/versions/node/v20/bin/node` で追ってみます。

### 1. 引数チェック（780〜783 行目）

どちらかが空なら、エラーを表示して `return 2` します。

### 2. 末尾のスラッシュを取る（789〜794 行目）

`clean_tree` の末尾から `/` を取り除くことを、取れなくなるまで繰り返します。`dir//` のように複数付いていても全部消えます。`/home/me/.nvm/` は `/home/me/.nvm` になります。もし `tree` が `/` だけだった場合は全部消えて空になるので、794 行目で `/` に戻しています。

### 3. 親へさかのぼる（799〜812 行目）

`pathdir` に `node_path` を入れ、1 階層ずつ親へ移動していきます。

```
/home/me/.nvm/versions/node/v20/bin/node
/home/me/.nvm/versions/node/v20/bin
/home/me/.nvm/versions/node/v20
/home/me/.nvm/versions/node
/home/me/.nvm/versions
/home/me/.nvm          ← clean_tree と一致したので止まる
```

ループを止める条件は、空・`.`・`/` に達したとき、`clean_tree` と文字列として一致したとき、または `-ef` で同じディレクトリだとわかったときです。`/` を含まない相対パス（`node` など）になったら `break` で抜けます。

### 4. 判定（813 行目）

最後に、たどり着いた `pathdir` が `clean_tree` と一致するか、同じ実体を指すかを調べ、その結果を返します。

## ここがすごい

- **文字列の前方一致で済ませない**: 素直に書くと `case "$node_path" in "$tree"/*)` のような前方一致になります。しかしそれだと、`~/.nvm` が実はシンボリックリンクだった場合や、`tree` にワイルドカード文字（`*` や `[`）が含まれていた場合に誤判定します。この関数は 1 階層ずつ比べるので、パターンとして解釈される心配がありません（796 行目のコメント）。
- **`-ef` で実体を比べる**: 文字列が違っても同じ場所を指す場合（シンボリックリンク経由など）を拾えます。逆に、まだ存在しないパスでも文字列一致で判定できるよう、両方を `||` で組み合わせています。
- **外部コマンドを使わない**: `dirname` や `realpath` を呼ばずにパラメータ展開だけで親をたどるので、どのシェルでも速く動きます。
- **終わりの条件を丁寧に網羅**: `/`、`.`、空文字のどれに行き着いても無限ループしないようにしています。

## まとめ

- `${path%/*}` を繰り返すと、パスを 1 階層ずつ親へさかのぼれる。
- `[ A -ef B ]` は、文字列ではなく「同じファイルかどうか」を比べる。
- パスの包含判定を単純な前方一致で書くと、リンクや特殊文字で間違えやすい。
