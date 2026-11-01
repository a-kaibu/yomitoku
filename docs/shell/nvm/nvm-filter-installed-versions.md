---
title: "awk の BEGIN で記録ファイルを読み込み、辞書で絞り込む"
description: "インストール済みのバージョン一覧を LTS かどうかなどで絞り込む関数。awk の getline で別ファイルを辞書に読み込み、カンマで挟んだ文字列で所属を判定する。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [2244, 2274]
function: "nvm_filter_installed_versions"
difficulty: 3
format: 2
tags: [文字列処理, データ構造, イディオム]
---
## ひとことで

`nvm_filter_installed_versions` は、標準入力から受け取ったバージョンの一覧を、ユーザーが選んだ **カテゴリ**（`lts`、`non-lts`、`iojs`、`alpha`）に当てはまるものだけに絞り込む関数です。

たとえば `NVM_ONLY=lts` なら、`v20.11.0`（LTS）は残り、`v21.6.0`（LTS ではない）は消えます。どのバージョンが LTS かは、記録ファイルに保存されています。

## コード

```sh:line-numbers=2244
nvm_filter_installed_versions() {
  local NVM_NEEDS_LTS_STATUS
  NVM_NEEDS_LTS_STATUS=0
  if nvm_needs_lts_status "${NVM_ONLY_SELECTED:-${NVM_ONLY:-lts,non-lts,iojs}}"; then
    NVM_NEEDS_LTS_STATUS=1
    if [ ! -f "$(nvm_lts_status_path)" ]; then
      nvm_err 'The LTS status of installed versions is not recorded yet; run `nvm ls-remote` to record it.'
      return 3
    fi
  fi
  command awk \
    -v only=",${NVM_ONLY_SELECTED:-${NVM_ONLY:-lts,non-lts,iojs}}," \
    -v needs_lts_status="${NVM_NEEDS_LTS_STATUS}" \
    -v record="$(nvm_lts_status_path)" '
    BEGIN {
      if (needs_lts_status) {
        while ((getline line < record) > 0) {
          split(line, fields, " ");
          lts[fields[1]] = fields[2];
        }
      }
    }
    {
      if ($1 == "system" || $1 == "N/A") { print; next }
      if ($1 ~ /^iojs-/) { category = "iojs" }
      else if ($1 ~ /^v[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+\.[0-9]+\.[0-9]+$/) { category = "alpha" }
      else if (!needs_lts_status) { category = index(only, ",lts,") ? "lts" : "non-lts" }
      else { category = (($1 in lts) && lts[$1] != "-") ? "lts" : "non-lts" }
      if (index(only, "," category ",")) { print }
    }'
}
```

## 前提知識

- **`${A:-${B:-既定値}}`**: A が空なら B、B も空なら既定値、という二段の既定値です。
- **`awk -v 名前=値`**: シェルの値を awk の変数に渡します。
- **`getline line < ファイル`**: awk で、別のファイルから 1 行読み込みます。成功すると 1、終わりで 0、エラーで -1 を返すので、`> 0` の間ループします。
- **awk の連想配列**: `lts["v20.11.0"] = "iron"` のように、文字列をキーにした辞書として使えます。`(キー in 配列)` でキーがあるかを調べます。
- **`$1 ~ /正規表現/`**: 1 列目が正規表現に一致するかを調べます。
- **`print; next`**: 今の行をそのまま出力し、次の行へ進みます。
- **`index(s, t)`**: `s` に `t` が含まれていれば位置（1 以上）、なければ 0 を返します。

## 何をしているか

### 1. LTS の記録が必要か調べる

```sh:line-numbers=2250
      nvm_err 'The LTS status of installed versions is not recorded yet; run `nvm ls-remote` to record it.'
```


選ばれたカテゴリによっては、LTS かどうかを区別する必要があります。必要なのに記録ファイルが無ければ、`nvm ls-remote` を実行するよう案内して終わります。

### 2. カテゴリをカンマで挟んで渡す

`only` には `,lts,non-lts,iojs,` のように **前後にカンマを付けた** 文字列を渡します。

### 3. 記録を辞書に読む

```sh:line-numbers=2258
    BEGIN {
```


`BEGIN` で記録ファイルを 1 行ずつ読みます。各行は `v20.11.0 iron` のような「バージョン 名前」の形で、LTS でないものは名前が `-` です。これを `lts` 辞書に入れます。

### 4. 1 行ずつカテゴリを決める

```sh:line-numbers=2267
      if ($1 == "system" || $1 == "N/A") { print; next }
```


- `system` と `N/A` は常に残します。
- `iojs-` で始まれば `iojs`、alpha の形なら `alpha` です。
- LTS の区別が要らなければ、`lts` が選ばれているかだけで決めます。
- それ以外は辞書を引き、名前が `-` 以外なら `lts`、それ以外は `non-lts` です。

最後に `,カテゴリ,` が `only` に含まれていれば出力します。

## ここがすごい

- **カンマで挟んで部分一致の誤判定を防ぐ**: `index("lts,non-lts", "lts")` は、`non-lts` の中の `lts` にも一致してしまいます。両端にカンマを付けて `",lts,"` で探せば、項目全体としての一致だけを見つけられます。これは文字列でリストを扱うときの定番テクニックです。
- **2 つのファイルを 1 回の awk で結合**: 一覧（標準入力）と記録ファイルを、データベースの結合のように組み合わせています。シェルのループで 1 行ずつ `grep` するより、はるかに速く済みます。
- **必要なときだけ記録を読む**: LTS の区別が要らない場合は `getline` しないので、余計なファイル読み込みがありません。

## まとめ

- 文字列で表したリストの所属判定は、区切り文字で両端を挟むと正確になる。
- awk の `BEGIN` で `getline` を使えば、別ファイルを辞書として読み込める。
- 2 つのデータの突き合わせは、ループより awk 1 回にまとめると速い。
