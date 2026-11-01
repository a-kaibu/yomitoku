---
title: "致命的な問題を表示して、テストを即座に止める"
description: "赤い字で FATAL と表示したあと、終了コードを付けて shUnit2 を止める関数。続けて判定をすることはできない。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [252, 255]
function: "_shunit_fatal"
difficulty: 1
format: 2
tags: [CLI, イディオム, 設計パターン]
---
## ひとことで

`_shunit_fatal` は、**テストの仕組みそのものが続けられない問題を表示して、すぐに止める** 関数です。通常の失敗とは違い、テストを終わらせます。

テストが失敗したときは、記録して次へ進むのが普通です。しかし、一時ディレクトリが作れないなど、土台が壊れた場合は、続けても意味がありません。そのときに使います。

## コード

```bash:line-numbers=252
_shunit_fatal() {
  ${__SHUNIT_CMD_ECHO_ESC} "${__shunit_ansi_red}shunit2:FATAL${__shunit_ansi_none} $*" >&2
  exit ${SHUNIT_ERROR}
}
```

## 前提知識

- **`_shunit_error` と `_shunit_warn`**: 同じファイル内で定義された、エラーと警告の表示関数です。見た目の色だけが違います。
- **`__shunit_ansi_red`**: 赤い文字を表す、端末の色の指定です。
- **`${__SHUNIT_CMD_ECHO_ESC}`**: エスケープを解釈して表示するための、環境に合わせたコマンドです。
- **`exit ${SHUNIT_ERROR}`**: shUnit2 のエラーを表す終了コードで、スクリプトを止めます。

## 何をしているか

### 1. 赤い FATAL の表示を出す

```bash:line-numbers=253
  ${__SHUNIT_CMD_ECHO_ESC} "${__shunit_ansi_red}shunit2:FATAL${__shunit_ansi_none} $*" >&2
```

色の指定を付けて、`shunit2:FATAL` の印と、渡されたメッセージを標準エラーに出します。

### 2. テストを終了する

```bash:line-numbers=254
  exit ${SHUNIT_ERROR}
```

shUnit2 のエラーを表す終了コードで、すぐに止めます。残りの判定は、実行されません。

## ここがすごい

- **土台の問題と通常の失敗を分ける**: 1 件の判定の失敗と違い、仕組みが続けられないことを示すための、別の出口を持っています。
- **色で緊急度を伝える**: 赤い表示と FATAL の文字で、通常の警告と違うことが一目で分かります。
- **残りの被害を防ぐ**: 壊れた状態で判定を続けて、誤った合格を出すことを防ぎます。

## まとめ

- 問題の重さによって、記録して進むか、止めるかを分ける。
- 緊急の表示は、色と文字で通常と区別すると見落としが減る。
- 壊れた土台の上で続けると、誤った結果が出るので止める。
