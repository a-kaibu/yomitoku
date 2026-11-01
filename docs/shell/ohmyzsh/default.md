---
title: "「まだ設定されていなければ」既定値を入れる関数"
description: "ユーザーが設定していない変数にだけ既定値を入れる。zsh の parameters 連想配列で変数の存在を調べ、typeset -g でグローバル変数を作る。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [129, 132]
function: "default"
difficulty: 2
format: 2
tags: [イディオム, API設計]
---
## ひとことで

`default 名前 値` は、変数 `名前` が **まだ存在しなければ** `値` を入れる関数です。すでにあれば何もしません。

```zsh
default ZSH_THEME_GIT_PROMPT_PREFIX "git:("
```

ユーザーが `.zshrc` で先に設定していればそれを尊重し、設定していなければ既定値を使う、という Oh My Zsh のテーマやプラグインでよく使う仕組みです。

## コード

```zsh:line-numbers=129
function default() {
    (( $+parameters[$1] )) && return 0
    typeset -g "$1"="$2"   && return 3
}
```

## 前提知識

- **`parameters`**: zsh の特殊な連想配列で、キーが変数名、値がその変数の種類（`scalar`、`array-export` など）です。
- **`$+parameters[名前]`**: その名前の変数が存在すれば 1、しなければ 0 になります。
- **`(( 式 ))`**: 算術式。0 以外なら成功です。
- **`typeset -g 名前=値`**: 変数を定義します。`-g` はグローバル、つまり関数の外でも使える変数として作る指定です。関数の中で `typeset` を使うと普通はローカル変数になるので、`-g` が必要です。
- **`"$1"="$2"`**: 1 番目の引数を変数名、2 番目の引数を値として組み立てています。
- **`return 3`**: 終了ステータス 3 で関数を終わります。

## 何をしているか

### 1. あれば何もしない

`(( $+parameters[$1] ))` で変数があるか調べ、あれば `return 0` で終わります。

### 2. 無ければ作る

`typeset -g "$1"="$2"` で、グローバル変数を作って値を入れます。成功したら `return 3` で終わります。

### 戻り値の意味

コメントのとおり、0 は「もともとあった」、3 は「今設定した」です。呼び出し側は、既定値が使われたかどうかを知ることができます。

### 例

```zsh
FOO=mine
default FOO theirs   # 何もしない（FOO は mine のまま、戻り値 0）
default BAR theirs   # BAR=theirs になる（戻り値 3）
```

## ここがすごい

- **「空」と「存在しない」を区別**: `${FOO:-値}` のような書き方だと、ユーザーが意図して `FOO=""`（空）にしたときも既定値で上書きしてしまいます。`parameters` で存在を調べれば、空にした設定も尊重できます。
- **名前を引数で受け取る**: 変数名を文字列として受け取り、`typeset` で作るので、どんな変数にも使い回せます。シェルで「名前で変数を操作する」ための基本的な技です。
- **関数の中からグローバルを作る**: `-g` を付け忘れると、関数を出た瞬間に変数が消えてしまいます。

隣の `env_default` は同じ考え方で、`parameters` の値に `export` が含まれるかを調べて環境変数版を実現しています。

## まとめ

- 既定値は「ユーザーが設定していないときだけ」入れると、ユーザーの設定を壊さない。
- zsh では `$+parameters[name]` で、変数が存在するかを調べられる。
- 関数の中で `typeset` するときは、残したい変数に `-g` を付ける。
