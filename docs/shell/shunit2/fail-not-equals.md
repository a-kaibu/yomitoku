---
title: "期待した値と違ったときに、失敗として記録する"
description: "期待する値と実際の値が違うことを、期待と実際の内容を並べたメッセージにして失敗として記録する関数。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [796, 820]
function: "failNotEquals"
difficulty: 2
format: 2
tags: [設計パターン, 文字列処理, イディオム]
---
## ひとことで

`failNotEquals` は、**期待した値と実際の値が違うことを、テストの失敗として記録する** 関数です。失敗のメッセージには、期待した値と実際の値の両方を入れます。

テストが失敗したとき、何がどう違ったかが分かることが大切です。この関数は、その情報を一行にまとめて残します。

## コード

::: code-group

```bash:line-numbers=796 [日本語訳]
failNotEquals() {
  # shellcheck の警告を抑える指定です。
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "failNotEquals() requires one or two arguments; $# given"
    return ${SHUNIT_ERROR}
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
  fi

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 3 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi
  shunit_expected_=$1
  shunit_actual_=$2

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }expected:<${shunit_expected_}> but was:<${shunit_actual_}>"

  unset shunit_message_ shunit_expected_ shunit_actual_
  return ${SHUNIT_FALSE}
}
```

```bash:line-numbers=796 [原文]
failNotEquals() {
  # shellcheck disable=SC2090
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "failNotEquals() requires one or two arguments; $# given"
    return ${SHUNIT_ERROR}
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
  fi

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 3 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi
  shunit_expected_=$1
  shunit_actual_=$2

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }expected:<${shunit_expected_}> but was:<${shunit_actual_}>"

  unset shunit_message_ shunit_expected_ shunit_actual_
  return ${SHUNIT_FALSE}
}
```

:::

## 前提知識

- **assert と fail**: テストで値を確かめる関数です。`fail` は、失敗を直接記録します。
- **引数の数の確認**: 引数が正しい数かを調べ、違えばエラーにします。
- **`_shunit_assertFail`**: 失敗を記録する、shUnit2 の内部の関数です。
- **`${変数%% }`**: 末尾の空白を取り除く書き方です。メッセージの見た目を整えます。

## 何をしているか

### 1. 引数の数を確かめる

```bash:line-numbers=798
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "failNotEquals() requires one or two arguments; $# given"
    return ${SHUNIT_ERROR}
```

2 つか 3 つの引数でなければ、エラーを記録して止めます。3 つのときは、先頭が付加メッセージになります。

### 2. 付加メッセージを組み立てる

```bash:line-numbers=806

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 3 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi
  shunit_expected_=$1
```

3 つの引数のときは、行番号に付加メッセージを足します。期待する値と実際の値を、変数に入れます。

### 3. 失敗を記録する

```bash:line-numbers=814

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }expected:<${shunit_expected_}> but was:<${shunit_actual_}>"

```

期待と実際の値を、`expected:<...> but was:<...>` の形で並べ、失敗として記録します。最後に、使った変数を消します。

## ここがすごい

- **差が一目で分かる**: 期待と実際を並べた形で表示するので、どこが違うかをすぐ読み取れます。
- **行番号を付ける**: 失敗がどこで起きたかが、メッセージに残ります。テストの修正が早くなります。
- **後始末を忘れない**: 使った変数を消して、次のテストへ影響を残しません。

## まとめ

- テストの失敗は、期待と実際を並べて示すと原因が分かりやすい。
- 失敗の位置を残すと、修正が速くなる。
- 一時的な変数は、使い終わったら消す。
