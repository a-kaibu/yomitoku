---
title: "lts/-1 を「1 つ前の LTS 名」に変換する"
description: "lts/-1 のような相対指定を、エイリアスのディレクトリを ls して tail と head で数えることで lts/iron のような実際の名前に変える関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1447, 1484]
function: "nvm_normalize_lts"
difficulty: 2
tags: [ファイル, 文字列処理, CLI]
---
## ひとことで

`nvm_normalize_lts` は、`lts/-1` のような **相対的な LTS の指定** を、`lts/iron` のような実際の名前に変換します。`lts/-1` は「最新の 1 つ前の LTS」、`lts/-2` は「2 つ前」という意味です。

LTS（長期サポート版）には `hydrogen`、`iron`、`jod` などのコードネームがあり、nvm はそれぞれを `~/.nvm/alias/lts/` の下にファイルとして保存しています。この関数はそのファイル一覧を使って数えます。

## コード

```sh:line-numbers=1447
nvm_normalize_lts() {
  local LTS
  LTS="${1-}"

  case "${LTS}" in
    lts/-[123456789] | lts/-[123456789][0123456789]*)
      local N
      N="$(echo "${LTS}" | cut -d '-' -f 2)"
      N=$((N+1))
      # shellcheck disable=SC2181
      if [ $? -ne 0 ]; then
        nvm_echo "${LTS}"
        return 0
      fi
      local NVM_ALIAS_DIR
      NVM_ALIAS_DIR="$(nvm_alias_path)"
      local RESULT
      RESULT="$(command ls "${NVM_ALIAS_DIR}/lts" | command tail -n "${N}" | command head -n 1)"
      if [ "${RESULT}" != '*' ]; then
        nvm_echo "lts/${RESULT}"
      else
        nvm_err 'That many LTS releases do not exist yet.'
        return 2
      fi
    ;;
    *)
      case "${LTS}" in
        lts/*)
          if [ "${LTS}" != "$(echo "${LTS}" | command tr '[:upper:]' '[:lower:]')" ]; then
            nvm_err 'LTS names must be lowercase'
            return 3
          fi
        ;;
      esac
      nvm_echo "${LTS}"
    ;;
  esac
}
```

## 前提知識

- **LTS**: Long Term Support の略。長く保守される安定版の Node.js です。
- **`case` のパターン `lts/-[123456789]`**: `[...]` は「中のどれか 1 文字」です。`lts/-1`〜`lts/-9` に一致します。2 つ目のパターン `lts/-[1-9][0-9]*` に相当する部分で 2 桁以上にも対応しています。
- **`cut -d '-' -f 2`**: `-` で区切った 2 番目の部分を取り出します。`lts/-1` なら `1` です。
- **`$((N+1))`**: 算術式で 1 を足します。
- **`ls ディレクトリ`**: 中のファイル名を一覧します。出力をパイプに渡すと 1 行に 1 つずつ、名前順に並びます。
- **`tail -n N`**: 最後の N 行を出力します。
- **`head -n 1`**: 最初の 1 行を出力します。
- **`tr '[:upper:]' '[:lower:]'`**: 大文字を小文字に変えます。

## 何をしているか

### 1. 相対指定のとき（1452〜1471 行目）

`lts/-1` なら `N=1`、そこに 1 を足して `N=2` にします。

`~/.nvm/alias/lts/` に `argon`、`boron`、…、`hydrogen`、`iron`、`jod` と `*`（最新の LTS を指すエイリアス）が並んでいるとします。`ls` は名前順に並べるので、記号の `*` が先頭に来て、ほかはアルファベット順です。

Node.js の LTS のコードネームは、元素名をアルファベット順に付けていく決まりがあります。そのため **名前順に並べるとリリース順になり**、最後が最新の LTS です。`tail -n 2` で最後の 2 つ（`iron`、`jod`）を取り、`head -n 1` でその最初の `iron` を選びます。これが「1 つ前の LTS」です。

数えすぎてリストの先頭の `*` まで来てしまったら、そこまで古い LTS は無いのでエラーにします（1465〜1470 行目）。

### 2. それ以外（1472〜1482 行目）

`lts/` で始まる名前が大文字を含んでいたらエラーにし（エイリアス名は小文字で保存されているため）、問題なければそのまま返します。

## ここがすごい

- **命名規則をデータ構造として使う**: コードネームがアルファベット順に付けられているという Node.js の決まりのおかげで、「ファイル名で並べる」だけでリリース順の一覧が手に入ります。日付やバージョン番号を読む処理は要りません。
- **`tail` と `head` で「後ろから N 番目」**: 配列の無いシェルで「後ろから N 番目の要素」を取る、定番の組み合わせです。
- **`*` を番兵に使う**: 記号のファイル名が名前順で必ず先頭に来ることを利用して、「数えすぎ」を検出しています。

## まとめ

- `tail -n N | head -n 1` で、一覧の後ろから N 番目を取り出せる。
- 名前の付け方に規則があれば、並べ替えだけで順序の情報が得られる。
- ファイルシステムを簡単なデータベースとして使うと、シェルで扱いやすい。
