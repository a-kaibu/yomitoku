---
title: "設定ファイルの値を、退避用の変数へコピーしておく"
description: "設定の値（鍵のアルゴリズムや待ち時間など）を、別名の変数へ退避する関数。あとで元に戻すための準備として使われる。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [315, 335]
function: "store_configvars"
difficulty: 1
format: 2
tags: [イディオム, 状態機械, API設計]
---
## ひとことで

`store_configvars` は、設定の変数（`KEY_ALGO` や `HOOK` など）の **今の値を、`__` で始まる別の変数へコピーして保存** する関数です。対になる `reset_configvars` が、その値を元に戻します。

dehydrated は、コマンドを実行するときに、設定の値を一時的に変えることがあります。そのとき、元の設定を失わないように、先に退避しておく必要があります。この関数は、その退避の部分です。

## コード

```bash:line-numbers=315
store_configvars() {
  __KEY_ALGO="${KEY_ALGO}"
  __OCSP_MUST_STAPLE="${OCSP_MUST_STAPLE}"
  __OCSP_FETCH="${OCSP_FETCH}"
  __OCSP_DAYS="${OCSP_DAYS}"
  __PRIVATE_KEY_RENEW="${PRIVATE_KEY_RENEW}"
  __PRIVATE_KEY_ROLLOVER="${PRIVATE_KEY_ROLLOVER}"
  __KEYSIZE="${KEYSIZE}"
  __CHALLENGETYPE="${CHALLENGETYPE}"
  __HOOK="${HOOK}"
  __PREFERRED_CHAIN="${PREFERRED_CHAIN}"
  __WELLKNOWN="${WELLKNOWN}"
  __HOOK_CHAIN="${HOOK_CHAIN}"
  __OPENSSL_CNF="${OPENSSL_CNF}"
  __RENEW_DAYS="${RENEW_DAYS}"
  __IP_VERSION="${IP_VERSION}"
  __ACME_PROFILE="${ACME_PROFILE}"
  __ORDER_TIMEOUT=${ORDER_TIMEOUT}
  __VALIDATION_TIMEOUT=${VALIDATION_TIMEOUT}
  __KEEP_GOING=${KEEP_GOING}
}
```

## 前提知識

- **変数の展開 `"${変数}"`**: 変数の値を取り出します。ダブルクォートで囲むと、空白を含んでいても 1 つの値として扱われます。
- **代入 `変数="値"`**: 変数に値を入れます。
- **`__` で始まる名前**: ここでは、退避用の変数であることを示す目印として使われています。
- **クォートの有無**: 一部の代入（`__ORDER_TIMEOUT=${ORDER_TIMEOUT}` など）は、ダブルクォートなしで書かれています。値に空白が無いことが前提の書き方なので、ほかの行と違う点として読んでおくと分かりやすくなります。

## 何をしているか

### 1. 文字列の設定を退避する

```bash:line-numbers=316
  __KEY_ALGO="${KEY_ALGO}"
  __OCSP_MUST_STAPLE="${OCSP_MUST_STAPLE}"
  __OCSP_FETCH="${OCSP_FETCH}"
  __OCSP_DAYS="${OCSP_DAYS}"
```

鍵の種類、OCSP の設定、更新の日数など、文字列として扱う設定を、`__` 付きの変数へコピーします。

### 2. 他の設定も退避する

```bash:line-numbers=320
  __PRIVATE_KEY_RENEW="${PRIVATE_KEY_RENEW}"
  __PRIVATE_KEY_ROLLOVER="${PRIVATE_KEY_ROLLOVER}"
  __KEYSIZE="${KEYSIZE}"
  __CHALLENGETYPE="${CHALLENGETYPE}"
  __HOOK="${HOOK}"
  __PREFERRED_CHAIN="${PREFERRED_CHAIN}"
  __WELLKNOWN="${WELLKNOWN}"
  __HOOK_CHAIN="${HOOK_CHAIN}"
  __OPENSSL_CNF="${OPENSSL_CNF}"
  __RENEW_DAYS="${RENEW_DAYS}"
  __IP_VERSION="${IP_VERSION}"
  __ACME_PROFILE="${ACME_PROFILE}"
```

鍵の更新、チャレンジの種類、フック、チェーンの選び方など、残りの設定も同じ方法で退避します。

### 3. 数値の設定を退避する

```bash:line-numbers=332
  __ORDER_TIMEOUT=${ORDER_TIMEOUT}
  __VALIDATION_TIMEOUT=${VALIDATION_TIMEOUT}
  __KEEP_GOING=${KEEP_GOING}
```

タイムアウトやリトライの設定は、数値として扱います。これらもコピーしておきます。

ここで保存された値は、処理が終わったあとに `reset_configvars` で元に戻されます。

## ここがすごい

- **同じ形を並べて読みやすい**: 1 行ごとに、元の変数から退避用の変数へ、ほとんど同じ形で代入しています。何を守っているかが一目で分かります。
- **対になる関数がある**: 保存する関数と戻す関数をペアにすることで、設定を変えても後始末を確実に行えます。
- **変数を直接読むだけ**: 外部のコマンドを使わず、代入だけで済ませています。処理が軽く、確実です。

## まとめ

- 一時的に設定を変えるときは、元の値を先に退避する。
- 退避と復元は、ペアの関数にすると後始末を忘れにくい。
- 退避用の変数に目印の接頭辞を付けると、どれが退避用か分かりやすい。
