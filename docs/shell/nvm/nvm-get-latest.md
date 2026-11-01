---
title: "リダイレクト先の URL から最新バージョン名を取り出す"
description: "最新版のページへ転送される URL にアクセスし、転送先 URL の末尾だけを切り出して nvm の最新バージョン番号を得る関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [131, 150]
function: "nvm_get_latest"
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, ハック]
---
## ひとことで

`nvm_get_latest` は、**nvm 自身の最新バージョン番号**（例: `v0.40.3`）を調べて表示する関数です。

GitHub の API を呼んで JSON を解析する、といった大がかりなことはしていません。`https://latest.nvm.sh` という URL が **最新リリースのページへ転送（リダイレクト）される** ことを利用し、転送先 URL の最後の部分だけを切り出しています。

## コード

```sh:line-numbers=131
nvm_get_latest() {
  local NVM_LATEST_URL
  local CURL_COMPRESSED_FLAG
  if nvm_has_executable "curl"; then
    if nvm_curl_use_compression; then
      CURL_COMPRESSED_FLAG="--compressed"
    fi
    NVM_LATEST_URL="$(command curl -q ${CURL_COMPRESSED_FLAG:-} -w "%{url_effective}\\n" -L -s -S https://latest.nvm.sh -o /dev/null)"
  elif nvm_has_executable "wget"; then
    NVM_LATEST_URL="$(command wget -q https://latest.nvm.sh --server-response -O /dev/null 2>&1 | command awk '/^  Location: /{DEST=$2} END{ print DEST }')"
  else
    nvm_err 'nvm needs curl or wget to proceed.'
    return 1
  fi
  if [ -z "${NVM_LATEST_URL}" ]; then
    nvm_err "https://latest.nvm.sh did not redirect to the latest release on GitHub"
    return 2
  fi
  nvm_echo "${NVM_LATEST_URL##*/}"
}
```

## 前提知識

- **HTTP リダイレクト**: Web サーバーが「このページは別の URL にあります」と返す仕組みです。返事の `Location:` ヘッダに新しい URL が入っています。
- **`curl` と `wget`**: どちらも URL にアクセスするコマンドです。環境によってどちらか片方しか入っていないことがあるので、両方に対応しています。
- **curl のオプション**: `-L` はリダイレクトを最後までたどる、`-s` は進捗表示を消す、`-S` はエラーだけは表示する、`-o /dev/null` は本文を捨てる、`-w "%{url_effective}\n"` は「最終的にたどり着いた URL」を表示する、という意味です。`-q` は設定ファイル `~/.curlrc` を読まない指定です。
- **`awk '/パターン/{...} END{...}'`**: 行ごとに処理するテキスト処理言語です。`/^  Location: /` に一致した行で `DEST=$2`（2 番目の単語）を覚え、`END` で最後に覚えた値を表示します。
- **`${変数##*/}`**: 変数の値の先頭から、`*/` に一致する **最も長い部分** を取り除きます。つまり最後の `/` より後ろだけが残ります。
- **`${VAR:-}`**: 変数が空や未定義でもエラーにせず空文字として展開します。
- **`return 1`**: 関数を終了し、終了ステータスを返します。

## 何をしているか

### 1. curl がある場合

圧縮転送が使える curl なら `--compressed` を付け、`https://latest.nvm.sh` にアクセスします。`-L` でリダイレクトをたどり、本文は `/dev/null` に捨て、`-w` で最終的な URL だけを出力させます。結果はたとえば次のようになります。

```
https://github.com/nvm-sh/nvm/releases/tag/v0.40.3
```

### 2. wget しかない場合

wget には `url_effective` のような機能が無いので、`--server-response` でサーバーの返事のヘッダを表示させ、それを awk で読みます。リダイレクトが何段もあると `Location:` 行が複数出るので、**最後の行の値** を `END` で表示します。wget はヘッダをエラー出力に出すため、`2>&1` で標準出力にまとめてから awk に渡しています。

### 3. どちらも無い・結果が空のとき

curl も wget も無ければ `return 1`、URL が取れなければ `return 2` と、**原因ごとに違う番号** で失敗を返します。

### 4. 末尾を切り出す

`${NVM_LATEST_URL##*/}` で最後の `/` までを削り、`v0.40.3` だけを表示します。

## ここがすごい

- **API も JSON パーサーも不要**: GitHub API を使うと JSON を解析する必要があり、`jq` のような追加ツールや、利用回数の制限が問題になります。リダイレクト先の URL を見るだけなら、curl か wget だけで済みます。
- **「転送の仕組み」を情報源にしている**: GitHub は `/releases/latest` を最新のタグのページに転送します。nvm はその仕組みを自分のドメイン `latest.nvm.sh` 経由で使い、最新版の情報をヘッダから読み取っています。
- **外部コマンドを使わず文字列を切る**: 最後の切り出しは `basename` や `sed` を呼ばず、シェルのパラメータ展開だけでやっています。プロセスを起動しないので速く、どのシェルでも動きます。
- **失敗理由を区別**: `return 1` と `return 2` を分けることで、呼び出し元が「ツールが無い」のか「サーバーの返事がおかしい」のかを判断できます。

## まとめ

- リダイレクト先の URL は、バージョン番号などの情報を得る手軽な手段になる。
- curl と wget の両方に対応すると、多くの環境で動くスクリプトになる。
- `${var##*/}` は「最後の `/` より後ろ」を取り出す定番の書き方。
