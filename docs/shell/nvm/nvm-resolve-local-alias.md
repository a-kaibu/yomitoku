---
title: "よくある場合だけ近道する「ファストパス」"
description: "default や lts/iron のような別名を実際のバージョンに解決する関数。結果がすでにインストール済みの正確なバージョンなら、重い検索を飛ばしてすぐに返す。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [2066, 2090]
function: "nvm_resolve_local_alias"
difficulty: 1
format: 2
tags: [最適化, エラー処理]
---
## ひとことで

`nvm_resolve_local_alias default` は、`default` という別名（エイリアス）が指している **実際のバージョン**（`v20.11.0` など）を返す関数です。

別名は別名を指していることもあり、最後には `nvm_version` という重い関数で、インストール済みのバージョンの中から一致するものを探します。でも多くの場合、別名はすでに `v20.11.0` のような正確なバージョンを指しています。そこで「インストール済みの正確なバージョンなら、検索せずにすぐ返す」という近道（ファストパス）を入れています。

## コード

::: code-group

```sh:line-numbers=2066 [日本語訳]
nvm_resolve_local_alias() {
  if [ -z "${1-}" ]; then
    return 1
  fi

  local VERSION
  local EXIT_CODE
  VERSION="$(nvm_resolve_alias "${1-}")"
  EXIT_CODE=$?
  if [ -z "${VERSION}" ]; then
    return $EXIT_CODE
  fi
  if [ "_${VERSION}" = '_∞' ]; then
    nvm_echo "${VERSION}"
    return
  fi

  # ファストパス: インストール済みの正確な vX.Y.Z なら、これ以上の解決は要らない。
  if nvm_is_installed_exact_version "${VERSION}"; then
    nvm_echo "${VERSION}"
    return
  fi

  nvm_version "${VERSION}"
}
```

```sh:line-numbers=2066 [原文]
nvm_resolve_local_alias() {
  if [ -z "${1-}" ]; then
    return 1
  fi

  local VERSION
  local EXIT_CODE
  VERSION="$(nvm_resolve_alias "${1-}")"
  EXIT_CODE=$?
  if [ -z "${VERSION}" ]; then
    return $EXIT_CODE
  fi
  if [ "_${VERSION}" = '_∞' ]; then
    nvm_echo "${VERSION}"
    return
  fi

  # Fast path: an exact, installed vX.Y.Z needs no further resolution.
  if nvm_is_installed_exact_version "${VERSION}"; then
    nvm_echo "${VERSION}"
    return
  fi

  nvm_version "${VERSION}"
}
```

:::

## 前提知識

- **エイリアス（nvm の）**: `nvm alias default 20` のように、バージョンに付けた名前です。`~/.nvm/alias/` の下にファイルとして保存されます。
- **`nvm_resolve_alias`**: 別名を 1 段階以上たどって、その値を返す nvm の関数です。
- **`$?`**: 直前のコマンドの終了ステータスです。`VERSION="$(...)"` の直後に読むと、コマンド置換の中のコマンドの結果がわかります。
- **`∞`**: nvm で「無限に循環している別名」を表す特別な値です。
- **`nvm_is_installed_exact_version`**: `vX.Y.Z` の形で、しかもインストール済みかを調べる nvm の関数です。
- **`nvm_version`**: あいまいな指定（`20` など）から、インストール済みの一致するバージョンを探す nvm の関数です。

## 何をしているか

### 1. 引数がなければ失敗

### 2. 別名をたどる

`nvm_resolve_alias` で別名をたどり、結果と終了ステータスを両方受け取ります。結果が空なら、その終了ステータスをそのまま返します。どこで失敗したかの情報を失わないためです。

### 3. 循環していたら

別名がぐるぐる回っていて `∞` が返ってきたら、それをそのまま返します。

### 4. ファストパス

結果が `v20.11.0` のような正確なバージョンで、しかもインストール済みなら、それを返して終わります。

### 5. 通常の道

`lts/iron` → `20` のように、まだあいまいな値なら、`nvm_version` でインストール済みの中から探します。

## ここがすごい

- **ファストパスの定石どおり**: 速くするための近道は、「確実に同じ結果になる場合」にだけ使うのが鉄則です。正確なバージョンがインストール済みなら、`nvm_version` が返すのも同じ値なので、近道しても結果は変わりません。
- **終了ステータスを保存する**: `EXIT_CODE=$?` をすぐ次の行で取っているのが大切です。間に別のコマンドを挟むと `$?` は上書きされてしまいます。
- **特別な値を先に処理**: `∞` のような例外的な値を先に片付けることで、後の処理は普通の場合だけを考えればよくなります。

nvm はシェルの起動時に `default` を解決するので、ここが速いとターミナルを開くたびの待ち時間が短くなります。

## まとめ

- よくある場合だけを近道させる「ファストパス」は、結果が変わらないときに限って使う。
- `$?` は次のコマンドで上書きされるので、必要ならすぐに変数に保存する。
- 例外的な値は先に処理すると、残りの処理が単純になる。
