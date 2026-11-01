---
title: "小数の表記を、比べやすい形に整える"
description: "計算結果の小数を、先頭の 0 を補い、末尾の 0 と余分な小数点を取り除いた形にする関数。整数や不正な形は、そのまま扱う。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [75, 107]
function: "_shunit_float_format"
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, イディオム]
---
## ひとことで

`_shunit_float_format` は、**小数の表記を、比べやすい形に揃える** 関数です。たとえば `.5` は `0.5` に、`2.50` は `2.5` に直します。

テストで小数の結果を比べるとき、表記の違いで失敗してしまうことがあります。この関数で形を揃えると、値が同じなら比べても一致します。

## コード

::: code-group

```bash:line-numbers=75 [日本語訳]
_shunit_float_format() {
  # 小数点が 2 つ以上ある数は、誤りです。
  # 整数なら整形は不要です。
  case "${1}" in
    *.*.*)
      return
      ;;
    *.*)
      ;;
    *)
      echo "${1}"
      return
      ;;
  esac

  _shunit_format_result_="$1"

  # 必要なら、先頭に 0 を補います。
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/^\./0./g')"

  # 末尾の 0 を取り除きます。
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/0\+$//g')"

  # 末尾に残った小数点を取り除きます。
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/\.$//g')"

  # 結果を表示します。
  echo "${_shunit_format_result_}"
  unset _shunit_format_result_
}
```

```bash:line-numbers=75 [原文]
_shunit_float_format() {
  # Double-dot number is an error.
  # No need to format if the number is an integer.
  case "${1}" in
    *.*.*)
      return
      ;;
    *.*)
      ;;
    *)
      echo "${1}"
      return
      ;;
  esac

  _shunit_format_result_="$1"

  # Add leading zero if needed.
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/^\./0./g')"

  # Remove trailing zeros.
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/0\+$//g')"

  # Remove trailing dot.
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/\.$//g')"

  # Print the result.
  echo "${_shunit_format_result_}"
  unset _shunit_format_result_
}
```

:::

## 前提知識

- **小数点**: 数の整数部分と小数部分を分ける記号 `.` です。
- **`sed`**: 文字列を置き換える道具です。正規表現を使って、先頭や末尾の文字を変えられます。
- **`echo ... | sed`**: 文字列をパイプで渡し、置き換えた結果を受け取る書き方です。
- **`case` 文**: 値のパターンによって処理を分けるシェルの書き方です。

## 何をしているか

### 1. 形の判断をする

```bash:line-numbers=77
  # 整数なら整形は不要です。
  case "${1}" in
    *.*.*)
      return
      ;;
    *.*)
      ;;
    *)
      echo "${1}"
      return
      ;;
  esac

```

小数点が 2 つ以上あれば、正しい数ではないので何も出さずに戻ります。小数点が無ければ整数なので、そのまま表示します。小数点が 1 つだけのときは、整形を続けます。

### 2. 先頭に 0 を補う

```bash:line-numbers=91

  # 必要なら、先頭に 0 を補います。
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/^\./0./g')"

  # 末尾の 0 を取り除きます。
```

小数点で始まる数の前に、0 を付けます。`.5` が `0.5` になります。

### 3. 末尾の 0 と小数点を取り除く

```bash:line-numbers=98
    |command sed 's/0\+$//g')"

  # 末尾に残った小数点を取り除きます。
  _shunit_format_result_="$(echo "${_shunit_format_result_}" \
    |command sed 's/\.$//g')"

  # 結果を表示します。
  echo "${_shunit_format_result_}"
  unset _shunit_format_result_
```

小数の末尾にある 0 を取り除き、最後に残った小数点も消します。`2.50` は `2.5`、`3.0` は `3` になります。

## ここがすごい

- **比べる前に揃える**: 表記の違いを先に消すので、値が同じなら、比べた結果も一致します。
- **不正な形を通さない**: 小数点が多すぎる場合は、整形せずに戻ります。誤った値を正しく見せないための判断です。
- **段階ごとに処理する**: 先頭、末尾の 0、末尾の小数点を、別々の置き換えで処理しています。どの段階も読みやすくなっています。

## まとめ

- 比較の前には、表記を揃える処理を入れると誤判定が減る。
- 不正な入力は、整形せずに返すと誤った値が広がらない。
- 置き換えは段階ごとに分けると、一つずつ確かめやすい。
