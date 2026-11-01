---
title: "変数の「種類」の文字列から export 済みかを判定する"
description: "環境変数が未設定のときだけ既定値で export する関数。zsh の parameters 連想配列に入っている型の文字列に -export が含まれるかで判定する。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [143, 146]
function: "env_default"
difficulty: 2
tags: [イディオム, パース]
---
## ひとことで

`env_default PAGER less` は、環境変数 `PAGER` が **まだ export されていなければ** `less` を設定して export する関数です。すでに export されていれば何もしません。

`EDITOR` や `PAGER`、`LESS` のような、ほかのプログラムにも渡したい設定の既定値を入れるときに使われます。

## コード

```zsh:line-numbers=143
function env_default() {
    [[ ${parameters[$1]} = *-export* ]] && return 0
    export "$1=$2" && return 3
}
```

## 前提知識

- **環境変数と export**: シェルの変数は、そのままではシェルの中だけのものです。`export` すると「環境変数」になり、シェルから起動したプログラム（`git` や `less` など）にも渡されます。
- **`parameters`**: zsh の特殊な連想配列で、キーが変数名、値が変数の種類を表す文字列です。たとえば次のようになります。
  - 普通の変数: `scalar`
  - export された変数: `scalar-export`
  - 配列: `array`
  - 特殊な変数: `scalar-special` など
- **`${parameters[$1]}`**: その変数の種類の文字列です。変数が無ければ空です。
- **`[[ 文字列 = *-export* ]]`**: 文字列が `-export` を含むかを調べます。
- **`export "$1=$2"`**: 変数名と値を組み立てて export します。

## 何をしているか

### 1. export 済みか調べる（144 行目）

`${parameters[$1]}` で変数の種類を取り出し、`*-export*` に一致するかを調べます。`PAGER` がすでに export されていれば `scalar-export` なので一致し、`return 0` で終わります。

### 2. 設定して export（145 行目）

一致しなければ `export "PAGER=less"` を実行し、`return 3` で終わります。

### 例

| 状態 | `${parameters[PAGER]}` | 結果 |
| --- | --- | --- |
| `export PAGER=most` 済み | `scalar-export` | 何もしない |
| `PAGER=most`（export していない） | `scalar` | `less` で上書きして export |
| 未設定 | 空 | `less` を設定して export |

## ここがすごい

- **種類の情報を文字列として使う**: zsh は変数の性質を `scalar-export` のような文字列で教えてくれます。パターン一致で調べれば、「export 済みか」が 1 つの条件でわかります。
- **「環境変数として」設定済みかを見る**: 単に変数があるかではなく export されているかを見ているのは、ほかのプログラムに値が届くかどうかが大事だからです。シェルの変数としてしか設定されていなければ、`less` などには伝わりません。
- **`default` 関数と対になる設計**: 戻り値の 0（既存）と 3（設定した）の意味を `default` とそろえているので、使う側が迷いません。

## まとめ

- `export` しないと、変数は起動するプログラムに渡らない。
- zsh の `$parameters[name]` で、変数の種類（配列か、export 済みか、など）がわかる。
- 似た関数どうしで、戻り値の意味をそろえると使いやすい。
