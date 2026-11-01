---
title: "ACME アカウントを登録して、終わる"
description: "初期化の処理を行い、アカウントの登録を済ませたことを表示して終了する関数。コマンドの一つとして使われる。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1780, 1784]
function: "command_register"
difficulty: 1
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`command_register` は、**ACME のアカウントを登録する** 指定に対応する関数です。`dehydrated --register` という指定で、この関数が呼ばれます。

証明書の発行を頼むには、まず認証局にアカウントを作る必要があります。この関数は、その登録の処理を行ったうえで、結果を伝えて終わります。

## コード

```bash:line-numbers=1780
command_register() {
  init_system
  echo "+ Done!"
  exit 0
}
```

## 前提知識

- **アカウント登録**: 認証局に、利用者の鍵を結びつけて、アカウントを作る手続きです。
- **`init_system`**: 設定や環境を整える、同じファイル内の関数です。登録の前に、必ず呼ばれます。
- **`exit 0`**: 正常終了を示して、スクリプトを止めます。
- **コマンドの関数**: `dehydrated` の指定ごとに、この形の関数が用意されています。

## 何をしているか

### 1. 環境を整える

```bash:line-numbers=1781
  init_system
```

`init_system` を呼んで、設定や鍵などの準備を整えます。登録に必要なものが、この時点でそろいます。

### 2. 完了を表示して終わる

```bash:line-numbers=1782
  echo "+ Done!"
  exit 0
```

登録が済んだことを表示し、正常終了で止めます。

## ここがすごい

- **準備と処理を分ける**: 登録の本体は共通の準備に任せ、この関数は呼び出しの形だけを担当しています。
- **同じ形で揃える**: 他のコマンドの関数と同じ書き方なので、追加や読み解きがしやすいです。
- **終了の意味が明確**: 完了のメッセージと正常終了で、利用者は登録の成功を確かめられます。

## まとめ

- 指定ごとの処理は、共通の準備を通す形にそろえると読みやすい。
- 完了の表示と終了コードを対にすると、結果が明確になる。
- 同じ形の関数を並べると、新しい指定を足しやすい。
