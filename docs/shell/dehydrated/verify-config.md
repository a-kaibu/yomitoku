---
title: "設定の値が正しい範囲にあるかを、実行前にまとめて確かめる"
description: "チャレンジの種類や鍵のアルゴリズム、数値の設定などを、許された値と比べる関数。誤りがあれば、その場で理由を表示して終了する。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [368, 386]
function: "verify_config"
difficulty: 2
format: 2
tags: [防御的プログラミング, エラー処理, API設計]
---
## ひとことで

`verify_config` は、dehydrated の設定が **許された値の範囲に入っているか** を、実行の前に確かめる関数です。問題があれば、どの設定が間違っているかをメッセージで伝えて、そこで終了します。

設定の間違いは、証明書の発行の途中で気づくと、やり直しが大変です。そこで、最初にまとめて確認しています。小さなツールでも、こうした入り口の検査が使いやすさを大きく左右します。

## コード

```bash:line-numbers=368
verify_config() {
  [[ "${CHALLENGETYPE}" == "http-01" || "${CHALLENGETYPE}" == "dns-01" || "${CHALLENGETYPE}" == "dns-persist-01" || "${CHALLENGETYPE}" == "tls-alpn-01" ]] || _exiterr "Unknown challenge type ${CHALLENGETYPE}... cannot continue."
  if [[ "${COMMAND:-}" =~ sign_domains|sign_csr ]]; then
    if [[ "${CHALLENGETYPE}" = "dns-01" ]] && [[ -z "${HOOK}" ]]; then
      _exiterr "Challenge type dns-01 needs a hook script for deployment... cannot continue."
    fi
    if [[ "${CHALLENGETYPE}" = "http-01" ]] && [[ ! -d "${WELLKNOWN}" ]]; then
      _exiterr "WELLKNOWN directory doesn't exist, please create ${WELLKNOWN} and set appropriate permissions."
    fi
  fi
  [[ "${KEY_ALGO}" == "rsa" || "${KEY_ALGO}" == "prime256v1" || "${KEY_ALGO}" == "secp384r1" || "${KEY_ALGO}" == "secp521r1" ]] || _exiterr "Unknown public key algorithm ${KEY_ALGO}... cannot continue."
  if [[ -n "${IP_VERSION}" ]]; then
    [[ "${IP_VERSION}" = "4" || "${IP_VERSION}" = "6" ]] || _exiterr "Unknown IP version ${IP_VERSION}... cannot continue."
  fi
  [[ "${API}" == "auto" || "${API}" == "1" || "${API}" == "2" ]] || _exiterr "Unsupported API version defined in config: ${API}"
  [[ "${OCSP_DAYS}" =~ ^[0-9]+$ ]] || _exiterr "OCSP_DAYS must be a number"
  [[ "${ORDER_TIMEOUT}" =~ ^[0-9]+$ ]] || _exiterr "ORDER_TIMEOUT must be a number"
  [[ "${VALIDATION_TIMEOUT}" =~ ^[0-9]+$ ]] || _exiterr "VALIDATION_TIMEOUT must be a number"
}
```

## 前提知識

- **`[[ 条件1 || 条件2 ]]`**: 条件のどれかが真なら真になります。`||` は「または」です。
- **`=~ パターン`**: 文字列が正規表現に一致するかを調べます。`^[0-9]+$` は「数字だけからなる」という意味です。
- **`|| _exiterr "..."`**: 左の条件が偽のときだけ、右のエラー処理を実行します。
- **`[ -d ディレクトリ ]`**: そのディレクトリが存在するかを調べます。
- **`_exiterr`**: エラーメッセージを表示して、プログラムを終了させる関数です。

## 何をしているか

### 1. チャレンジの種類を確かめる

```bash:line-numbers=369
  [[ "${CHALLENGETYPE}" == "http-01" || "${CHALLENGETYPE}" == "dns-01" || "${CHALLENGETYPE}" == "dns-persist-01" || "${CHALLENGETYPE}" == "tls-alpn-01" ]] || _exiterr "Unknown challenge type ${CHALLENGETYPE}... cannot continue."
```

チャレンジの種類が、決められた 4 つのどれかであることを確かめます。違えば、そこで終了します。

### 2. 署名の処理なら、追加の条件を確かめる

```bash:line-numbers=370
  if [[ "${COMMAND:-}" =~ sign_domains|sign_csr ]]; then
    if [[ "${CHALLENGETYPE}" = "dns-01" ]] && [[ -z "${HOOK}" ]]; then
      _exiterr "Challenge type dns-01 needs a hook script for deployment... cannot continue."
    fi
    if [[ "${CHALLENGETYPE}" = "http-01" ]] && [[ ! -d "${WELLKNOWN}" ]]; then
      _exiterr "WELLKNOWN directory doesn't exist, please create ${WELLKNOWN} and set appropriate permissions."
    fi
  fi
```

証明書に署名する処理のときだけ、`dns-01` にはフックのスクリプトが必要で、`http-01` には公開用のディレクトリが必要だと確かめます。

### 3. 鍵のアルゴリズムと IP のバージョンを確かめる

```bash:line-numbers=378
  [[ "${KEY_ALGO}" == "rsa" || "${KEY_ALGO}" == "prime256v1" || "${KEY_ALGO}" == "secp384r1" || "${KEY_ALGO}" == "secp521r1" ]] || _exiterr "Unknown public key algorithm ${KEY_ALGO}... cannot continue."
  if [[ -n "${IP_VERSION}" ]]; then
    [[ "${IP_VERSION}" = "4" || "${IP_VERSION}" = "6" ]] || _exiterr "Unknown IP version ${IP_VERSION}... cannot continue."
  fi
```

鍵のアルゴリズムが決められた候補のどれかか、また IP のバージョンが 4 か 6 かを確かめます。

### 4. 数値の設定を確かめる

```bash:line-numbers=382
  [[ "${API}" == "auto" || "${API}" == "1" || "${API}" == "2" ]] || _exiterr "Unsupported API version defined in config: ${API}"
  [[ "${OCSP_DAYS}" =~ ^[0-9]+$ ]] || _exiterr "OCSP_DAYS must be a number"
  [[ "${ORDER_TIMEOUT}" =~ ^[0-9]+$ ]] || _exiterr "ORDER_TIMEOUT must be a number"
  [[ "${VALIDATION_TIMEOUT}" =~ ^[0-9]+$ ]] || _exiterr "VALIDATION_TIMEOUT must be a number"
```

API のバージョン、OCSP の日数、タイムアウトなどが、正しい形かを確かめます。数字として読めない値は、ここで弾かれます。

## ここがすごい

- **まとめて検査する**: 処理の途中ではなく、最初に一度だけ検査します。間違いを早く、分かりやすく伝えられます。
- **メッセージが具体的**: どの設定が何で間違っているかを、表示しています。使う人が、そのまま設定を直せます。
- **正規表現で数字を確かめる**: 数字かどうかを、`^[0-9]+$` という 1 行で確かめています。

## まとめ

- 設定の検査は、処理を始める前に一度にまとめて行う。
- エラーには、どこが何で間違っているかを書く。
- 許された値は、1 つずつ条件として並べると読みやすい。
