---
title: "sed の -i の書き方の違いを見分けて、ファイルを直接書き換える"
description: "GNU sed、BSD sed、そのほか -i に対応しない sed のどれかを、ヘルプの表示で見分けて、ファイルを書き換える関数。"
language: shell
project: "acme.sh"
repo: https://github.com/acmesh-official/acme.sh
license: "GPL-3.0-only"
copyright: "Copyright (c) acme.sh contributors"
commit: "37d064f7b580055d3f2ddf9a9c960f754f3694d6"
file: "acme.sh"
lines: [931, 950]
function: "_sed_i"
difficulty: 3
format: 2
tags: [移植性, 文字列処理, 防御的プログラミング]
---
## ひとことで

`_sed_i 置換の指定 ファイル名` は、ファイルの中身を **sed で書き換えて、同じファイルに保存する** 関数です。ただし、`sed -i` の書き方は、環境によって違います。この関数はそれを見分けて、使える方法で書き換えます。

GNU sed では `sed -i 'pattern' file` と書きます。BSD sed（macOS など）では `sed -i '' 'pattern' file` と、空の拡張子を付ける必要があります。どちらにも対応しない古い sed のために、最後の手段も用意しています。

## コード

```bash:line-numbers=931
_sed_i() {
  options="$1"
  filename="$2"
  if [ -z "$filename" ]; then
    _usage "Usage:_sed_i options filename"
    return 1
  fi
  _debug2 options "$options"
  if sed -h 2>&1 | grep "\-i\[SUFFIX]" >/dev/null 2>&1; then
    _debug "Using sed  -i"
    sed -i "$options" "$filename"
  elif sed -h 2>&1 | grep "\-i extension" >/dev/null 2>&1; then
    _debug "Using FreeBSD sed -i"
    sed -i "" "$options" "$filename"
  else
    _debug "No -i support in sed"
    text="$(cat "$filename")"
    echo "$text" | sed "$options" >"$filename"
  fi
}
```

## 前提知識

- **`sed -i`**: ファイルを直接書き換えるオプションです。標準出力には結果を出さず、ファイルの中身を変えます。
- **`sed -h`**: ヘルプを表示させるオプションです。環境の sed の書き方を、ヘルプの文字で見分けるために使われています。
- **`2>&1`**: 標準エラーを標準出力に合流させます。ヘルプは環境によってエラー出力に出るので、この書き方で拾います。
- **`grep "\-i\[SUFFIX]"`**: `-i[SUFFIX]` という文字がヘルプにあるかを調べます。GNU sed の目印です。
- **`echo "$text" | sed ... > "$filename"`**: 中身を読み、変換した結果を同じファイルに書き戻す最後の手段です。

## 何をしているか

### 1. 引数を確かめる

```bash:line-numbers=934
  if [ -z "$filename" ]; then
    _usage "Usage:_sed_i options filename"
    return 1
  fi
```

ファイル名が空なら、使い方を表示して失敗を返します。

### 2. GNU sed の書き方を使う

```bash:line-numbers=939
  if sed -h 2>&1 | grep "\-i\[SUFFIX]" >/dev/null 2>&1; then
    _debug "Using sed  -i"
    sed -i "$options" "$filename"
```

ヘルプに `-i[SUFFIX]` の表示があれば、GNU sed と判断して `sed -i "$options" "$filename"` を実行します。

### 3. BSD sed の書き方を使う

```bash:line-numbers=942
  elif sed -h 2>&1 | grep "\-i extension" >/dev/null 2>&1; then
    _debug "Using FreeBSD sed -i"
    sed -i "" "$options" "$filename"
```

ヘルプに `-i extension` の表示があれば、BSD sed と判断し、拡張子に空の文字列を付けて実行します。

### 4. どちらでもなければ書き直す

```bash:line-numbers=945
  else
    _debug "No -i support in sed"
    text="$(cat "$filename")"
    echo "$text" | sed "$options" >"$filename"
```

どちらにも当てはまらない場合は、ファイルの中身を変数に読み込み、sed で変換してから、同じファイルに書き戻します。

## ここがすごい

- **ヘルプで環境を判定する**: OS の名前ではなく、実際の sed の表示を見て判断しています。Linux でも BSD の sed を入れている人にも対応できます。
- **最後の手段を用意している**: `-i` が使えない古い環境でも、中身を読んで書き戻すことで同じ結果を得られます。
- **使い方の誤りを早く止める**: ファイル名がないまま処理を進めないように、先に確かめています。

## まとめ

- OS の違いは、コマンドのヘルプの表示で見分けると確実。
- ファイルを書き換えるときは、使える方法を順番に試すと広い環境で動く。
- 最後の手段として、中身を読んで書き戻す方法を残しておくと安心。
