---
title: "ユーザー名とホスト名を、ターミナルの 1 行目の表示にする"
description: "現在のユーザー名とホスト名を色付きで組み立て、表示の幅を計算するための長さも合わせて求める関数。"
language: shell
project: "neofetch"
repo: https://github.com/dylanaraps/neofetch
license: "MIT"
copyright: "Copyright (c) 2015-2021 Dylan Araps"
commit: "ccd5d9f52609bbdcd5d8fa78c4fdb0f12954125f"
file: "neofetch"
lines: [1382, 1392]
function: "get_title"
difficulty: 2
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`get_title` は、**`ユーザー名@ホスト名` の形の見出しを作る** 関数です。neofetch の表示の一番上に出る、あの行です。

見出しは色付きで出ますが、表示の幅を計算するときには、色の記号は数えられません。そこで、色を付けない文字の長さも一緒に求めています。

## コード

```bash:line-numbers=1382
get_title() {
    user=${USER:-$(id -un || printf %s "${HOME/*\/}")}

    case $title_fqdn in
        on) hostname=$(hostname -f) ;;
        *)  hostname=${HOSTNAME:-$(hostname)} ;;
    esac

    title=${title_color}${bold}${user}${at_color}@${title_color}${bold}${hostname}
    length=$((${#user} + ${#hostname} + 1))
}
```

## 前提知識

- **`USER` と `HOSTNAME`**: ユーザー名とホスト名を入れる環境変数です。無いときは、他の方法で求めます。
- **`hostname -f`**: 完全な形のホスト名を表示します。ドメインを含むことがあります。
- **色の変数**: `title_color` や `at_color` などは、設定で決まる色の記号です。文字の長さには含まれません。
- **`${#変数}`**: 変数の文字列の長さを返す書き方です。

## 何をしているか

### 1. ユーザー名を決める

```bash:line-numbers=1383
    user=${USER:-$(id -un || printf %s "${HOME/*\/}")}
```

`USER` があればそれを使います。無い場合は、`id -un` で求めます。

### 2. ホスト名を決める

```bash:line-numbers=1385
    case $title_fqdn in
        on) hostname=$(hostname -f) ;;
        *)  hostname=${HOSTNAME:-$(hostname)} ;;
    esac
```

設定で完全な形の名前が指定されていれば、`hostname -f` で求めます。そうでなければ、`HOSTNAME` を使います。

### 3. 色付きの見出しと長さを作る

```bash:line-numbers=1390
    title=${title_color}${bold}${user}${at_color}@${title_color}${bold}${hostname}
    length=$((${#user} + ${#hostname} + 1))
```

ユーザー名、`@`、ホスト名を色の記号で囲んで、見出しの文字列を作ります。長さは、色の記号を含まない文字数だけを数えます。

## ここがすごい

- **色と幅を分けて考える**: 見た目は色付き、幅の計算は色を除く、という使い分けです。表示の整列が崩れません。
- **予備の方法を用意する**: 環境変数が無くても、別の方法で名前を求めます。
- **設定で詳しさを変える**: 完全なホスト名を出すかどうかを、設定で切り替えられます。

## まとめ

- 見た目の色と、幅の計算は分けて考えると崩れにくい。
- 環境変数が無いときの代わりを用意しておくと、移植しやすい。
- 表示の幅は、色の記号を除いた文字数で数える。
