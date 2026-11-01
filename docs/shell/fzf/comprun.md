---
title: "補完の候補を、fzf・tmux・独自の関数のどれで出すか振り分ける"
description: "補完を実行するとき、ユーザーが定義した _fzf_comprun があればそれを使い、tmux の中なら fzf-tmux、それ以外は fzf を呼び分ける関数。"
language: shell
project: "fzf"
repo: https://github.com/junegunn/fzf
license: "MIT"
copyright: "Copyright (c) 2013-2026 Junegunn Choi"
commit: "26ff936df038b6a62ec42cf18db27b2ea2bb8ec3"
file: "shell/completion.bash"
lines: [62, 72]
function: "__fzf_comprun"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`__fzf_comprun` は、fzf で補完の候補を選ぶ画面を **どの方法で開くか** を決める関数です。ユーザーが `_fzf_comprun` という関数を用意していればそれを、tmux の中で使っているなら tmux の別ペインを、そうでなければ普通の fzf を使います。

同じ補完でも、ターミナルの状況によって適した表示方法が違います。その違いを、この関数 1 つで切り替えています。

## コード

```bash:line-numbers=62
__fzf_comprun() {
  if [[ "$(type -t _fzf_comprun 2>&1)" == function ]]; then
    _fzf_comprun "$@"
  elif [[ -n ${TMUX_PANE-} ]] && { [[ ${FZF_TMUX:-0} != 0 ]] || [[ -n ${FZF_TMUX_OPTS-} ]]; }; then
    shift
    fzf-tmux ${FZF_TMUX_OPTS:--d${FZF_TMUX_HEIGHT:-40%}} -- "$@"
  else
    shift
    fzf "$@"
  fi
}
```

## 前提知識

- **`type -t 名前`**: 名前が関数なら `function`、コマンドなら `file`、エイリアスなら `alias` を表示します。ここでは関数かどうかを調べるために使っています。
- **`$TMUX_PANE`**: tmux の中で動いているとき、そのペインの ID が入る変数です。tmux の外では空です。
- **`fzf-tmux`**: tmux のペインに fzf を開くための補助コマンドです。`-d` で、ペインの大きさを指定します。
- **`shift`**: 引数の先頭を 1 つ捨てます。ここでは、補完の情報（コマンド名など）を取り除いて、候補を選ぶための引数だけを渡すために使っています。
- **`"$@"`**: すべての引数を、1 つずつ別の引数として渡します。

## 何をしているか

### 1. ユーザーの関数があればそれを使う

```bash:line-numbers=63
  if [[ "$(type -t _fzf_comprun 2>&1)" == function ]]; then
    _fzf_comprun "$@"
```

`_fzf_comprun` が関数として定義されていれば、引数をそのまま渡して呼びます。これは、ユーザーが表示方法を自由に差し替えるための口です。

### 2. tmux の中なら tmux のペインを使う

```bash:line-numbers=65
  elif [[ -n ${TMUX_PANE-} ]] && { [[ ${FZF_TMUX:-0} != 0 ]] || [[ -n ${FZF_TMUX_OPTS-} ]]; }; then
    shift
    fzf-tmux ${FZF_TMUX_OPTS:--d${FZF_TMUX_HEIGHT:-40%}} -- "$@"
```

tmux の中にいて、しかも `FZF_TMUX` などの設定が有効なら、`fzf-tmux` を開きます。`shift` で先頭の引数を捨ててから、残りを渡します。

### 3. それ以外は普通の fzf

```bash:line-numbers=68
  else
    shift
    fzf "$@"
```

上の条件に当てはまらないときは、`fzf` を普通に実行します。

## ここがすごい

- **拡張の口を用意している**: 既定の動作を変えたいユーザーは、`_fzf_comprun` を定義するだけで表示方法を変えられます。関数の中身を書き換える必要はありません。
- **判定の順番が大事**: ユーザーの定義を最初に確認しているので、tmux の判定より優先されます。
- **環境に合わせて自動で切り替える**: tmux かどうかは、環境変数を見るだけで判断できます。余計なコマンドを起動しません。

## まとめ

- 表示方法を差し替えられる関数を、先に確認する設計にすると拡張しやすい。
- `type -t` で、関数が定義されているかを調べられる。
- 環境変数で実行環境を判定すると、動きを自動で切り替えられる。
