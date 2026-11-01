---
title: "ACME アカウントを無効化する"
description: "署名付きの要求で、アカウントの状態を deactivated にし、結果を確かめて印のファイルを作る関数。ACMEv1 では未対応。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [2161, 2179]
function: "command_deactivate"
difficulty: 3
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`command_deactivate` は、**ACME のアカウントを、無効の状態にする** 関数です。アカウントを使えなくして、鍵の漏えいなどに備えます。

無効化の要求は、署名付きの通信で送ります。サーバーの応答を読み、確かに無効になったかを確かめてから、完了の印を残します。

## コード

```bash:line-numbers=2161
command_deactivate() {
  init_system

  echo "Deactivating account ${ACCOUNT_URL}"

  if [[ ${API} -eq 1 ]]; then
    echo "Deactivation for ACMEv1 is not implemented"
  else
    response="$(signed_request "${ACCOUNT_URL}" '{"status": "deactivated"}' | clean_json)"
    deactstatus=$(echo "$response" | jsonsh | get_json_string_value "status")
    if [[ "${deactstatus}" = "deactivated" ]]; then
      touch "${ACCOUNT_DEACTIVATED}"
    else
      _exiterr "Account deactivation failed!"
    fi
  fi

  echo " + Done."
}
```

## 前提知識

- **ACME アカウント**: 証明書の発行をサーバーに頼むための、利用者の登録情報です。
- **署名付きの要求**: 利用者の鍵で署名した通信です。サーバーは、その署名で本人を確かめます。
- **`signed_request`**: 署名付きの要求を送る、同じファイル内の関数です。
- **`jsonsh` と `get_json_string_value`**: JSON の応答から、特定の値を取り出すための関数です。
- **`touch`**: 空のファイルを作る命令です。ここでは、完了の印として使われます。

## 何をしているか

### 1. 初期化して、対象を表示する

```bash:line-numbers=2162
  init_system

  echo "Deactivating account ${ACCOUNT_URL}"

```

設定を整え、無効化するアカウントの URL を表示します。

### 2. ACMEv1 は未対応として扱う

```bash:line-numbers=2167
    echo "Deactivation for ACMEv1 is not implemented"
  else
```

API のバージョンが 1 のときは、無効化の処理が実装されていないことを表示します。

### 3. 署名付きで無効化を要求する

```bash:line-numbers=2170
    deactstatus=$(echo "$response" | jsonsh | get_json_string_value "status")
    if [[ "${deactstatus}" = "deactivated" ]]; then
```

`status` を `deactivated` にする要求を送り、応答の JSON を整えます。

### 4. 応答を確かめて印を残す

```bash:line-numbers=2172
      touch "${ACCOUNT_DEACTIVATED}"
    else
      _exiterr "Account deactivation failed!"
    fi
  fi

  echo " + Done."
```

応答の `status` が `deactivated` なら、完了の印のファイルを作ります。違えば、失敗としてエラーで止めます。

## ここがすごい

- **結果を必ず確かめる**: 要求を送っただけで成功とせず、応答の状態を読んでから判断します。
- **対応していない版を明示する**: 未実装の版は、黙って何もしないのではなく、その旨を伝えます。
- **印で状態を残す**: 完了を示すファイルがあれば、後の処理が無効化の済みを判断できます。

## まとめ

- 取り消しの操作は、送るだけでなく応答で結果を確かめる。
- 未対応の機能は、その旨を利用者に示す。
- 完了の状態は、印のファイルなどで後から確かめられるようにする。
