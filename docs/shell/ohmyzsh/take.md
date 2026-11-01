---
title: "引数の形を正規表現で見分けて、4 種類の動作を切り替える"
description: "take に tar.gz の URL を渡せば展開して移動、zip なら解凍して移動、git の URL なら clone して移動、それ以外はディレクトリを作って移動する。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [78, 88]
function: "take"
difficulty: 1
tags: [正規表現, CLI, 設計パターン]
---
## ひとことで

`take` は「何かを手に入れて、その中に移動する」万能コマンドです。引数の形を見て、やることを自動で選びます。

| 引数の例 | やること |
| --- | --- |
| `https://example.com/src.tar.gz` | ダウンロードして展開し、中のディレクトリへ移動 |
| `https://example.com/src.zip` | ダウンロードして解凍し、移動 |
| `git@github.com:user/repo.git` | `git clone` して移動 |
| `my-dir` | ディレクトリを作って移動 |

## コード

```zsh:line-numbers=78
function take() {
  if [[ $1 =~ ^(https?|ftp).*\.(tar\.(gz|bz2|xz)|tgz)$ ]]; then
    takeurl "$1"
  elif [[ $1 =~ ^(https?|ftp).*\.(zip)$ ]]; then
    takezip "$1"
  elif [[ $1 =~ ^([A-Za-z0-9]\+@|https?|git|ssh|ftps?|rsync).*\.git/?$ ]]; then
    takegit "$1"
  else
    takedir "$@"
  fi
}
```

## 前提知識

- **`[[ 文字列 =~ 正規表現 ]]`**: zsh や bash の条件式で、文字列が正規表現に一致するかを調べます。
- **正規表現の記号**:
  - `^` は先頭、`$` は末尾
  - `(a|b)` は a か b
  - `.*` は任意の文字列
  - `\.` は文字としてのドット
  - `s?` は s が 0 個か 1 個
  - `[A-Za-z0-9]` は英数字 1 文字
- **`takeurl` / `takezip` / `takegit` / `takedir`**: 同じファイルにある、それぞれの処理をする関数です。
- **`"$@"`**: 受け取った引数をそのまま渡します。

## 何をしているか

### 1. tar アーカイブの URL（79〜80 行目）

`^(https?|ftp).*\.(tar\.(gz|bz2|xz)|tgz)$` は、「`http`・`https`・`ftp` で始まり、`.tar.gz`・`.tar.bz2`・`.tar.xz`・`.tgz` のどれかで終わる」という意味です。一致したら `takeurl` を呼びます。

### 2. zip の URL（81〜82 行目）

同じように、`.zip` で終わる URL なら `takezip` を呼びます。

### 3. git のリポジトリ（83〜84 行目）

`^([A-Za-z0-9]\+@|https?|git|ssh|ftps?|rsync).*\.git/?$` は、「`user@` のような形か、`https`・`git`・`ssh` などで始まり、`.git` か `.git/` で終わる」という意味です。`git@github.com:me/repo.git` も `https://github.com/me/repo.git` も一致します。一致したら `takegit` を呼びます。

### 4. それ以外（85〜86 行目）

どれにも当てはまらなければ、普通のディレクトリ名とみなして `takedir` を呼びます。

## ここがすごい

- **1 つの名前で、意図をくみ取る**: ユーザーは「入りたい」とだけ考えればよく、それがアーカイブか、リポジトリか、新しいフォルダかは `take` が判断します。
- **判定と処理を分けている**: `take` 自身は振り分けだけを担当し、実際の処理は `takeurl` などの小さな関数に任せています。それぞれの関数は単独でも使えますし、新しい種類を足すのも簡単です。
- **具体的なものから順に判定**: 「tar の URL」「zip の URL」「git」を先に調べ、最後に何でも受け付ける「ディレクトリ」を置いています。広い条件を先に置くと、具体的な条件にたどり着けなくなるからです。

なお 83 行目の `\+` は、zsh の `=~` が使う POSIX 拡張正規表現では「文字としての `+`」と解釈されることがあります。ただ、よく使う `git@github.com:...` の形は、2 つ目の選択肢 `git` が先頭の `git` に一致するので、問題なく `takegit` に振り分けられます。

## まとめ

- `[[ $x =~ 正規表現 ]]` で、引数の形に応じて処理を切り替えられる。
- 振り分け役の関数と、実際の処理をする小さな関数に分けると拡張しやすい。
- 条件分岐は、具体的なものから順に、何でも受け付けるものを最後に置く。
