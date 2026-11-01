---
title: "認証ヘッダを他所へ漏らさないリダイレクトの手動追跡"
description: "wget に自動リダイレクトをさせず、転送先が同じオリジンかを毎回確かめてから自分で追いかける。set -- で引数リストを書き換える技も見どころ。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [251, 306]
function: "nvm_wget_same_origin"
difficulty: 3
format: 2
tags: [セキュリティ, ネットワーク, ハック]
---
## ひとことで

`nvm_wget_same_origin` は、認証ヘッダ（パスワードやトークン）を付けて wget でダウンロードするときに、**リダイレクト先が別のサーバーなら追いかけない** ようにする関数です。

wget は普通、リダイレクトを自動でたどり、そのとき付けたヘッダも転送先に送ってしまいます。社内ミラーのトークンが、転送先の知らないサーバーに届いてしまうかもしれません。そこで自動追跡を止め、1 回ずつ転送先を確認しながら自分で追いかけます。

## コード

::: code-group

```sh:line-numbers=251 [日本語訳]
nvm_wget_same_origin() {
  local NVM_WGET_HEADER
  NVM_WGET_HEADER="Authorization: ${1-}"
  shift
  local NVM_WGET_URL
  NVM_WGET_URL=''
  local NVM_WGET_ARG
  for NVM_WGET_ARG in "$@"; do
    case "${NVM_WGET_ARG}" in
      http://* | https://*) NVM_WGET_URL="${NVM_WGET_ARG}" ;;
    esac
  done
  local NVM_WGET_REQUESTED_URL
  NVM_WGET_REQUESTED_URL="${NVM_WGET_URL}"
  local NVM_WGET_EXIT_CODE
  local NVM_WGET_LOCATION
  local NVM_WGET_ARG_COUNT
  local NVM_WGET_REDIRECTS
  NVM_WGET_REDIRECTS=0
  while :; do
    command wget --max-redirect=0 "$@" --header "${NVM_WGET_HEADER}"
    NVM_WGET_EXIT_CODE=$?
    # wget は HTTP のエラーで終了コード 8 を返す。たどらなかったリダイレクトも含む
    if [ "${NVM_WGET_EXIT_CODE}" != 8 ] || [ -z "${NVM_WGET_URL}" ]; then
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_LOCATION="$(command wget --max-redirect=0 -q -S -O /dev/null "${NVM_WGET_URL}" --header "${NVM_WGET_HEADER}" 2>&1 \
      | command awk 'tolower($1) == "location:" { print $2; exit }' | command tr -d '\r')"
    case "${NVM_WGET_LOCATION}" in
      '') return "${NVM_WGET_EXIT_CODE}" ;;
      http://* | https://*) ;;
      //*) NVM_WGET_LOCATION="${NVM_WGET_URL%%//*}${NVM_WGET_LOCATION}" ;;
      /*) NVM_WGET_LOCATION="$(nvm_url_origin "${NVM_WGET_URL}")${NVM_WGET_LOCATION}" ;;
      *) NVM_WGET_LOCATION="${NVM_WGET_URL%/*}/${NVM_WGET_LOCATION}" ;;
    esac
    if [ "$(nvm_url_origin "${NVM_WGET_LOCATION}")" != "$(nvm_url_origin "${NVM_WGET_URL}")" ]; then
      nvm_err "${NVM_WGET_REQUESTED_URL} redirects to another origin; wget would send \$NVM_AUTH_HEADER there too, so it is not followed. Install curl to download from this mirror."
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_REDIRECTS=$((NVM_WGET_REDIRECTS + 1))
    if [ "${NVM_WGET_REDIRECTS}" -gt 20 ]; then
      nvm_err "${NVM_WGET_REQUESTED_URL}: too many redirects"
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_ARG_COUNT=$#
    for NVM_WGET_ARG in "$@"; do
      if [ "${NVM_WGET_ARG}" = "${NVM_WGET_URL}" ]; then
        set -- "$@" "${NVM_WGET_LOCATION}"
      else
        set -- "$@" "${NVM_WGET_ARG}"
      fi
    done
    shift "${NVM_WGET_ARG_COUNT}"
    NVM_WGET_URL="${NVM_WGET_LOCATION}"
  done
}
```

