---
title: "名前空間を、コンテキストごとのファイルに保存する"
description: "コンテキストに対応する保存先のディレクトリを作り、保存されている値と違うときだけ、名前空間をファイルに書き込む関数。"
language: shell
project: "kubens"
repo: https://github.com/ahmetb/kubectx
license: "Apache-2.0"
copyright: "Copyright 2017 Google LLC"
commit: "12ad6fb22e8c546ee2b54e7de38aa51c906832f7"
file: "kubens"
lines: [94, 103]
function: "save_namespace"
difficulty: 2
format: 2
tags: [ファイル, 状態機械, 最適化]
---
## ひとことで

`save_namespace コンテキスト名 名前空間` は、**コンテキストごとに選んだ名前空間をファイルに記録** する関数です。次に同じコンテキストを使うとき、その名前空間へ戻るために使われます。

kubens は、コンテキストを切り替えるたびに、その中で最後に選んだ名前空間を覚えておきます。その記録を、ファイルに残すのがこの関数の役割です。

## コード

```bash:line-numbers=94
save_namespace() {
  mkdir -p "${KUBENS_DIR}"
  local f saved
  f="$(namespace_file "${1}")"
  saved="$(read_namespace "${1}")"

  if [[ "${saved}" != "${2}" ]]; then
    printf %s "${2}" > "${f}"
  fi
}
```

## 前提知識

- **`mkdir -p`**: 途中のディレクトリもまとめて作ります。すでにあっても、エラーになりません。
- **`read_namespace`**: 保存されている名前空間を読み出す関数です。
- **`namespace_file`**: コンテキスト名から、保存先のファイルのパスを作る関数です。
- **`local f saved`**: 関数の中だけで使う変数を、2 つまとめて宣言しています。

## 何をしているか

### 1. 保存先のディレクトリを作る

```bash:line-numbers=95
  mkdir -p "${KUBENS_DIR}"
```

保存用のディレクトリが無ければ作ります。すでにあれば、何もしません。

### 2. 保存先と、今の値を調べる

```bash:line-numbers=97
  f="$(namespace_file "${1}")"
  saved="$(read_namespace "${1}")"
```

コンテキスト名からファイルのパスを作り、今保存されている値を読み出します。

### 3. 違うときだけ書き込む

```bash:line-numbers=100
  if [[ "${saved}" != "${2}" ]]; then
    printf %s "${2}" > "${f}"
  fi
```

保存されている値と新しい値が違うときだけ、`printf` でファイルに書き込みます。同じなら、書き込みを省きます。

## ここがすごい

- **準備を関数の中で済ませる**: ディレクトリの作成を毎回行っても、`mkdir -p` は既存の場合に失敗しないので、安全に繰り返せます。
- **不要な書き込みを省く**: 前の記事と同じく、同じ値の書き込みを避けて、ファイルへの負担を減らしています。
- **保存の仕組みを部品で組む**: 保存先の決定、読み出し、書き込みを、それぞれの関数に分けています。どの部分も単独で読めます。

## まとめ

- 保存の前には、保存先のディレクトリを作っておく。
- `mkdir -p` は、既にあっても安全に呼べる。
- 同じ値の書き込みを避けると、無駄な更新を減らせる。
