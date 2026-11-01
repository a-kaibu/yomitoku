---
title: "PATH の順番を崩さずに Node.js のディレクトリを差し替える"
description: "nvm use で PATH を書き換える関数。nvm の古いディレクトリがあればその位置で差し替え、無ければ先頭に足す。正規表現の特殊文字のエスケープも丁寧。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1543, 1575]
function: "nvm_change_path"
difficulty: 3
format: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`nvm_change_path "$PATH" /bin ~/.nvm/versions/node/v20` は、PATH に入っている nvm の古い Node.js のディレクトリを **新しいバージョンのものに置き換えた** PATH を返します。

```
前: /home/me/.nvm/versions/node/v18/bin:/usr/bin
後: /home/me/.nvm/versions/node/v20/bin:/usr/bin
```

nvm の古いディレクトリが無ければ、新しいものを先頭に追加します。`nvm use` の中心にある関数です。

## コード

::: code-group

```sh:line-numbers=1543 [日本語訳]
nvm_change_path() {
  # 元の PATH が空なら、追加するパスだけを返す
  if [ -z "${1-}" ]; then
    nvm_echo "${3-}${2-}"
    return
  fi
  # `${NVM_DIR}` は文字どおりに一致させるので、正規表現で特別な意味を持つ文字をエスケープする
  local NVM_DIR_RE
  NVM_DIR_RE="$(nvm_echo "${NVM_DIR}" | command sed 's/[][\.*^$+?(){}|]/\\&/g')"
  # 元の PATH に nvm のパスが含まれていなければ、追加するパスを
  # 先頭に付ける
  if ! nvm_echo "${1-}" | nvm_grep -Eq "${NVM_DIR_RE}/[^/]*${2-}" \
    && ! nvm_echo "${1-}" | nvm_grep -Eq "${NVM_DIR_RE}/versions/[^/]*/[^/]*${2-}"; then
    nvm_echo "${3-}${2-}:${1-}"
  # 元の PATH に nvm のパスがあり（上で確認済み）、しかも
  # その nvm のパスより前にシステムのバイナリのパスがあるなら、
  # 置き換えずに、追加するパスを先頭に付けるだけにする。
  # 参考: https://github.com/nvm-sh/nvm/issues/1652#issuecomment-342571223
  elif nvm_echo "${1-}" | nvm_grep -Eq "(^|:)(/usr(/local)?)?${2-}:.*${NVM_DIR_RE}/[^/]*${2-}" \
    || nvm_echo "${1-}" | nvm_grep -Eq "(^|:)(/usr(/local)?)?${2-}:.*${NVM_DIR_RE}/versions/[^/]*/[^/]*${2-}"; then
    nvm_echo "${3-}${2-}:${1-}"
  # sed で既存の nvm のパスを追加するパスに置き換える。こうすると
  # PATH の順番が保たれる。
  else
    local NVM_DIR_SED
    NVM_DIR_SED="$(nvm_echo "${NVM_DIR_RE}" | command sed 's/#/\\#/g')"
    local NEW_DIR_SED
    NEW_DIR_SED="$(nvm_echo "${3-}" | command sed 's/[\&#]/\\&/g')"
    nvm_echo "${1-}" | command sed -E \
      -e "s#${NVM_DIR_SED}/[^/]*${2-}[^:]*#${NEW_DIR_SED}${2-}#" \
      -e "s#${NVM_DIR_SED}/versions/[^/]*/[^/]*${2-}[^:]*#${NEW_DIR_SED}${2-}#"
  fi
}
```

