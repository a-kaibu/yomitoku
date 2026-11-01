---
title: "パスの表示を色付きにして、区切りを薄くする設定"
description: "プロンプトに出すカレントディレクトリの色を決め、zstyle の設定を読んでパスの区切り記号を薄く表示するかを切り替える関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [137, 145]
function: "prompt_pure_set_path_separator"
difficulty: 2
format: 2
tags: [CLI, イディオム, API設計]
---
## ひとことで

`prompt_pure_set_path_separator` は、プロンプトに表示するカレントディレクトリの見た目を決める関数です。パスの色を指定し、区切りの `/` を薄く表示するかどうかを、`zstyle` という設定の仕組みから読み取ります。

Pure は、テーマを使う人が `.zshrc` で見た目を変えられるように作られています。この関数は、その設定を読んで、表示の準備をする役割を持ちます。

## コード

```zsh:line-numbers=137
prompt_pure_set_path_separator() {
	typeset -g prompt_pure_path_segment="%F{${prompt_pure_colors[path]}}%~%f"

	if zstyle -t ':prompt:pure:path:separator' dim; then
		typeset -g prompt_pure_path_separator_dimmed=1
	else
		typeset -g prompt_pure_path_separator_dimmed=
	fi
}
```

## 前提知識

- **`zstyle`**: zsh の設定を、名前とパターンの組で保存・取得する仕組みです。`zstyle ':prompt:pure:path:separator' dim yes` のように書きます。
- **`zstyle -t 名前 項目`**: 設定の値が真（yes など）なら、成功を返します。`-t` は、その値をテストするという意味です。
- **`%F{色}...%f`**: zsh のプロンプトで文字の色を変える書き方です。`%F` で色を開始し、`%f` で元に戻します。
- **`%~`**: 現在のディレクトリを、ホームを `~` と省略した形で表示する、プロンプトの特殊な記号です。
- **`prompt_pure_colors[path]`**: テーマが用意した色の連想配列から、パス用の色を取り出しています。

## 何をしているか

### 1. パスの表示を組み立てる

```zsh:line-numbers=138
	typeset -g prompt_pure_path_segment="%F{${prompt_pure_colors[path]}}%~%f"
```

色を指定して、`%~` を囲んだ文字列を `prompt_pure_path_segment` に入れます。これがプロンプトに表示されるパスの部分になります。

### 2. 区切りを薄くするか決める

```zsh:line-numbers=140
	if zstyle -t ':prompt:pure:path:separator' dim; then
		typeset -g prompt_pure_path_separator_dimmed=1
	else
		typeset -g prompt_pure_path_separator_dimmed=
```

`zstyle -t` で、`:prompt:pure:path:separator` の `dim` が真かを調べます。真なら、`prompt_pure_path_separator_dimmed` に 1 を入れ、そうでなければ空にします。

この変数は、表示の関数の側で読まれます。ここでは値を決めるだけで、実際の描画は行いません。

## ここがすごい

- **設定と描画を分けている**: 設定の読み取りを、表示を作る関数から切り離しています。そのため、設定を変えても描画の処理を書き換える必要がありません。
- **既定の動作を変えない**: 設定が無いときは `dim` が偽になり、区切りは通常の色のまま表示されます。何もしなくても動く設計です。
- **zstyle で拡張しやすい**: ユーザーは、Pure の内部の変数を知らなくても、標準的な設定の書き方で見た目を変えられます。

## まとめ

- テーマの設定は、読み取りの関数を分けると扱いやすくなる。
- `zstyle -t` で、ユーザーが選んだ真偽の設定を読める。
- 既定値を「設定しなくても動く」値にしておくと、導入の手間が減る。
