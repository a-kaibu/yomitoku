---
title: "外部の bc で計算し、その結果を整える"
description: "小数を含む計算を bc に渡して結果を受け取り、整形の関数に渡す。計算の成否は戻り値で返す。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [116, 127]
function: "_shunit_calc_bc"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, イディオム]
---
## ひとことで

`_shunit_calc_bc` は、**小数を含む計算を外部のプログラム bc に任せる** 関数です。結果は、テスト用に整える別の関数へ渡します。

シェルの計算は、小数に対応していません。そこで、電卓のように使える `bc` を借りています。この関数は、その橋渡し役です。

## コード

```bash:line-numbers=116
_shunit_calc_bc() {
  _shunit_output_="$(echo "$@" \
    |command ${__SHUNIT_CMD_BC:?})"
  shunit_return=$?
  if ${__SHUNIT_BUILTIN} [ ${shunit_return} -eq ${SHUNIT_TRUE} ]; then
    _shunit_float_format "${_shunit_output_}"
    shunit_return=$?
  fi

  unset _shunit_output_
  return ${shunit_return}
}
```

## 前提知識

- **`bc`**: 任意の精度で計算できる、コマンドラインの電卓です。小数の計算ができます。
- **パイプ `|`**: 左のコマンドの出力を、右のコマンドの入力に渡す仕組みです。
- **`$@`**: 関数に渡された引数の全体です。ここでは、計算式として `bc` に渡されます。
- **`${__SHUNIT_CMD_BC:?}`**: 変数が空なら、エラーで止める書き方です。`bc` の場所が決まっていることを前提にしています。

## 何をしているか

### 1. 計算式を bc に渡す

```bash:line-numbers=117
  _shunit_output_="$(echo "$@" \
    |command ${__SHUNIT_CMD_BC:?})"
  shunit_return=$?
```

`echo` で引数を流し、パイプで `bc` へ渡します。`bc` が計算した結果が、`_shunit_output_` に入ります。

### 2. 計算が成功したら整形する

```bash:line-numbers=120
  if ${__SHUNIT_BUILTIN} [ ${shunit_return} -eq ${SHUNIT_TRUE} ]; then
    _shunit_float_format "${_shunit_output_}"
    shunit_return=$?
  fi
```

`bc` の終了コードが成功を示していれば、結果を `_shunit_float_format` に渡して整えます。失敗していれば、整形せずに戻ります。

### 3. 変数を消して戻り値を返す

```bash:line-numbers=125
  unset _shunit_output_
  return ${shunit_return}
```

一時的に使った変数を `unset` で消し、最終的な戻り値を返します。

## ここがすごい

- **外部の力を借りる**: シェルだけでは、小数の計算ができません。`bc` という既存の道具に任せることで、移植しやすい形を保っています。
- **成功と失敗を分ける**: 計算が失敗したら、整形を省きます。間違った値をテストに渡さないための、守りの作りです。
- **後始末を忘れない**: 一時変数を消してから戻ります。テストの変数を汚さないためです。

## まとめ

- シェルで足りない機能は、既存の道具を借りると移植性を保ちやすい。
- 途中で失敗したら、後続の処理を省く。
- 一時変数は使い終わったら消すと、他の処理と衝突しにくい。