```sh:line-numbers=1543 [原文]
nvm_change_path() {
  # if there’s no initial path, just return the supplementary path
  if [ -z "${1-}" ]; then
    nvm_echo "${3-}${2-}"
    return
  fi
  # `${NVM_DIR}` is matched literally, so escape characters that are special in regexes
  local NVM_DIR_RE
  NVM_DIR_RE="$(nvm_echo "${NVM_DIR}" | command sed 's/[][\.*^$+?(){}|]/\\&/g')"
  # if the initial path doesn’t contain an nvm path, prepend the supplementary
  # path
  if ! nvm_echo "${1-}" | nvm_grep -Eq "${NVM_DIR_RE}/[^/]*${2-}" \
    && ! nvm_echo "${1-}" | nvm_grep -Eq "${NVM_DIR_RE}/versions/[^/]*/[^/]*${2-}"; then
    nvm_echo "${3-}${2-}:${1-}"
  # if the initial path contains BOTH an nvm path (checked for above) and
  # that nvm path is preceded by a system binary path, just prepend the
  # supplementary path instead of replacing it.
  # https://github.com/nvm-sh/nvm/issues/1652#issuecomment-342571223
  elif nvm_echo "${1-}" | nvm_grep -Eq "(^|:)(/usr(/local)?)?${2-}:.*${NVM_DIR_RE}/[^/]*${2-}" \
    || nvm_echo "${1-}" | nvm_grep -Eq "(^|:)(/usr(/local)?)?${2-}:.*${NVM_DIR_RE}/versions/[^/]*/[^/]*${2-}"; then
    nvm_echo "${3-}${2-}:${1-}"
  # use sed to replace the existing nvm path with the supplementary path. This
  # preserves the order of the path.
  else
    local NVM_DIR_SED
    NVM_DIR_SED="$(nvm_echo "${NVM_DIR_RE}" | command sed 's/#/\\#/g')"
    local NEW_DIR_SED
    NEW_DIR_SED="$(nvm_echo "${3-}" | command sed 's/[\&#]/\\&/g')"
    nvm_echo "${1-}" | command sed -E \
      -e "s#${NVM_DIR_SED}/[^/]*${2-}[^:]*#${NEW_DIR_SED}${2-}#" \
      -e "s#${NVM_DIR_SED}/versions/[^/]*/[^/]*${2-}[^:]*#${NEW_DIR_SED}${2-}#"
  fi
}
```

:::

## 前提知識

- **引数**: `$1` が元の PATH、`$2` が付け足す部分（`/bin` など）、`$3` が新しいバージョンのディレクトリです。
- **`grep -Eq パターン`**: 拡張正規表現でパターンに一致する行があるかを調べ、結果を終了ステータスだけで返します（`-q` は何も表示しない）。
- **正規表現の特殊文字**: `.` `*` `[` `(` `+` `?` などは正規表現で特別な意味を持ちます。文字そのものとして使うには `\` を前に付けます（エスケープ）。
- **`sed 's/[...]/\\&/g'`**: `&` は「一致した文字」を表すので、`\\&` で「一致した文字の前に `\` を付ける」になります。
- **`sed -E -e "s#A#B#"`**: 置換の区切りに `/` の代わりに `#` を使っています。パスには `/` が多いので、区切りを変えると読みやすくなります。
- **`(^|:)`**: 「先頭か、コロンの直後」という意味の正規表現です。PATH の要素の始まりを表します。

## 何をしているか

### 1. PATH が空なら足すだけ

元の PATH が空なら `$3$2`（新しいディレクトリ + `/bin`）だけを返します。

### 2. NVM_DIR をエスケープ

```sh:line-numbers=1549
  # `${NVM_DIR}` is matched literally, so escape characters that are special in regexes
```


`NVM_DIR` を正規表現の中で使うので、特殊文字の前に `\` を付けます。`/home/me/.nvm` の `.` は「任意の 1 文字」ではなく本物のドットとして扱われます。

### 3. nvm のディレクトリが無ければ先頭へ

PATH に nvm 管理下の `bin` が見つからなければ、新しいものを先頭に付けます。

### 4. システムの bin が先にある場合

`/usr/bin:...:~/.nvm/.../bin` のように、システムのディレクトリが nvm より前にあると、差し替えても `/usr/bin/node` が優先されてしまいます。この場合は先頭に追加します（コメントと issue へのリンク）。

### 5. それ以外は同じ位置で差し替え

`sed` で、nvm の古いディレクトリを新しいものに置き換えます。区切り文字 `#` がパスに含まれても壊れないよう、`NVM_DIR` 側は `#` を、新しいディレクトリ側は `\` `&` `#` をエスケープしています。

## ここがすごい

- **順番を保つ**: 単純に先頭へ追加し続けると、`nvm use` するたびに PATH が長くなり、古いディレクトリも残ります。差し替えなら PATH の長さも、ほかのディレクトリとの順番も変わりません。
- **3 種類のエスケープを使い分ける**: 正規表現の中の値、`sed` の区切り文字、置換後の文字列では、それぞれ特別な意味を持つ文字が違います。どこに埋め込むかに応じて別々にエスケープしています。
- **ユーザーの PATH の事情に合わせる**: 「nvm の Node.js がシステムの Node.js に負ける」という実際に報告された問題に対し、場合分けで対処しています。

## まとめ

- 変数の値を正規表現に埋め込むときは、特殊文字をエスケープする。
- `sed` の区切り文字は `#` などに変えられるが、その文字もエスケープが必要になる。
- PATH を書き換えるときは、追加ではなく差し替えにすると順番と長さを保てる。
