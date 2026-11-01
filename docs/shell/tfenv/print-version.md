---
title: "導入済みのバージョンを、現在使うものかどうかの印と共に表示する"
description: "1 つのバージョンの行を、CPU の種類と、現在使われているかの印を付けて表示する関数。現在のものには * を付ける。"
language: shell
project: "tfenv"
repo: https://github.com/tfutils/tfenv
license: "MIT"
copyright: "Copyright (c) 2016 Shinichi Ishimura"
commit: "de6ce2e809c155cbc5e2cfeb3b1bef151244e045"
file: "libexec/tfenv-list"
lines: [104, 113]
function: "print_version"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, 文字列処理]
---
## ひとことで

`print_version` は、**インストール済みの 1 つのバージョンを、CPU の種類と現在使用中の印を付けて表示する** 関数です。一覧の 1 行を作る役割を持ちます。

tfenv の `list` は、このバージョンごとの行を並べて出します。今使われているバージョンには `*` が付くので、一覧の中で目立ちます。

## コード

```bash:line-numbers=104
print_version () {
  local arch;
  arch="$(detect_arch "${TFENV_CONFIG_DIR}/versions/${1}/terraform")";
  if [ "${1}" == "${version_name}" ]; then
    echo "* ${1} (${arch}) (set by ${version_source})";
    default_set=1;
  else
    echo "  ${1} (${arch})";
  fi;
};
```

## 前提知識

- **`detect_arch`**: 実行ファイルの CPU の種類を表す関数です。同じファイル内で定義されています。
- **`version_name` と `version_source`**: 現在使うバージョンと、その決まり方を表す変数です。呼び出し側で設定されます。
- **`default_set`**: 現在使うバージョンが一覧に出たかを記録するための変数です。

## 何をしているか

### 1. CPU の種類を調べる

```bash:line-numbers=105
  local arch;
  arch="$(detect_arch "${TFENV_CONFIG_DIR}/versions/${1}/terraform")";
  if [ "${1}" == "${version_name}" ]; then
```

バージョンのフォルダの中の terraform を、`detect_arch` に渡して、CPU の種類を得ます。

### 2. 現在使うものなら印を付ける

```bash:line-numbers=108
    echo "* ${1} (${arch}) (set by ${version_source})";
    default_set=1;
  else
    echo "  ${1} (${arch})";
```

そのバージョンが現在使われているものなら、`*` と、決まり方の説明を付けて表示します。あわせて、一覧に現れたことを記録します。

### 3. それ以外は空白で揃える

```bash:line-numbers=112
  fi;
};
```

現在使われていないものは、`*` の代わりに空白を置きます。これで、名前の位置が全行でそろいます。

## ここがすごい

- **1 行の表示の責任を持つ**: 一覧全体ではなく、1 つのバージョンだけを担当します。繰り返しで、全体の一覧になります。
- **印の位置を揃える**: `*` の代わりに空白を置くので、表の見た目が崩れません。
- **記録を残す**: 現在のバージョンが一覧にあったかを残せるので、後で「見つからなかった」場合も扱えます。

## まとめ

- 一覧は、1 行を作る関数に分けると、繰り返しで組み立てられる。
- 印のあるなしは、同じ幅の空白で揃えると見やすい。
- 一覧に現れたかどうかを記録しておくと、後の判断に使える。
