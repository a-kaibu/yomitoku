---
title: "キー操作で選んだファイル名を、入力中の行に差し込む"
description: "Ctrl+T のようなキーに割り当てる fzf の関数。選んだ結果を、readline の現在の入力行の、カーソル位置に挿入する。"
language: shell
project: "fzf"
repo: https://github.com/junegunn/fzf
license: "MIT"
copyright: "Copyright (c) 2013-2026 Junegunn Choi"
commit: "26ff936df038b6a62ec42cf18db27b2ea2bb8ec3"
file: "shell/key-bindings.bash"
lines: [64, 68]
function: "fzf-file-widget"
difficulty: 2
format: 2
tags: [CLI, 入出力, イディオム]
---
## ひとことで

`fzf-file-widget` は、キーを押すと fzf でファイルを選び、**選んだ名前をいま入力中のコマンドの、カーソルのところに差し込む** 関数です。`Ctrl+T` に割り当てると、ファイル名を打たずに済むようになります。

この関数は、bash の readline という入力の仕組みの中で動きます。readline は、いま入力中の行を `READLINE_LINE` という変数に、カーソルの位置を `READLINE_POINT` という変数に持っています。関数はそれを書き換えることで、行を編集します。

## コード

```bash:line-numbers=64
fzf-file-widget() {
  local selected="$(__fzf_select__ "$@")"
  READLINE_LINE="${READLINE_LINE:0:READLINE_POINT}$selected${READLINE_LINE:READLINE_POINT}"
  READLINE_POINT=$((READLINE_POINT + ${#selected}))
}
```

## 前提知識

- **readline**: bash が、行の入力と編集を担当する仕組みです。キー操作（カーソル移動や削除）を管理します。
- **`bind -x`**: キーに、シェルの関数を割り当てるコマンドです。fzf の設定ファイルでは、このような割り当てを行っています。
- **`READLINE_LINE` と `READLINE_POINT`**: 入力中の行の中身と、カーソル位置（文字数で数えた位置）を表す変数です。
- **`${変数:0:N}`**: 変数の先頭から N 文字を取り出します。`${変数:N}` は、N 文字目から後ろを取り出します。
- **`$((式))`**: 算術式の結果を値として使います。
- **`__fzf_select__`**: 補完と同じ方法で、fzf を開いて選択結果を返す関数です。

## 何をしているか

### 1. fzf で選ぶ

```bash:line-numbers=65
  local selected="$(__fzf_select__ "$@")"
```

`__fzf_select__` で fzf を開き、選んだ結果を `selected` に入れます。キャンセルされた場合は空になります。

### 2. カーソルの位置に挿入する

```bash:line-numbers=66
  READLINE_LINE="${READLINE_LINE:0:READLINE_POINT}$selected${READLINE_LINE:READLINE_POINT}"
```

カーソルより前の部分、選んだ文字列、カーソルより後ろの部分を、この順につなぎ直します。これで、カーソルの位置に文字列が入ります。

### 3. カーソルを挿入した文字列の後ろへ動かす

```bash:line-numbers=67
  READLINE_POINT=$((READLINE_POINT + ${#selected}))
```

カーソル位置を、挿入した文字列の長さだけ進めます。これで、続けて入力する位置が正しくなります。

## ここがすごい

- **行全体を書き換える**: 行の文字列を作り直す、という単純な方法で挿入を実現しています。readline の細かい操作を覚えなくても使えます。
- **カーソル位置を必ず更新する**: 挿入の後にカーソルを進めないと、次の入力が挿入した文字列の前に入ってしまいます。その 1 行が大切です。
- **補完と同じ選択画面を再利用**: `__fzf_select__` を使うことで、補完の見た目と動きを揃えています。

## まとめ

- readline の行は、変数を書き換えることで編集できる。
- 挿入の後は、カーソル位置も必ず進める。
- 同じ選択の仕組みを使い回すと、動きの統一が楽になる。
