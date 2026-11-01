---
title: "コマンド置換の中では「端末かどうか」がわからない問題"
description: "文字列を色付きのエスケープシーケンスで包む関数。$( ) の中では [ -t 1 ] が正しく判定できないため、呼び出し元から判定結果を受け取る工夫をしている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1647, 1660]
function: "nvm_wrap_with_color_code"
difficulty: 2
tags: [CLI, 入出力]
---
## ひとことで

`nvm_wrap_with_color_code b "v20.1.0"` は、文字列 `v20.1.0` を **青色で表示するためのエスケープシーケンスで包んで** 出力します。色が使えない環境では、色を付けずにそのまま出力します。

短い関数ですが、コメントに書かれている「コマンド置換の中では端末かどうかを判定できない」という落とし穴への対策が見どころです。

## コード

```sh:line-numbers=1647
nvm_wrap_with_color_code() {
  local CODE
  CODE="$(nvm_print_color_code "${1}" 2>/dev/null ||:)"
  local TEXT
  TEXT="${2-}"
  # `nvm_has_colors` cannot answer for itself inside a command substitution,
  # where `[ -t 1 ]` sees the capture pipe: callers that already checked pass
  # the answer in, as `nvm_print_alias_path` also accepts it.
  if { [ "${NVM_HAS_COLORS-}" = 1 ] || nvm_has_colors; } && [ -n "${CODE}" ]; then
    nvm_echo_with_colors "\033[${CODE}${TEXT}\033[0m"
  else
    nvm_echo "${TEXT}"
  fi
}
```

## 前提知識

- **ANSI エスケープシーケンス**: `\033[0;34m` のように書くと端末の文字色が変わり、`\033[0m` で元に戻ります。`\033` は ESC という制御文字です。
- **`nvm_print_color_code`**: `b` → `0;34m` のように色名をコードに変換する nvm の関数です。不正な色名ならエラーを返します。
- **`||:`**: `:` は何もせず成功するコマンドです。`A ||:` で「A が失敗しても成功扱いにする」になります。
- **`{ A || B; } && C`**: 波かっこで条件をまとめています。「A か B のどちらかが成功し、かつ C も成功」という意味です。丸かっこと違い、サブシェルを作りません。
- **`$( ... )` とパイプ**: コマンド置換の中では、標準出力は端末ではなく **出力を受け取るためのパイプ** につながっています。
- **`[ -t 1 ]`**: 標準出力が端末なら真になるテストです。
- **`nvm_echo_with_colors`**: `printf %b` で、`\033` のようなエスケープを解釈して出力する nvm の関数です。

## 何をしているか

### 1. 色コードを得る（1649 行目）

`nvm_print_color_code` で色名をコードに変えます。不正な色名で失敗しても `||:` で止まらず、`CODE` は空になります。

### 2. 色を使ってよいか判定（1655 行目）

次のどちらかなら色を使います。

- 呼び出し元が `NVM_HAS_COLORS=1` を設定している
- `nvm_has_colors` が「色を使える」と答える

さらに `CODE` が空でないことも条件です。

### 3. 包んで出力（1656〜1658 行目）

色を使うなら `\033[0;34mv20.1.0\033[0m` のように、色の開始と終了で挟んで出力します。使わないならそのまま出力します。

## ここがすごい

- **コマンド置換の罠を知っている**: この関数は `"$(nvm_wrap_with_color_code b v20)"` のように、コマンド置換の中で呼ばれることが多いです。そこで `nvm_has_colors` が `[ -t 1 ]` を調べると、標準出力は受け取り用のパイプなので「端末ではない」と判定され、いつも色なしになってしまいます（1652〜1654 行目のコメント）。そこで、**外側ですでに判定した結果を変数で受け取る** ようにしています。
- **判定結果を渡せないときにも対応**: `NVM_HAS_COLORS` が無ければ自分で判定するので、普通に呼ばれた場合も正しく動きます。
- **失敗しても文字は必ず出る**: 色の指定が間違っていても、文字列そのものは必ず表示されます。色はあくまでおまけ、という正しい優先順位です。

## まとめ

- `$( )` の中では標準出力がパイプになるので、`[ -t 1 ]` は偽になる。
- 外側でしかわからない情報は、変数などで内側に渡す。
- 装飾が失敗しても本来の情報は必ず出力されるようにする。
