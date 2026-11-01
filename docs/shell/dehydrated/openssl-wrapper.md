---
title: "openssl の失敗を、詳細と一緒に表示して止める"
description: "openssl を実行し、失敗したら終了コードと出力の詳細を標準エラーに出して、同じ終了コードで止める関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [952, 965]
function: "_openssl"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`_openssl` は、**openssl のコマンドを実行し、失敗したら理由を詳しく示して止める** 関数です。ほかの関数は、openssl を直接呼ばずに、この関数を通します。

openssl の失敗は、出力が長くて原因が見えにくいことがあります。この関数は、失敗したコマンドの内容と、出力の全文を表示します。

## コード

```bash:line-numbers=952
_openssl() {
  set +e
  out="$("${OPENSSL}" "${@}" 2>&1)"
  res=$?
  set -e
  if [[ ${res} -ne 0 ]]; then
    echo "  + ERROR: failed to run $* (Exitcode: ${res})" >&2
    echo >&2
    echo "Details:" >&2
    echo "${out}" >&2
    echo >&2
    exit "${res}"
  fi
}
```

## 前提知識

- **終了コード**: 命令が成功か失敗かを表す数です。0 は成功、それ以外は失敗です。
- **`2>&1`**: 標準エラーを、標準出力と同じ場所へ送る指定です。失敗の詳細を、まとめて取り込めます。
- **`set +e` と `set -e`**: 失敗で止まる設定を、一時的に外す命令です。ここでは、終了コードを自分で受け取るために使います。
- **`"${@}"`**: 渡された引数を、すべてそのまま渡す書き方です。

## 何をしているか

### 1. 失敗しても止まらずに実行する

```bash:line-numbers=953
  set +e
  out="$("${OPENSSL}" "${@}" 2>&1)"
  res=$?
  set -e
```

失敗で止まる設定を外してから openssl を実行します。出力は、標準エラーも含めて変数に入れ、終了コードを受け取ります。

### 2. 失敗なら詳細を表示する

```bash:line-numbers=958
    echo "  + ERROR: failed to run $* (Exitcode: ${res})" >&2
    echo >&2
    echo "Details:" >&2
    echo "${out}" >&2
    echo >&2
    exit "${res}"
```

終了コードが 0 でなければ、実行したコマンド、詳細の出力を、標準エラーに出します。

### 3. 同じ終了コードで止める

```bash:line-numbers=964
  fi
}
```

最後に、openssl と同じ終了コードで終わります。呼び出し側は、どの種類の失敗かを判断できます。

## ここがすごい

- **失敗の情報を捨てない**: 出力の全文を残すので、原因を調べる手がかりが失われません。
- **終了コードを引き継ぐ**: 元の失敗の種類を、そのまま伝えます。
- **呼び出しを 1 か所に集める**: openssl の扱いを 1 つの関数にまとめ、失敗の表示も統一しています。

## まとめ

- 外部の道具の失敗は、詳細とともに表示すると原因を追いやすい。
- 終了コードは、そのまま上に伝えると呼び出し側が判断できる。
- 外部の呼び出しは、1 つの関数に集めると表示の形が揃う。
