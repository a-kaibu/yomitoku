---
title: "curl のオプションを wget 用に翻訳して同じ呼び方で使う"
description: "curl があれば curl、なければ wget でダウンロードする関数。呼び出し側は curl の書き方だけをすればよく、wget のときは引数を 1 つずつ wget 用に置き換える。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [155, 231]
function: "nvm_download"
difficulty: 3
format: 2
tags: [移植性, ネットワーク, 設計パターン]
---
## ひとことで

`nvm_download` は、ファイルをダウンロードする nvm の共通関数です。呼び出す側は **curl のオプションで書く** だけです。

```sh
nvm_download -L -s "$URL" -o "$FILE"
```

curl が入っていればそのまま curl を実行し、wget しかなければ `-s` → `-q`、`-o` → `-O` のように **wget のオプションに翻訳して** 実行します。さらに、必要なときだけ認証ヘッダを付けます。

## コード

::: code-group

```sh:line-numbers=155 [日本語訳]
nvm_download() {
  local sanitized_header
  sanitized_header=''
  if [ -n "${NVM_AUTH_HEADER:-}" ]; then
    local NVM_DOWNLOAD_AUTH
    NVM_DOWNLOAD_AUTH=''
    local NVM_DOWNLOAD_ARG
    for NVM_DOWNLOAD_ARG in "$@"; do
      case "${NVM_DOWNLOAD_ARG}" in
        http://* | https://*)
          if nvm_auth_header_applies_to "${NVM_DOWNLOAD_ARG}"; then
            NVM_DOWNLOAD_AUTH=1
          else
            NVM_DOWNLOAD_AUTH=''
            break
          fi
        ;;
      esac
    done
    if [ -n "${NVM_DOWNLOAD_AUTH}" ]; then
      sanitized_header="$(nvm_sanitize_auth_header "${NVM_AUTH_HEADER}")"
    fi
  fi

  local NVM_DOWNLOADER
  NVM_DOWNLOADER=''
  if nvm_has_executable "curl"; then
    NVM_DOWNLOADER='curl'
    set -- --fail "$@"
    if nvm_curl_use_compression; then
      set -- --compressed "$@"
    fi
    # curl が `.curlrc` を読まないのは、`-q` が最初の引数のときだけ
    set -- -q "$@"
  elif nvm_has_executable "wget"; then
    NVM_DOWNLOADER='wget'
    # wget で curl のふりをする
    local NVM_DOWNLOAD_WGET_COUNT
    NVM_DOWNLOAD_WGET_COUNT=$#
    local NVM_DOWNLOAD_WGET_SKIP
    NVM_DOWNLOAD_WGET_SKIP=0
    local NVM_DOWNLOAD_WGET_ARG
    for NVM_DOWNLOAD_WGET_ARG in "$@"; do
      if [ "${NVM_DOWNLOAD_WGET_SKIP}" = '1' ]; then
        NVM_DOWNLOAD_WGET_SKIP=0
        continue
      fi
      case "${NVM_DOWNLOAD_WGET_ARG}" in
        '--progress-bar') set -- "$@" '--progress=bar' ;;
        '--compressed') : ;;
        '--fail') : ;;
        '-L') : ;;
        '-I') set -- "$@" '--server-response' ;;
        '-s') set -- "$@" '-q' ;;
        '-sS') set -- "$@" '-nv' ;;
        '-o') set -- "$@" '-O' ;;
        '-C') NVM_DOWNLOAD_WGET_SKIP=1; set -- "$@" '-c' ;;
        *) set -- "$@" "${NVM_DOWNLOAD_WGET_ARG}" ;;
      esac
    done
    shift "${NVM_DOWNLOAD_WGET_COUNT}"
  fi

  if [ -z "${NVM_DOWNLOADER}" ]; then
    return 0
  fi

  if [ -n "${sanitized_header}" ]; then
    if [ "${NVM_DOWNLOADER}" = 'wget' ] && nvm_wget_is_gnu; then
      nvm_wget_same_origin "${sanitized_header}" "$@"
      return $?
    fi
    set -- "$@" --header "Authorization: ${sanitized_header}"
  fi

  command "${NVM_DOWNLOADER}" "$@"
}
```

