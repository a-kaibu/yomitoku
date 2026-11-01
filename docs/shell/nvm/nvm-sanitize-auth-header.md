---
title: "許可した文字以外を tr で全部消すサニタイズ"
description: "認証ヘッダの値から、改行など危険な文字を 1 回の tr コマンドで取り除く。sed ではなく tr を選んだ理由がコメントに書かれている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [338, 349]
function: "nvm_sanitize_auth_header"
difficulty: 2
format: 2
tags: [セキュリティ, 文字列処理, 防御的プログラミング]
---
## ひとことで

`nvm_sanitize_auth_header` は、ユーザーが設定した認証ヘッダの値から **使ってよい文字だけを残し、ほかは全部消す** 関数です。

たとえば `Bearer abc123\nX-Evil: 1` のように改行が混ざった値が来ても、改行が消えて `Bearer abc123X-Evil: 1` という 1 行になります。HTTP ヘッダに改行が入ると、別のヘッダを勝手に追加できてしまう（ヘッダインジェクション）ので、それを防いでいます。

## コード

::: code-group

```sh:line-numbers=338 [日本語訳]
nvm_sanitize_auth_header() {
    # 危険かもしれない文字を取り除く。base64（A-Za-z0-9+/=）と
    # base64url（A-Za-z0-9-_=）の文字をすべて許可し、さらに以前の許可リストに
    # あった空白・コロン・ドット・アンダースコアも残す。これで
    # `Basic <base64>` や `Bearer <token>` のような値が壊れない。
    # '~' も許可する。これで RFC 7235 の `token68`（つまり RFC 6750 の
    # `b64token`）の文字がそろい、'~' を含む Bearer トークンも壊れない。
    # 注意: '-' は文字そのものとして扱われるよう、セットの最後に置く必要がある。
    # `sed` ではなく `tr` を使う。sed は行単位で動くので、たとえば
    # 76 文字で折り返された `base64` の認証情報の改行が残ってしまう。
    nvm_echo "$1" | command tr -cd 'a-zA-Z0-9 :_.+/=~-'
}
```

```sh:line-numbers=338 [原文]
nvm_sanitize_auth_header() {
    # Remove potentially dangerous characters; allow the full base64 (A-Za-z0-9+/=)
    # and base64url (A-Za-z0-9-_=) charsets, plus the space, colon, dot, and
    # underscore the previous allowlist already permitted, so that values like
    # `Basic <base64>` and `Bearer <token>` survive intact.
    # '~' is also allowed, completing RFC 7235 `token68` (and thus RFC 6750
    # `b64token`), so opaque Bearer tokens containing it are not corrupted.
    # Note: '-' must be at the end of the set to be treated as a literal.
    # `tr`, not `sed`: sed is line-based and would keep newlines, eg from a
    # `base64` credential that was wrapped at 76 columns.
    nvm_echo "$1" | command tr -cd 'a-zA-Z0-9 :_.+/=~-'
}
```

:::

## 前提知識

- **`tr`**: 文字を 1 文字単位で置き換えたり消したりするコマンドです。
- **`tr -d 'abc'`**: 指定した文字を削除します。
- **`-c`（complement）**: 指定した文字の **補集合**、つまり「それ以外の全部」を対象にします。`-cd` を合わせると「指定した文字以外を全部消す」になります。
- **文字の範囲 `a-z`**: `tr` では `a-z` と書くと a から z までの文字を表します。
- **許可リスト（allowlist）**: 危険な文字を列挙して消すのではなく、安全な文字だけを列挙して残す考え方です。
- **base64**: バイナリを英数字と `+` `/` `=` で表す書き方で、`Basic` 認証などに使われます。
- **`|`（パイプ）**: 左のコマンドの出力を右のコマンドの入力にします。

## 何をしているか

### 1. 値を出力する

```sh:line-numbers=348
    nvm_echo "$1" | command tr -cd 'a-zA-Z0-9 :_.+/=~-'
```


`nvm_echo "$1"` で値を出力し、パイプで `tr` に渡します。

### 2. 許可した文字以外を消す

`tr -cd 'a-zA-Z0-9 :_.+/=~-'` で、次の文字だけを残します。

- 英大文字・小文字・数字
- 空白、`:`、`_`、`.`
- base64 用の `+`、`/`、`=`
- base64url やトークン用の `-`、`~`

それ以外、たとえば改行・タブ・`;`・`"`・日本語などはすべて消えます。

例: `Basic dXNlcjpwYXNz\n` → `Basic dXNlcjpwYXNz`（末尾の改行も消える）

## ここがすごい

- **禁止リストではなく許可リスト**: 「改行と `\r` を消す」のように危険な文字を挙げる方式だと、見落としがあれば穴になります。安全な文字だけを残す方式なら、想定外の文字は自動的に消えます。
- **`sed` ではなく `tr` を選んだ理由**: コメントにあるとおり、`sed` は行単位で動くため、行と行の間の改行そのものは消せません。`base64` コマンドは長い値を 76 文字ごとに改行して出力するので、それを貼り付けた値は複数行になりえます。`tr` は改行も 1 文字として扱うので、まとめて消せます。
- **`-` を最後に置く**: コメントのとおり、`-` は範囲指定（`a-z`）の記号でもあるので、セットの途中に置くと範囲と解釈されます。最後に置けばただの文字になります。
- **規格に根拠がある**: `~` を許可した理由として、トークンの文字種を定めた RFC 7235 の `token68` を挙げています。正しいトークンを壊さないための配慮です。

## まとめ

- 入力の無害化は「安全な文字だけを残す」許可リスト方式が堅い。
- `tr -cd 'セット'` は「セット以外を全部消す」定番の書き方。
- 行単位の `sed` では改行を消せないので、改行を含めて扱うなら `tr` を使う。
