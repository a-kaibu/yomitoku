---
title: "テスト用の一時ディレクトリを、安全に作る"
description: "まず mktemp を試し、使えなければ乱数を作って一時ディレクトリを自分で作る関数。作れなければ致命的な失敗として止める。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [1089, 1115]
function: "_shunit_mktempDir"
difficulty: 3
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`_shunit_mktempDir` は、**テスト用の一時ディレクトリを作る** 関数です。作った場所のパスを、標準出力に返します。

一時ディレクトリは、どの環境でも同じ方法で作れるとは限りません。そこで、標準の `mktemp` を最初に試し、使えなければ自前の方法で作ります。

## コード

::: code-group

```bash:line-numbers=1089 [日本語訳]
_shunit_mktempDir() {
  # 標準の mktemp 関数を試します。
  if ( exec mktemp -dqt shunit.XXXXXX 2>/dev/null ); then
    return
  fi

  # 標準の mktemp が使えなかったので、自前で作ります。
  # shellcheck の警告を抑える指定です。
  if ${__SHUNIT_BUILTIN} [ -r '/dev/urandom' -a -x '/usr/bin/od' ]; then
    _shunit_random_=`/usr/bin/od -vAn -N4 -tx4 </dev/urandom |command sed 's/^[^0-9a-f]*//'`
  elif ${__SHUNIT_BUILTIN} [ -n "${RANDOM:-}" ]; then
    # $RANDOM が使えるとき
    _shunit_random_=${RANDOM}${RANDOM}${RANDOM}$$
  else
    # $RANDOM も使えないとき
    _shunit_date_=`date '+%Y%m%d%H%M%S'`
    _shunit_random_=`expr "${_shunit_date_}" / $$`
  fi

  _shunit_tmpDir_="${TMPDIR:-/tmp}/shunit.${_shunit_random_}"
  if ! ( umask 077 && command mkdir "${_shunit_tmpDir_}" ); then
    _shunit_fatal 'could not create temporary directory! exiting'
  fi

  echo "${_shunit_tmpDir_}"
  unset _shunit_date_ _shunit_random_ _shunit_tmpDir_
}
```

```bash:line-numbers=1089 [原文]
_shunit_mktempDir() {
  # Try the standard `mktemp` function.
  if ( exec mktemp -dqt shunit.XXXXXX 2>/dev/null ); then
    return
  fi

  # The standard `mktemp` didn't work. Use our own.
  # shellcheck disable=SC2039,SC3028
  if ${__SHUNIT_BUILTIN} [ -r '/dev/urandom' -a -x '/usr/bin/od' ]; then
    _shunit_random_=`/usr/bin/od -vAn -N4 -tx4 </dev/urandom |command sed 's/^[^0-9a-f]*//'`
  elif ${__SHUNIT_BUILTIN} [ -n "${RANDOM:-}" ]; then
    # $RANDOM works
    _shunit_random_=${RANDOM}${RANDOM}${RANDOM}$$
  else
    # `$RANDOM` doesn't work.
    _shunit_date_=`date '+%Y%m%d%H%M%S'`
    _shunit_random_=`expr "${_shunit_date_}" / $$`
  fi

  _shunit_tmpDir_="${TMPDIR:-/tmp}/shunit.${_shunit_random_}"
  if ! ( umask 077 && command mkdir "${_shunit_tmpDir_}" ); then
    _shunit_fatal 'could not create temporary directory! exiting'
  fi

  echo "${_shunit_tmpDir_}"
  unset _shunit_date_ _shunit_random_ _shunit_tmpDir_
}
```

:::

## 前提知識

- **`mktemp`**: 一時ファイルやディレクトリを、安全な名前で作るコマンドです。
- **`/dev/urandom`**: 乱数を出す特別なファイルです。ここでは、ディレクトリ名に使うランダムな値を作るのに使われます。
- **`umask 077`**: 作られるファイルの権限を、持ち主だけが使えるように絞る設定です。
- **`${TMPDIR:-/tmp}`**: 環境変数 `TMPDIR` があればそれを、なければ `/tmp` を使う書き方です。

## 何をしているか

### 1. 標準の mktemp を試す

```bash:line-numbers=1091
  if ( exec mktemp -dqt shunit.XXXXXX 2>/dev/null ); then
    return
  fi

```

`mktemp -dqt` で作れれば、その結果を返して終わります。部分シェルの中で実行するので、失敗しても関数の外には影響しません。

### 2. 乱数を用意する

```bash:line-numbers=1098
    _shunit_random_=`/usr/bin/od -vAn -N4 -tx4 </dev/urandom |command sed 's/^[^0-9a-f]*//'`
  elif ${__SHUNIT_BUILTIN} [ -n "${RANDOM:-}" ]; then
    # $RANDOM が使えるとき
    _shunit_random_=${RANDOM}${RANDOM}${RANDOM}$$
  else
    # $RANDOM も使えないとき
    _shunit_date_=`date '+%Y%m%d%H%M%S'`
    _shunit_random_=`expr "${_shunit_date_}" / $$`
  fi

  _shunit_tmpDir_="${TMPDIR:-/tmp}/shunit.${_shunit_random_}"
```

`/dev/urandom` と `od` が使えれば、そこから乱数を作ります。使えなければ `$RANDOM` を使い、それもだめなら日時と PID から値を作ります。どの方法でも、ディレクトリ名の一部になる値を作るのが目的です。

### 3. 権限を絞って作る

```bash:line-numbers=1110
    _shunit_fatal 'could not create temporary directory! exiting'
  fi

  echo "${_shunit_tmpDir_}"
```

`umask 077` を付けて `mkdir` を実行します。作れなかったら、`_shunit_fatal` で即座に止めます。

### 4. パスを返す

```bash:line-numbers=1114
  unset _shunit_date_ _shunit_random_ _shunit_tmpDir_
}
```

作ったディレクトリのパスを表示し、使った一時変数を消します。呼び出し側は、この表示をつかんで使います。

## ここがすごい

- **段階的な退避策**: 標準の道具から、順に簡単な方法へ下がります。どの環境でも動く可能性を上げています。
- **他人に見せない権限**: `umask 077` で、作られたディレクトリは持ち主だけが読めます。テストの中身が漏れにくくなります。
- **失敗を隠さない**: 作れなかったら、続けずに止めます。後続のテストが、誤った場所に書き込むのを防ぎます。

## まとめ

- 外部の道具が無い環境に備え、代わりの方法を段階的に用意する。
- 一時ファイルは、権限を絞って作ると他の利用者から守れる。
- 失敗したら続けずに止める設計にすると、問題が見つけやすい。
