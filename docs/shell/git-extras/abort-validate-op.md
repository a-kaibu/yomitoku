---
title: "途中の操作が 1 つだけかを確かめる"
description: "見つかった途中の操作を調べ、無い場合や複数ある場合はエラーを表示して止める関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-abort"
lines: [17, 30]
function: "validate_op"
difficulty: 2
format: 2
tags: [CLI, イディオム, 文字列処理]
---
## ひとことで

`validate_op` は、**途中の操作が 1 つだけ進行中かを確かめる** 関数です。無い場合と、複数ある場合は、どちらも止めて理由を表示します。

`git abort` は、どの操作を中断するかを一つに決める必要があります。曖昧なまま実行すると、意図しない操作を中断しかねません。この関数は、そのための安全な確認です。

## コード

```bash:line-numbers=17
validate_op() {
  local op="$1"
  if [ -z "$op" ]; then
    echo "No active operation found" >&2
    exit 1
  fi
  if [[ "$(echo "$op" | wc -l)" -gt 1 ]]; then
    echo "Multiple active operations found:" >&2
    for o in $op; do
      echo "  - $o: HEAD: $(cat "${gitdir}/${o}_HEAD")" >&2
    done
    exit 1
  fi
}
```

## 前提知識

- **標準エラー出力 `>&2`**: エラーのメッセージを、通常の出力とは別の流れに出す書き方です。
- **`wc -l`**: 行の数を数えるコマンドです。複数の操作を検出するために使われます。
- **`${gitdir}`**: Git の管理データの場所です。この関数の中では、そこから HEAD の印を読みます。
- **`exit 1`**: スクリプトを、エラーの終了コードで止めます。

## 何をしているか

### 1. 操作が見つからなければ止める

```bash:line-numbers=19
  if [ -z "$op" ]; then
    echo "No active operation found" >&2
    exit 1
  fi
```

引数が空なら、進行中の操作が無いことを表示して、終了します。

### 2. 操作が複数あれば一覧を出して止める

```bash:line-numbers=23
  if [[ "$(echo "$op" | wc -l)" -gt 1 ]]; then
    echo "Multiple active operations found:" >&2
    for o in $op; do
      echo "  - $o: HEAD: $(cat "${gitdir}/${o}_HEAD")" >&2
    done
    exit 1
  fi
```

行が 2 つ以上あると、複数の操作が進行中です。それぞれの名前と、HEAD の値を表示して、終了します。

## ここがすごい

- **曖昧な状態を許さない**: 1 つに決まらない場合は、何もせずに止めます。誤って別の操作を中断する事故を防げます。
- **利用者に判断材料を渡す**: 複数あるときは、それぞれの HEAD を表示します。どれを優先すべきか、利用者が判断できます。
- **エラーの流れを分ける**: メッセージを標準エラーに出すので、後続の処理が正常な出力だけを扱えます。

## まとめ

- 操作を取り消す前には、対象が 1 つに決まるかを確かめる。
- 曖昧なときは、止めて候補を示すと安全。
- エラーは標準エラーに出すと、正常な出力と混ざらない。