```sh:line-numbers=155 [原文]
nvm_download() {
  local sanitized_header
  sanitized_header=''
  if [ -n "${NVM_AUTH_HEADER:-}" ]; then
    local NVM_DOWNLOAD_AUTH
    NVM_DOWNLOAD_AUTH=''
    local NVM_DOWNLOAD_ARG
    for NVM_DOWNLOAD_ARG in "$@"; do
      case "${NVM_DOWNLOAD_ARG}" in
        http://* | https://*)
          if nvm_auth_header_applies_to "${NVM_DOWNLOAD_ARG}"; then
            NVM_DOWNLOAD_AUTH=1
          else
            NVM_DOWNLOAD_AUTH=''
            break
          fi
        ;;
      esac
    done
    if [ -n "${NVM_DOWNLOAD_AUTH}" ]; then
      sanitized_header="$(nvm_sanitize_auth_header "${NVM_AUTH_HEADER}")"
    fi
  fi

  local NVM_DOWNLOADER
  NVM_DOWNLOADER=''
  if nvm_has_executable "curl"; then
    NVM_DOWNLOADER='curl'
    set -- --fail "$@"
    if nvm_curl_use_compression; then
      set -- --compressed "$@"
    fi
    # curl only skips reading `.curlrc` when `-q` is its very first argument
    set -- -q "$@"
  elif nvm_has_executable "wget"; then
    NVM_DOWNLOADER='wget'
    # Emulate curl with wget
    local NVM_DOWNLOAD_WGET_COUNT
    NVM_DOWNLOAD_WGET_COUNT=$#
    local NVM_DOWNLOAD_WGET_SKIP
    NVM_DOWNLOAD_WGET_SKIP=0
    local NVM_DOWNLOAD_WGET_ARG
    for NVM_DOWNLOAD_WGET_ARG in "$@"; do
      if [ "${NVM_DOWNLOAD_WGET_SKIP}" = '1' ]; then
        NVM_DOWNLOAD_WGET_SKIP=0
        continue
      fi
      case "${NVM_DOWNLOAD_WGET_ARG}" in
        '--progress-bar') set -- "$@" '--progress=bar' ;;
        '--compressed') : ;;
        '--fail') : ;;
        '-L') : ;;
        '-I') set -- "$@" '--server-response' ;;
        '-s') set -- "$@" '-q' ;;
        '-sS') set -- "$@" '-nv' ;;
        '-o') set -- "$@" '-O' ;;
        '-C') NVM_DOWNLOAD_WGET_SKIP=1; set -- "$@" '-c' ;;
        *) set -- "$@" "${NVM_DOWNLOAD_WGET_ARG}" ;;
      esac
    done
    shift "${NVM_DOWNLOAD_WGET_COUNT}"
  fi

  if [ -z "${NVM_DOWNLOADER}" ]; then
    return 0
  fi

  if [ -n "${sanitized_header}" ]; then
    if [ "${NVM_DOWNLOADER}" = 'wget' ] && nvm_wget_is_gnu; then
      nvm_wget_same_origin "${sanitized_header}" "$@"
      return $?
    fi
    set -- "$@" --header "Authorization: ${sanitized_header}"
  fi

  command "${NVM_DOWNLOADER}" "$@"
}
```

:::

## 前提知識

- **`set -- 値 "$@"`**: 引数リストの **先頭に** 値を足します。`set -- "$@" 値` なら末尾に足します。
- **`shift N`**: 引数リストの先頭から N 個を捨てます。
- **`$#`**: 引数の個数です。
- **`for x in "$@"`**: ループを始めた時点の引数を 1 つずつ取り出します。ループ中に `set --` で引数を変えても、取り出す対象は変わりません。
- **`:`**: 何もしないコマンドです。`case` の中で「この引数は捨てる」という意味に使っています。
- **`continue`**: ループの残りを飛ばして次へ進みます。
- **`command "${NVM_DOWNLOADER}" "$@"`**: 変数に入れたコマンド名（`curl` か `wget`）を、関数やエイリアスを避けて実行します。

## 何をしているか

### 1. 認証ヘッダを付けるか決める

`NVM_AUTH_HEADER` が設定されていても、すぐには使いません。引数の URL がすべて設定したミラーの配下のときだけ付けます。1 つでも外の URL があれば付けません。値は `nvm_sanitize_auth_header` で危険な文字を取り除きます。

### 2. curl の場合

`--fail`（HTTP エラーで失敗する）、`--compressed`（使えれば）、`-q` を先頭に足します。コメントのとおり、`-q`（`.curlrc` を読まない）は **最初の引数でないと効かない** ので、最後に `set --` で先頭に入れています。

### 3. wget の場合

元の引数の数を覚えてから、1 つずつ見て wget 用の引数を **後ろに** 追加していきます。

| curl | wget |
| --- | --- |
| `--progress-bar` | `--progress=bar` |
| `-s` | `-q` |
| `-sS` | `-nv` |
| `-o` | `-O` |
| `-I` | `--server-response` |
| `-C -` | `-c`（次の `-` は捨てる） |
| `-L`、`--fail`、`--compressed` | 捨てる（wget では不要） |

`-C` は「途中から再開」で、curl では `-C -` と値を伴います。wget の `-c` は値を取らないので、次の引数を読み飛ばすフラグを立てています。最後に `shift` で元の引数を捨てれば、翻訳済みの引数だけが残ります。

### 4. 実行

どちらも無ければ何もしません。ヘッダがあり、ダウンローダーが GNU wget なら、リダイレクトを安全にたどる `nvm_wget_same_origin` に任せます。それ以外はヘッダを付けて実行します。

## ここがすごい

- **アダプターとしての関数**: 「呼ぶ側は 1 つの書き方、裏で実装を切り替える」というアダプターパターンです。nvm の中のダウンロード処理は全部 curl の書き方で統一されています。
- **配列なしの引数変換**: `set -- "$@" 新しい値` で後ろに追加し、最後に `shift` で元を消す技で、空白を含む引数も壊さずに変換しています。
- **認証情報を必要な相手にだけ**: 1 つでも外部の URL が混ざれば付けない、という安全側の判断です。

## まとめ

- ツールの違いはラッパー関数で吸収し、呼ぶ側の書き方を 1 つにそろえる。
- `set --` と `shift` を組み合わせると、POSIX シェルでも引数リストを作り直せる。
- 認証ヘッダは送り先を確かめてから付ける。