```sh:line-numbers=251 [原文]
nvm_wget_same_origin() {
  local NVM_WGET_HEADER
  NVM_WGET_HEADER="Authorization: ${1-}"
  shift
  local NVM_WGET_URL
  NVM_WGET_URL=''
  local NVM_WGET_ARG
  for NVM_WGET_ARG in "$@"; do
    case "${NVM_WGET_ARG}" in
      http://* | https://*) NVM_WGET_URL="${NVM_WGET_ARG}" ;;
    esac
  done
  local NVM_WGET_REQUESTED_URL
  NVM_WGET_REQUESTED_URL="${NVM_WGET_URL}"
  local NVM_WGET_EXIT_CODE
  local NVM_WGET_LOCATION
  local NVM_WGET_ARG_COUNT
  local NVM_WGET_REDIRECTS
  NVM_WGET_REDIRECTS=0
  while :; do
    command wget --max-redirect=0 "$@" --header "${NVM_WGET_HEADER}"
    NVM_WGET_EXIT_CODE=$?
    # wget exits with 8 for an HTTP error status, including a redirect it did not follow
    if [ "${NVM_WGET_EXIT_CODE}" != 8 ] || [ -z "${NVM_WGET_URL}" ]; then
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_LOCATION="$(command wget --max-redirect=0 -q -S -O /dev/null "${NVM_WGET_URL}" --header "${NVM_WGET_HEADER}" 2>&1 \
      | command awk 'tolower($1) == "location:" { print $2; exit }' | command tr -d '\r')"
    case "${NVM_WGET_LOCATION}" in
      '') return "${NVM_WGET_EXIT_CODE}" ;;
      http://* | https://*) ;;
      //*) NVM_WGET_LOCATION="${NVM_WGET_URL%%//*}${NVM_WGET_LOCATION}" ;;
      /*) NVM_WGET_LOCATION="$(nvm_url_origin "${NVM_WGET_URL}")${NVM_WGET_LOCATION}" ;;
      *) NVM_WGET_LOCATION="${NVM_WGET_URL%/*}/${NVM_WGET_LOCATION}" ;;
    esac
    if [ "$(nvm_url_origin "${NVM_WGET_LOCATION}")" != "$(nvm_url_origin "${NVM_WGET_URL}")" ]; then
      nvm_err "${NVM_WGET_REQUESTED_URL} redirects to another origin; wget would send \$NVM_AUTH_HEADER there too, so it is not followed. Install curl to download from this mirror."
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_REDIRECTS=$((NVM_WGET_REDIRECTS + 1))
    if [ "${NVM_WGET_REDIRECTS}" -gt 20 ]; then
      nvm_err "${NVM_WGET_REQUESTED_URL}: too many redirects"
      return "${NVM_WGET_EXIT_CODE}"
    fi
    NVM_WGET_ARG_COUNT=$#
    for NVM_WGET_ARG in "$@"; do
      if [ "${NVM_WGET_ARG}" = "${NVM_WGET_URL}" ]; then
        set -- "$@" "${NVM_WGET_LOCATION}"
      else
        set -- "$@" "${NVM_WGET_ARG}"
      fi
    done
    shift "${NVM_WGET_ARG_COUNT}"
    NVM_WGET_URL="${NVM_WGET_LOCATION}"
  done
}
```

:::

## 前提知識

- **`shift`**: 引数の先頭を 1 つ捨てて、残りを前に詰めます。`shift 3` なら 3 つ捨てます。
- **`for 変数 in "$@"`**: 引数を 1 つずつ取り出して繰り返します。
- **`while :; do ... done`**: `:` は「何もせず成功する」コマンドなので、これは無限ループです。抜けるには `return` などを使います。
- **`$?`**: 直前のコマンドの終了ステータスです。
- **`set -- 値...`**: 関数の引数リスト（`$1`, `$2`, ...）を丸ごと置き換えます。
- **`$#`**: 引数の個数です。
- **オリジン**: スキーム・ホスト・ポートの組。`nvm_url_origin` 関数で取り出しています。
- **`tolower($1) == "location:"`**: awk で 1 列目を小文字にして比べます。HTTP ヘッダ名は大文字小文字を区別しないためです。
- **`tr -d '\r'`**: HTTP ヘッダの行末にある復帰文字 `\r` を消します。

## 何をしているか

### 1. URL を見つける

```sh:line-numbers=260
      http://* | https://*) NVM_WGET_URL="${NVM_WGET_ARG}" ;;
```


wget に渡す引数の中から `http://` か `https://` で始まるものを探し、`NVM_WGET_URL` に覚えます。

### 2. 自動リダイレクトなしで実行

```sh:line-numbers=271
    command wget --max-redirect=0 "$@" --header "${NVM_WGET_HEADER}"
```


`--max-redirect=0` を付けて wget を実行します。コメントのとおり、リダイレクトを追わなかった場合 wget は終了コード 8 を返します。8 以外（成功や別のエラー）ならその値で終わります。

### 3. 転送先を調べる

もう一度ヘッダだけを取得して `Location:` の値を読みます。値は相対的な書き方のこともあるので、`case` で完全な URL に直します。`//host/...` ならスキームを、`/path` ならオリジンを、`file` なら今の URL のディレクトリを前に付けます。

### 4. オリジンを比べる

転送先のオリジンが元と違えば、エラーを出して止まります。同じなら回数を数え、20 回を超えたら無限ループ防止のために止まります。

### 5. 引数の URL だけ差し替える

```sh:line-numbers=254
  shift
```


ここが巧妙です。元の引数の数を覚えておき、引数を 1 つずつ見て、URL だったものは転送先に、それ以外はそのままにして **リストの後ろに追加** します。最後に `shift` で元のぶんを捨てれば、URL だけが置き換わった新しい引数リストになります。配列が無い POSIX シェルで「リストの一部を書き換える」定番の技です。

## ここがすごい

- **漏えいの穴を自分でふさぐ**: curl なら別ホストへの転送時に認証ヘッダを送らない設定がありますが、wget にはそれが無いため、追跡そのものを自前で実装しています。
- **配列なしで引数を編集**: `set --` と `shift` の組み合わせで、空白を含む引数も壊さずに入れ替えています。
- **安全側に倒す**: 少しでも判断できないとき（`Location` が空など）は追跡をやめ、元の終了コードを返します。

## まとめ

- リダイレクトの自動追跡は、認証情報を予想外の相手に送る原因になる。
- POSIX シェルでは `set -- "$@" 新しい値` と `shift N` で引数リストを編集できる。
- 外部ツールに足りない安全機能は、ラッパー関数で補える。
