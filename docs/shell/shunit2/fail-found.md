---
title: "見つからないはずの値が見つかったときに、失敗として記録する"
description: "見つかってはいけない内容があったことを、メッセージ付きで失敗として記録する関数。引数の数を確かめてから記録する。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [831, 854]
function: "failFound"
difficulty: 2
format: 2
tags: [設計パターン, 文字列処理, イディオム]
---
## ひとことで

`failFound` は、**見つかってはいけないものが見つかったことを、テストの失敗として記録する** 関数です。`failNotFound` と対になる関数です。

テストでは、ある値が「無いこと」を確かめたい場面があります。その逆に、無いはずの内容が出てきたら、失敗として記録します。

## コード

::: code-group

```bash:line-numbers=831 [日本語訳]
failFound() {
  # shellcheck の警告を抑える指定です。
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 1 -o $# -gt 2 ]; then
    _shunit_error "failFound() requires one or two arguments; $# given"
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
  shunit_content_=$1

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }found:<${shunit_content_}>"

  unset shunit_message_ shunit_content_
  return ${SHUNIT_FALSE}
}
```

```bash:line-numbers=831 [原文]
failFound() {
  # shellcheck disable=SC2090
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 1 -o $# -gt 2 ]; then
    _shunit_error "failFound() requires one or two arguments; $# given"
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
  shunit_content_=$1

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }found:<${shunit_content_}>"

  unset shunit_message_ shunit_content_
  return ${SHUNIT_FALSE}
}
```

:::

## 前提知識

- **`fail`系の関数**: shUnit2 で、判定の結果を失敗として記録する関数の総称です。
- **引数の数**: この関数は、1 つか 2 つの引数を受け取ります。2 つのときは、先頭がメッセージになります。
- **`_shunit_assertFail`**: 失敗を記録する、shUnit2 の内部の関数です。
- **`${変数%% }`**: 末尾の空白を取り除く書き方です。

## 何をしているか

### 1. 引数の数を確かめる

```bash:line-numbers=833
  ${_SHUNIT_LINENO_}
  if ${__SHUNIT_BUILTIN} [ $# -lt 1 -o $# -gt 2 ]; then
    _shunit_error "failFound() requires one or two arguments; $# given"
    return ${SHUNIT_ERROR}
```

引数が 1 つか 2 つでなければ、エラーとして記録して戻ります。

### 2. 飛ばす状態なら戻る

```bash:line-numbers=837
  fi
  if _shunit_shouldSkip; then
    return ${SHUNIT_TRUE}
```

判定を飛ばす設定なら、何もせずに成功として戻ります。

### 3. メッセージを整える

```bash:line-numbers=841

  shunit_message_=${__shunit_lineno}
  if ${__SHUNIT_BUILTIN} [ $# -eq 2 ]; then
    shunit_message_="${shunit_message_}$1"
    shift
  fi
```

2 つの引数なら、行番号に付加メッセージを足します。見つかった内容を変数に入れます。

### 4. 失敗として記録する

```bash:line-numbers=848

  shunit_message_=${shunit_message_%% }
  _shunit_assertFail "${shunit_message_:+${shunit_message_} }found:<${shunit_content_}>"

  unset shunit_message_ shunit_content_
```

`found:<内容>` の形で、失敗として記録します。使った変数を消して、false を返します。

## ここがすごい

- **逆の判定を対にする**: `failNotFound` と組になっていて、有無のどちらのテストも同じ形で書けます。
- **内容を残す**: 見つかったものを、メッセージに含めます。何が問題だったかが、結果から分かります。
- **飛ばす仕組みに従う**: 判定を飛ばす設定にも対応しているので、テスト全体の仕組みと矛盾しません。

## まとめ

- 有無の判定は、対になる関数で揃えると書きやすい。
- 失敗のメッセージには、問題の内容を含めると原因が分かる。
- 判定を飛ばす仕組みは、すべての判定関数で共通にする。
