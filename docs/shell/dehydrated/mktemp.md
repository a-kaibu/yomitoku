---
title: "一時ファイルを、安全な名前で作る"
description: "TMPDIR または /tmp の下に、dehydrated 用の名前で一時ファイルを作り、そのパスを表示する関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [293, 295]
function: "_mktemp"
difficulty: 1
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`_mktemp` は、**dehydrated が使う一時ファイルを、安全な名前で作る** 関数です。作ったファイルのパスを表示して、呼び出し側が使えるようにします。

一時ファイルは、ほかのプロセスと名前がぶつかると、データを壊す原因になります。そこで、`mktemp` にランダムな名前の作成を任せています。

## コード

```bash:line-numbers=293
_mktemp() {
  mktemp "${TMPDIR:-/tmp}/dehydrated-XXXXXX"
}
```

## 前提知識

- **一時ファイル**: 処理の途中でだけ使い、後で消すことを前提にしたファイルです。
- **`mktemp`**: 重ならない名前のファイルを、安全に作るコマンドです。作成したパスを表示します。
- **テンプレートの末尾の X**: `XXXXXX` の部分が、ランダムな文字に置き換えられます。
- **`${TMPDIR:-/tmp}`**: 環境変数 `TMPDIR` があればそれを、なければ `/tmp` を使う書き方です。

## 何をしているか

### 1. 作成先とランダムな名前を指定する

```bash:line-numbers=294
  mktemp "${TMPDIR:-/tmp}/dehydrated-XXXXXX"
```

作成先のディレクトリは `TMPDIR` か `/tmp` にし、名前の先頭は `dehydrated-` とします。末尾の `XXXXXX` が、ランダムな文字列になります。

### 2. ファイルを作って、パスを表示する

```bash:line-numbers=294
  mktemp "${TMPDIR:-/tmp}/dehydrated-XXXXXX"
```

`mktemp` がファイルを作り、その完全なパスを表示します。呼び出し側は、この出力を変数に入れて使います。

## ここがすごい

- **名前の衝突を避ける**: 固定の名前を使わず、ランダムな部分を入れるので、同時に動いても別のファイルになります。
- **作成と名前の決定を 1 回で行う**: 名前を決めてから作る、という 2 段階の隙をなくせます。
- **作成先を環境に合わせる**: `TMPDIR` を尊重するので、利用者が一時ファイルの場所を変えられます。

## まとめ

- 一時ファイルは、固定の名前を避けて `mktemp` に任せると安全。
- 作成先は環境変数で変えられるようにすると、利用者の環境に合う。
- 作成と名前の決定は、一度の命令でまとめると隙が無い。
