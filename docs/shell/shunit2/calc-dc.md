---
title: "外部の dc で計算し、その結果を整える"
description: "2 つの数と演算子を dc に渡して結果を受け取り、小数の整形の関数に渡す関数。計算の成否は戻り値で返す。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [136, 147]
function: "_shunit_calc_dc"
difficulty: 2
format: 2
tags: [CLI, 数値計算, イディオム]
---
## ひとことで

`_shunit_calc_dc` は、**小数を含む計算を外部のプログラム dc に任せる** 関数です。bc を使う `_shunit_calc_bc` と同じ役目で、計算の道具が違います。

テスト用の計算は、移植性の高い道具に任せたいものです。dc は、ほとんどの Unix の環境にある、逆ポーランド記法の電卓です。

## コード

```bash:line-numbers=136
_shunit_calc_dc() {
  _shunit_output_="$(echo "$1" "$3" "$2" "p" \
    |command ${__SHUNIT_CMD_DC:?})"
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

- **dc**: 逆ポーランド記法で計算する、古くからの電卓のコマンドです。
- **逆ポーランド記法**: 演算子を、数の後ろに置く書き方です。`3 4 +` で 7 になります。
- **`p`**: dc で、スタックの一番上の値を表示する命令です。
- **`_shunit_float_format`**: 計算結果の小数を、比べやすい形に整える関数です。

## 何をしているか

### 1. 数と演算子を逆ポーランド記法で渡す

```bash:line-numbers=137
  _shunit_output_="$(echo "$1" "$3" "$2" "p" \
    |command ${__SHUNIT_CMD_DC:?})"
  shunit_return=$?
```

引数の 1 つ目と 3 つ目の数、2 つ目の演算子、そして `p` を並べて、dc に渡します。結果が `_shunit_output_` に入ります。

### 2. 成功したら整形する

```bash:line-numbers=140
  if ${__SHUNIT_BUILTIN} [ ${shunit_return} -eq ${SHUNIT_TRUE} ]; then
    _shunit_float_format "${_shunit_output_}"
    shunit_return=$?
  fi
```

dc が成功していれば、その結果を `_shunit_float_format` に渡して、表記を整えます。

### 3. 変数を消して戻る

```bash:line-numbers=145
  unset _shunit_output_
  return ${shunit_return}
```

使った変数を消して、最終的な戻り値を返します。

## ここがすごい

- **引数の順番を並べ替える**: 通常の書き方の引数を、逆ポーランド記法の順に組み替えています。呼び出し側は、普通の書き方で使えます。
- **失敗を次に渡さない**: dc が失敗したら、整形を省きます。誤った値を、テストの判定に使わないためです。
- **道具を差し替えられる**: `bc` と同じ形の関数なので、環境に合わせて道具を選べます。

## まとめ

- 外部の道具を使うときは、引数の並びを道具の期待に合わせて組み替える。
- 失敗した結果は、後続の処理に流さない。
- 同じ役割の関数は、同じ形で並べると環境の違いに対応しやすい。
