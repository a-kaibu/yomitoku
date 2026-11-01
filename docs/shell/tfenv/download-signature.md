---
title: "検証用の署名ファイルを、ダウンロードする"
description: "チェックサムの署名ファイルを取得し、成功と失敗をログに残す関数。ダウンロードの先は一時ディレクトリに限る。"
language: shell
project: "tfenv"
repo: https://github.com/tfutils/tfenv
license: "MIT"
copyright: "Copyright (c) 2016 Shinichi Ishimura"
commit: "de6ce2e809c155cbc5e2cfeb3b1bef151244e045"
file: "libexec/tfenv-install"
lines: [303, 310]
function: "download_signature"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`download_signature` は、**インストールするファイルの正しさを確かめるための署名ファイルを、ダウンロードする** 関数です。取得の結果は、ログに残します。

tfenv は、配布元の署名で、ダウンロードしたファイルが改ざんされていないかを確かめます。その前段として、署名のファイルを手に入れるのがこの関数の役目です。

## コード

```bash:line-numbers=303
download_signature() {
  log 'info' "Downloading SHA hash signature file from ${version_url}/${shasums_sig}";
  curlw -s -f -L \
    -o "${download_tmp}/${shasums_sig}" \
    "${version_url}/${shasums_sig}" \
    && log 'debug' "SHA256SUMS signature file downloaded successfully to ${download_tmp}/${shasums_sig}" \
    || log 'error' 'SHA256SUMS signature download failed';
};
```

## 前提知識

- **署名**: 配布元が、ファイルの内容から作った証明のデータです。正しい署名があれば、内容が変わっていないと確かめられます。
- **SHA256SUMS**: ファイルの SHA256 の値を並べた一覧です。その一覧に署名したものが、署名ファイルです。
- **`curlw`**: この実装で定義された、curl の包みです。
- **`curl -s -f -L -o`**: 静かに、失敗を正しく返し、リダイレクトに従い、指定のファイルへ保存する指定です。
- **`log`**: 同じファイル内で定義された、段階付きのログを出す関数です。

## 何をしているか

### 1. 取得を始めることを記録する

```bash:line-numbers=304
  log 'info' "Downloading SHA hash signature file from ${version_url}/${shasums_sig}";
```

署名ファイルの取得を始めるという情報を、ログに残します。

### 2. 署名ファイルをダウンロードする

```bash:line-numbers=305
  curlw -s -f -L \
    -o "${download_tmp}/${shasums_sig}" \
    "${version_url}/${shasums_sig}" \
    && log 'debug' "SHA256SUMS signature file downloaded successfully to ${download_tmp}/${shasums_sig}" \
```

`curlw` で、署名ファイルを一時ディレクトリに保存します。失敗したら、エラーを返すように指定しています。

### 3. 結果をログに残す

```bash:line-numbers=308
    && log 'debug' "SHA256SUMS signature file downloaded successfully to ${download_tmp}/${shasums_sig}" \
    || log 'error' 'SHA256SUMS signature download failed';
```

成功なら、保存先と成功を示すログを残します。失敗なら、エラーのログを残します。

## ここがすごい

- **保存先を一時的な場所に限る**: 取得したファイルを、作業用の一時ディレクトリに置くので、本体のファイルを壊しません。
- **失敗を検知する**: `-f` の指定で、サーバーのエラーを成功として扱わないようにしています。
- **結果を必ず記録する**: 成功と失敗のどちらも、ログに残るので、後から原因を追えます。

## まとめ

- 検証のための材料は、一時的な場所に保存して本体を守る。
- 通信の失敗は、取得の道具に検知させると見逃しが減る。
- 成功と失敗の両方をログに残すと、問題の追跡が楽になる。
