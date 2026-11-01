---
title: "2 つの値が同じであることを確かめる"
description: "期待する値と実際の値が等しいかを、引数の数を確かめてから assertEquals に渡して判定する関数。メッセージを付けることもできる。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [551, 573]
function: "assertSame"
difficulty: 2
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`assertSame` は、**2 つの値が等しいことを確かめる** テスト用の関数です。失敗したときは、テストの失敗として記録されます。

shUnit2 では、期待する値と実際の値を並べて書きます。`assertSame` は、その比較の入り口です。実際の比較は、`assertEquals` に任せています。

## コード

::: code-group

```bash:line-numbers=551 [日本語訳]
assertSame() {
  # shellcheck の警告を抑える指定です。
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "assertSame() requires two or three arguments; $# given"
    _shunit_assertFail
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
  assertEquals "${shunit_message_}" "$1" "$2"
  shunit_return=$?

  unset shunit_message_
  return ${shunit_return}
}
```

```bash:line-numbers=551 [原文]
assertSame() {
  # shellcheck disable=SC2090
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "assertSame() requires two or three arguments; $# given"
    _shunit_assertFail
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
  assertEquals "${shunit_message_}" "$1" "$2"
  shunit_return=$?

  unset shunit_message_
  return ${shunit_return}
}
```

:::

## 前提知識

- **`assertEquals`**: 2 つの値が等しいかを比べ、違えば失敗として記録する関数です。
- **引数の数の確認**: 2 つか 3 つでなければ、エラーにして止めます。
- **メッセージ**: 失敗したときに表示する説明文です。3 つ目の引数として付けられます。
- **`_shunit_shouldSkip`**: 判定を飛ばす状態かどうかを調べる内部の関数です。

## 何をしているか

### 1. 引数の数を確かめる

```bash:line-numbers=553
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 2 -o $# -gt 3 ]; then
    _shunit_error "assertSame() requires two or three arguments; $# given"
    _shunit_assertFail
    return ${SHUNIT_ERROR}
```

2 つか 3 つの引数でなければ、エラーとして記録し、戻ります。

### 2. 飛ばす状態なら戻る

```bash:line-numbers=558
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
```

判定を飛ばす設定になっていれば、何もせずに成功として戻ります。

### 3. メッセージを付けて比べる

```bash:line-numbers=562

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 3 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
```

3 つの引数が渡されたときは、先頭をメッセージとして扱い、その後ろの 2 つの値を比べます。

### 4. 結果を返す

```bash:line-numbers=567
  fi
  assertEquals "${shunit_message_}" "$1" "$2"
  shunit_return=$?

  unset shunit_message_
  return ${shunit_return}
```

`assertEquals` の戻り値を、そのまま返します。使った変数は消します。

## ここがすごい

- **比較を一か所に任せる**: 比べ方の詳細は `assertEquals` にあります。`assertSame` は、引数の受け渡しだけに集中しています。
- **引数の誤りをすぐ見つける**: 数が違えば、そのテストの失敗として記録します。書き間違いが見過ごされません。
- **メッセージを省略できる**: 2 つの引数だけでも使えるので、簡単な書き方も残されています。

## まとめ

- テストの比較は、共通の関数に任せると、判定の方法を一か所で直せる。
- 引数の数を確かめると、書き間違いに早く気づける。
- メッセージは省略できる形にすると、使いやすい。
