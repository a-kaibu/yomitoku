---
title: "値が空であることを確かめる"
description: "期待する値が空の文字列であるかを調べ、assertTrue に判定を渡す関数。引数が多すぎる場合はエラーとして記録する。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [478, 503]
function: "assertNull"
difficulty: 2
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`assertNull` は、**値が空の文字列であることを確かめる** テスト用の関数です。空なら成功、そうでなければ失敗として記録されます。

テストで「何も返らない」ことを確かめたいときに使います。判定そのものは、`assertTrue` に任せています。

## コード

::: code-group

```bash:line-numbers=478 [日本語訳]
assertNull() {
  # shellcheck の警告を抑える指定です。
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -gt 2 ]; then
    # $1 は空の値そのものを表すことがあるため、引数が 0 個でも許します。
    _shunit_error "assertNull() requires one or two arguments; $# given"
    _shunit_assertFail
    return ${SHUNIT_ERROR}
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
  fi

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 2 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi

  ${__SHUNIT_BUILTIN} test -z "${1:-}"
  assertTrue "${shunit_message_}" $?
  shunit_return=$?

  unset shunit_message_
  return ${shunit_return}
}
```

```bash:line-numbers=478 [原文]
assertNull() {
  # shellcheck disable=SC2090
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -gt 2 ]; then
    # Allowing 0 arguments as $1 might actually be null.
    _shunit_error "assertNull() requires one or two arguments; $# given"
    _shunit_assertFail
    return ${SHUNIT_ERROR}
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
  fi

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 2 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi

  ${__SHUNIT_BUILTIN} test -z "${1:-}"
  assertTrue "${shunit_message_}" $?
  shunit_return=$?

  unset shunit_message_
  return ${shunit_return}
}
```

:::

## 前提知識

- **空の文字列**: 何も入っていない文字列です。`test -z` は、空かどうかを調べます。
- **`${1:-}`**: 引数が無いときに空の文字列を使う書き方です。エラーで止まるのを防ぎます。
- **`assertTrue`**: 渡された終了コードが成功なら、テストを成功として記録する関数です。
- **`_SHUNIT_LINENO_`**: テストが失敗したとき、行番号を記録するための仕組みです。

## 何をしているか

### 1. 引数が多すぎないか確かめる

```bash:line-numbers=481
  if ${__SHUNIT_BUILTIN} [ $# -gt 2 ]; then
    # $1 は空の値そのものを表すことがあるため、引数が 0 個でも許します。
    _shunit_error "assertNull() requires one or two arguments; $# given"
    _shunit_assertFail
    return ${SHUNIT_ERROR}
  fi
  if _shunit_shouldSkip; then
```

引数が 3 つ以上あれば、エラーとして記録して戻ります。最初の引数は、空の値そのものを表すこともあるため、0 個の引数も許しています。

### 2. 飛ばす状態なら戻る

```bash:line-numbers=488
    return ${SHUNIT_TRUE}
  fi

```

判定を飛ばす設定なら、成功として戻ります。

### 3. メッセージを整えて空かどうかを調べる

```bash:line-numbers=492
  if ${__SHUNIT_BUILTIN} [ $# -eq 2 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi

  ${__SHUNIT_BUILTIN} test -z "${1:-}"
  assertTrue "${shunit_message_}" $?
  shunit_return=$?

```

行番号を付けたメッセージを作ります。値が空かどうかを `test -z` で調べ、その結果を `assertTrue` に渡します。

### 4. 結果を返す

```bash:line-numbers=501
  unset shunit_message_
  return ${shunit_return}
}
```

`assertTrue` の戻り値を返し、使った変数を消します。

## ここがすごい

- **判定を再利用する**: 空かどうかの判定だけを書き、結果の記録は `assertTrue` に任せています。同じ仕組みを使うので、動きが揃います。
- **引数の揺れに対応する**: 0 個の引数も受け付けるので、値が空の変数をそのまま渡せます。
- **行番号を残す**: 失敗したとき、どのテストで起きたかが分かります。

## まとめ

- 同じ判定の仕組みを使い回すと、テストの動きが揃う。
- 値が空かどうかは、`test -z` で簡潔に調べられる。
- 失敗の位置を残すと、原因が早く見つかる。
